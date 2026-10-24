
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Relax.Api.Data;
using Relax.Api.Models;

namespace Relax.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly RelaxDbContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        RelaxDbContext context,
        IPasswordHasher<Usuario> passwordHasher,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    // =====================================
    // 1. MODELOS DAS REQUISIÇÕES
    // =====================================

    public record CadastroRequest(
        string Nome,
        string Email,
        string Senha
    );

    public record LoginRequest(
        string Email,
        string Senha
    );

    // =====================================
    // 2. CONFIGURAÇÕES JWT
    // =====================================

    private string ObterConfiguracao(
        string variavelAmbiente,
        string configuracaoLocal)
    {
        var valor = Environment.GetEnvironmentVariable(
            variavelAmbiente);

        if (string.IsNullOrWhiteSpace(valor))
        {
            valor = _configuration[configuracaoLocal];
        }

        if (string.IsNullOrWhiteSpace(valor))
        {
            throw new InvalidOperationException(
                $"Configuração obrigatória ausente: {configuracaoLocal}");
        }

        return valor.Trim();
    }

    // =====================================
    // 3. CADASTRO DE USUÁRIO
    // POST /api/auth/cadastro
    // =====================================

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastro(
        [FromBody] CadastroRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nome) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Senha))
        {
            return BadRequest(new
            {
                mensagem = "Preencha todos os campos."
            });
        }

        var nome = request.Nome.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        if (nome.Length > 150 ||
            email.Length > 255 ||
            !MailAddress.TryCreate(email, out var endereco) ||
            endereco.Address != email)
        {
            return BadRequest(new
            {
                mensagem = "Nome ou e-mail inválido."
            });
        }

        if (request.Senha.Length < 8)
        {
            return BadRequest(new
            {
                mensagem = "A senha deve ter pelo menos 8 caracteres."
            });
        }

        var emailExiste = await _context.Usuarios
            .AnyAsync(u => u.Email == email);

        if (emailExiste)
        {
            return Conflict(new
            {
                mensagem = "Este e-mail já está cadastrado."
            });
        }

        var usuario = new Usuario
        {
            Nome = nome,
            Email = email,
            Perfil = PerfilUsuario.Cliente,
            Ativo = true,
            DataCadastro = DateTime.UtcNow
        };

        usuario.PasswordHash =
            _passwordHasher.HashPassword(
                usuario,
                request.Senha
            );

        _context.Usuarios.Add(usuario);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(
                ex,
                "Falha ao salvar cadastro de usuário.");

            return Conflict(new
            {
                mensagem = "Não foi possível concluir o cadastro. Verifique o e-mail informado."
            });
        }

        return StatusCode(201, new
        {
            mensagem = "Usuário cadastrado com sucesso!",
            usuario = new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Email,
                perfil = usuario.Perfil.ToString()
            }
        });
    }

    // =====================================
    // 4. LOGIN E AUTENTICAÇÃO JWT
    // POST /api/auth/login
    // =====================================

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        var email = request.Email?
            .Trim()
            .ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrEmpty(request.Senha))
        {
            return Unauthorized(new
            {
                mensagem = "E-mail ou senha inválidos."
            });
        }

        // Consulta o usuário no SQL Server.
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email);

        if (usuario == null || !usuario.Ativo)
        {
            return Unauthorized(new
            {
                mensagem = "E-mail ou senha inválidos."
            });
        }

        // Verifica a senha armazenada como hash.
        var resultado =
            _passwordHasher.VerifyHashedPassword(
                usuario,
                usuario.PasswordHash,
                request.Senha
            );

        if (resultado == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                mensagem = "E-mail ou senha inválidos."
            });
        }

        // =====================================
        // 5. CLAIMS DO USUÁRIO
        // =====================================

        var claims = new List<Claim>
        {
            new(
                ClaimTypes.NameIdentifier,
                usuario.Id.ToString()
            ),
            new(
                ClaimTypes.Name,
                usuario.Nome
            ),
            new(
                ClaimTypes.Email,
                usuario.Email
            ),
            new(
                ClaimTypes.Role,
                usuario.Perfil.ToString()
            )
        };

        // =====================================
        // 6. CONFIGURAÇÕES JWT
        // =====================================

        var jwtKey = ObterConfiguracao(
            "RELAX_Jwt__Key",
            "Jwt:Key"
        );

        var jwtIssuer = ObterConfiguracao(
            "RELAX_Jwt__Issuer",
            "Jwt:Issuer"
        );

        var jwtAudience = ObterConfiguracao(
            "RELAX_Jwt__Audience",
            "Jwt:Audience"
        );

        // A chave JWT está codificada em Base64.
        byte[] chaveBytes;

        try
        {
            chaveBytes = Convert.FromBase64String(jwtKey);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "A configuração JWT contém uma chave Base64 inválida.",
                ex
            );
        }

        if (chaveBytes.Length < 32)
        {
            throw new InvalidOperationException(
                "A chave JWT deve possuir pelo menos 256 bits."
            );
        }

        var chave = new SymmetricSecurityKey(
            chaveBytes
        );

        var credenciais = new SigningCredentials(
            chave,
            SecurityAlgorithms.HmacSha256
        );

        // =====================================
        // 7. GERAÇÃO DO TOKEN
        // =====================================

        var expiracao = DateTime.UtcNow.AddHours(2);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expiracao,
            signingCredentials: credenciais
        );

        var tokenGerado =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        // =====================================
        // 8. RESPOSTA DO LOGIN
        // =====================================

        return Ok(new
        {
            token = tokenGerado,
            expiracao,
            usuario = new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Email,
                perfil = usuario.Perfil.ToString()
            }
        });
    }
}

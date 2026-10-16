
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    public AuthController(
        RelaxDbContext context,
        IPasswordHasher<Usuario> passwordHasher,
        IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    public record CadastroRequest(
        string Nome,
        string Email,
        string Senha
    );

    public record LoginRequest(
        string Email,
        string Senha
    );

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

        if (nome.Length > 150 || email.Length > 255 ||
            !System.Net.Mail.MailAddress.TryCreate(email, out var endereco) ||
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
            _passwordHasher.HashPassword(usuario, request.Senha);

        _context.Usuarios.Add(usuario);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
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

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        var email = request.Email?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrEmpty(request.Senha))
        {
            return Unauthorized(new
            {
                mensagem = "E-mail ou senha inválidos."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email);

        if (usuario == null || !usuario.Ativo)
        {
            return Unauthorized(new
            {
                mensagem = "E-mail ou senha inválidos."
            });
        }

        var resultado = _passwordHasher.VerifyHashedPassword(
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

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Nome),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Role, usuario.Perfil.ToString())
        };

        var chave = new SymmetricSecurityKey(
            Convert.FromBase64String(_configuration["Jwt:Key"]!)
        );

        var credenciais = new SigningCredentials(
            chave,
            SecurityAlgorithms.HmacSha256
        );

        var expiracao = DateTime.UtcNow.AddHours(2);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiracao,
            signingCredentials: credenciais
        );

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
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

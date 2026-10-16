
using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relax.Api.Data;
using Relax.Api.Models;

namespace Relax.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "AdmMaster,Professor")]
public class UsuariosController : ControllerBase
{
    private readonly RelaxDbContext _context;

    public UsuariosController(RelaxDbContext context)
    {
        _context = context;
    }

    // =====================================
    // 1. PESQUISAR USUÁRIOS
    // GET /api/usuarios?busca=nome
    // =====================================

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? busca)
    {
        var consulta = _context.Usuarios
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim();

            consulta = consulta.Where(u =>
                u.Nome.Contains(termo) ||
                u.Email.Contains(termo));
        }

        var usuarios = await consulta
            .OrderBy(u => u.Nome)
            .Take(50)
            .Select(u => new
            {
                u.Id,
                u.Nome,
                u.Email,
                Perfil = u.Perfil.ToString(),
                u.Ativo,
                u.DataCadastro
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    // =====================================
    // 2. ALTERAR PERFIL DO USUÁRIO
    // PATCH /api/usuarios/{id}/perfil
    // =====================================

    public record AlterarPerfilRequest(
        PerfilUsuario Perfil
    );

    [HttpPatch("{id:int}/perfil")]
    public async Task<IActionResult> AlterarPerfil(
        int id,
        [FromBody] AlterarPerfilRequest request)
    {
        var perfilAtual = User.FindFirstValue(
            ClaimTypes.Role);

        var idAtual = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        // Impede alterar o próprio perfil.
        if (idAtual == id.ToString())
        {
            return BadRequest(new
            {
                mensagem =
                    "Você não pode alterar seu próprio perfil."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensagem = "Usuário não encontrado."
            });
        }

        if (!usuario.Ativo)
        {
            return BadRequest(new
            {
                mensagem =
                    "Não é possível alterar um usuário inativo."
            });
        }

        // Verifica se o perfil solicitado existe.
        if (!Enum.IsDefined(request.Perfil))
        {
            return BadRequest(new
            {
                mensagem = "Perfil inválido."
            });
        }

        // Ninguém pode promover outro usuário
        // a ADM Master por esta rota.
        if (request.Perfil == PerfilUsuario.AdmMaster ||
            usuario.Perfil == PerfilUsuario.AdmMaster)
        {
            return Forbid();
        }

        // Professores gerenciam somente
        // os perfis Cliente e Aluno.
        if (perfilAtual == "Professor")
        {
            if (usuario.Perfil == PerfilUsuario.Professor ||
                request.Perfil == PerfilUsuario.Professor)
            {
                return Forbid();
            }
        }
        else if (perfilAtual != "AdmMaster")
        {
            return Forbid();
        }

        usuario.Perfil = request.Perfil;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Perfil atualizado com sucesso!",
            usuario = new
            {
                usuario.Id,
                usuario.Nome,
                perfil = usuario.Perfil.ToString()
            }
        });
    }
}

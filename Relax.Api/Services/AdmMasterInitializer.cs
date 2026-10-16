
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Relax.Api.Data;
using Relax.Api.Models;

namespace Relax.Api.Services;

public static class AdmMasterInitializer
{
    public static async Task CriarAsync(
        IServiceProvider services,
        IConfiguration configuration)
    {
        // Inicialização habilitada somente por configuração explícita.
        if (!configuration.GetValue<bool>("BootstrapAdmin:Enabled"))
            return;

        using var scope = services.CreateScope();

        var db = scope.ServiceProvider
            .GetRequiredService<RelaxDbContext>();

        var hasher = scope.ServiceProvider
            .GetRequiredService<IPasswordHasher<Usuario>>();

        // Não criar outro Master se já existir um.
        if (await db.Usuarios.AnyAsync(
            u => u.Perfil == PerfilUsuario.AdmMaster))
        {
            Console.WriteLine(
                "ADM Master já existe. Inicialização ignorada.");
            return;
        }

        var nome = configuration["BootstrapAdmin:Nome"]?.Trim();
        var email = configuration["BootstrapAdmin:Email"]?
            .Trim().ToLowerInvariant();
        var senha = configuration["BootstrapAdmin:Senha"];

        if (string.IsNullOrWhiteSpace(nome) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(senha) ||
            senha.Length < 12)
        {
            throw new InvalidOperationException(
                "Configure nome, e-mail e senha do ADM Master. " +
                "A senha deve ter pelo menos 12 caracteres.");
        }

        // Não promover automaticamente uma conta existente.
        if (await db.Usuarios.AnyAsync(u => u.Email == email))
        {
            throw new InvalidOperationException(
                "O e-mail do ADM Master já pertence a outro usuário.");
        }

        var master = new Usuario
        {
            Nome = nome,
            Email = email,
            Perfil = PerfilUsuario.AdmMaster,
            Ativo = true,
            DataCadastro = DateTime.UtcNow
        };

        master.PasswordHash =
            hasher.HashPassword(master, senha);

        db.Usuarios.Add(master);
        await db.SaveChangesAsync();

        Console.WriteLine(
            "Conta ADM Master criada com sucesso.");
    }
}

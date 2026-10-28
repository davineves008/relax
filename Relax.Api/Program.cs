
using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Relax.Api.Data;
using Relax.Api.Models;
using Relax.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ======================================
// 1. CONFIGURAÇÕES DO AMBIENTE
// ======================================

// Produção: utiliza variáveis RELAX_.
// Desenvolvimento: permite User Secrets.

string ObterConfiguracao(
    string variavelRelax,
    string configuracaoLocal)
{
    var valorRelax =
        Environment.GetEnvironmentVariable(variavelRelax);

    if (!string.IsNullOrWhiteSpace(valorRelax))
    {
        return valorRelax.Trim();
    }

    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            $"A variável {variavelRelax} não foi configurada."
        );
    }

    var valorLocal =
        builder.Configuration[configuracaoLocal];

    if (string.IsNullOrWhiteSpace(valorLocal))
    {
        throw new InvalidOperationException(
            $"A configuração {configuracaoLocal} não foi encontrada."
        );
    }

    return valorLocal.Trim();
}

// ======================================
// 2. BANCO DE DADOS - SQL SERVER
// ======================================

// Produção:
// RELAX_ConnectionString
//
// Desenvolvimento:
// ConnectionStrings:DefaultConnection

var connectionString = ObterConfiguracao(
    
    "RELAX_ConnectionString",
    "ConnectionStrings:DefaultConnection"
);
var csb = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(connectionString);
Console.WriteLine($"[DEBUG] Servidor: {csb.DataSource} | Banco: {csb.InitialCatalog} | Usuário: {csb.UserID} | Tamanho da senha: {csb.Password.Length}");

builder.Services.AddDbContext<RelaxDbContext>(
    options => options.UseSqlServer(connectionString)
);

// ======================================
// 3. CONTROLLERS E OPENAPI
// ======================================

builder.Services.AddControllers();

builder.Services.AddOpenApi();

// ======================================
// 4. CONFIGURAÇÃO CORS
// ======================================

// Permite acesso do React Native Web
// durante o desenvolvimento local.

builder.Services.AddCors(options =>
{
    options.AddPolicy("RelaxWeb", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:8082"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ======================================
// 5. SEGURANÇA DAS SENHAS
// ======================================

builder.Services.AddScoped<
    IPasswordHasher<Usuario>,
    PasswordHasher<Usuario>
>();

// ======================================
// 6. CONFIGURAÇÕES JWT
// ======================================

// Variáveis do SmarterASP.NET:
//
// RELAX_Jwt__Key
// RELAX_Jwt__Issuer
// RELAX_Jwt__Audience

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

// ======================================
// 7. VALIDAÇÃO DA CHAVE JWT
// ======================================

byte[] jwtKeyBytes;

try
{
    jwtKeyBytes = Convert.FromBase64String(jwtKey);
}
catch (FormatException ex)
{
    throw new InvalidOperationException(
        "A chave JWT não está em formato Base64 válido.",
        ex
    );
}

if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "A chave JWT deve conter pelo menos 32 bytes."
    );
}

// ======================================
// 8. AUTENTICAÇÃO JWT
// ======================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                ValidateAudience = true,
                ValidAudience = jwtAudience,

                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(jwtKeyBytes),

                ValidateLifetime = true,

                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role,

                ClockSkew = TimeSpan.FromMinutes(1)
            };

        // ======================================
        // 9. VALIDAR USUÁRIO NO BANCO
        // ======================================

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var idTexto = context.Principal?
                    .FindFirst(ClaimTypes.NameIdentifier)?
                    .Value;

                var perfilToken = context.Principal?
                    .FindFirst(ClaimTypes.Role)?
                    .Value;

                if (!int.TryParse(
                    idTexto,
                    out var usuarioId))
                {
                    context.Fail("Usuário inválido.");
                    return;
                }

                var db = context.HttpContext
                    .RequestServices
                    .GetRequiredService<RelaxDbContext>();

                var usuario = await db.Usuarios
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        u => u.Id == usuarioId,
                        context.HttpContext.RequestAborted
                    );

                if (usuario == null ||
                    !usuario.Ativo ||
                    usuario.Perfil.ToString() != perfilToken)
                {
                    context.Fail(
                        "Usuário inativo ou perfil alterado."
                    );

                    return;
                }
            }
        };
    });

// ======================================
// 10. AUTORIZAÇÃO
// ======================================

// Permite:
// [Authorize]
// [Authorize(Roles = "AdmMaster")]
// [Authorize(Roles = "AdmMaster,Professor")]

builder.Services.AddAuthorization();

// ======================================
// 11. CONSTRUIR A APLICAÇÃO
// ======================================

var app = builder.Build();

// ======================================
// 12. VERIFICAÇÃO PÚBLICA DA API
// ======================================

// GET /api/health
// Não consulta o banco de dados.

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "online",
        aplicacao = "Relax API",
        mensagem = "API funcionando no servidor!"
    });
})
.AllowAnonymous();

// ======================================
// 13. CONFIGURAÇÕES DE DESENVOLVIMENTO
// ======================================

if (app.Environment.IsDevelopment())
{
    // Documentação OpenAPI.
    app.MapOpenApi();

    // ==================================
    // TESTE DO AMBIENTE
    // ==================================

    app.MapGet(
        "/api/teste-ambiente",
        (IConfiguration config) =>
        {
            return Results.Ok(new
            {
                ambienteConfigurado =
                    config["RELAX_TESTE"] == "funcionando"
            });
        }
    );

    // ==================================
    // TESTE DE CONEXÃO SQL SERVER
    // ==================================

    app.MapGet(
        "/api/teste-banco",
        async (RelaxDbContext db) =>
        {
            try
            {
                var conectado =
                    await db.Database.CanConnectAsync();

                if (conectado)
                {
                    return Results.Ok(new
                    {
                        mensagem =
                            "Conexão com SQL Server realizada com sucesso!"
                    });
                }

                return Results.Problem(
                    "Não foi possível conectar ao banco de dados.",
                    statusCode: 503
                );
            }
            catch
            {
                return Results.Problem(
                    "Erro ao conectar ao banco de dados.",
                    statusCode: 503
                );
            }
        }
    );
}

// ======================================
// 14. HTTPS E SEGURANÇA
// ======================================

app.UseHttpsRedirection();

app.UseCors("RelaxWeb");

app.UseAuthentication();

app.UseAuthorization();

// ======================================
// 15. ROTAS DOS CONTROLLERS
// ======================================

app.MapControllers();

// ======================================
// 16. INICIALIZAÇÃO DO ADM MASTER
// ======================================

// O inicializador deve respeitar
// BootstrapAdmin:Enabled.
//
// Em produção, manter desabilitado
// após criar o primeiro ADM Master.

await AdmMasterInitializer.CriarAsync(
    app.Services,
    app.Configuration
);

// ======================================
// 17. INICIAR A API
// ======================================

app.Run();

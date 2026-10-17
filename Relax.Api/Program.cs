
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

// TESTE TEMPORÁRIO DO AMBIENTE DE HOSPEDAGEM
if (builder.Configuration["RELAX_TESTE"] == "funcionando")
{
    Console.WriteLine("RELAX_TESTE disponível no servidor.");
}

// ======================================
// 1. BANCO DE DADOS - SQL SERVER
// ======================================

// Obtém a conexão dos User Secrets,
// appsettings ou variáveis de ambiente.
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "A string de conexão DefaultConnection não foi encontrada."
    );

// Registra o Entity Framework Core.
builder.Services.AddDbContext<RelaxDbContext>(options =>
    options.UseSqlServer(connectionString));

// ======================================
// 2. CONTROLLERS E OPENAPI
// ======================================

// Habilita controllers como AuthController
// e UsuariosController.
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("RelaxWeb", policy =>
    {
        policy.WithOrigins(
                "http://localhost:8081"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Documentação OpenAPI.
builder.Services.AddOpenApi();

// ======================================
// 3. SEGURANÇA DAS SENHAS
// ======================================

// Serviço responsável por criar e validar
// hashes seguros das senhas dos usuários.
builder.Services.AddScoped<
    IPasswordHasher<Usuario>,
    PasswordHasher<Usuario>
>();

// ======================================
// 4. CONFIGURAÇÕES JWT
// ======================================

// Chave secreta utilizada para assinar tokens.
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "A chave Jwt:Key não foi configurada."
    );

// Emissor do token.
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer não foi configurado."
    );

// Público autorizado a utilizar o token.
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience não foi configurado."
    );

// Converte a chave Base64 para bytes.
byte[] jwtKeyBytes;

try
{
    jwtKeyBytes = Convert.FromBase64String(jwtKey);
}
catch (FormatException)
{
    throw new InvalidOperationException(
        "Jwt:Key não está em um formato Base64 válido."
    );
}

// Valida o tamanho mínimo da chave.
if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key deve conter pelo menos 32 bytes."
    );
}

// ======================================
// 5. AUTENTICAÇÃO JWT
// ======================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        // Configura a validação dos tokens.
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                // Verifica o emissor.
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                // Verifica o destinatário.
                ValidateAudience = true,
                ValidAudience = jwtAudience,

                // Verifica a assinatura.
                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(jwtKeyBytes),

                // Verifica o prazo de validade.
                ValidateLifetime = true,

                // Define os tipos de claims usados
                // para identificar usuário e perfil.
                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role,

                // Pequena tolerância de horário.
                ClockSkew = TimeSpan.FromMinutes(1)
            };

        // ======================================
        // 6. VALIDAÇÃO DO USUÁRIO NO BANCO
        // ======================================

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                // Obtém o ID armazenado no JWT.
                var idTexto = context.Principal?
                    .FindFirst(ClaimTypes.NameIdentifier)?
                    .Value;

                // Obtém o perfil armazenado no JWT.
                var perfilToken = context.Principal?
                    .FindFirst(ClaimTypes.Role)?
                    .Value;

                // Verifica se o ID é válido.
                if (!int.TryParse(
                    idTexto,
                    out var usuarioId))
                {
                    context.Fail("Usuário inválido.");
                    return;
                }

                // Obtém o DbContext da requisição.
                var db = context.HttpContext
                    .RequestServices
                    .GetRequiredService<RelaxDbContext>();

                // Consulta o usuário no SQL Server.
                var usuario = await db.Usuarios
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        u => u.Id == usuarioId,
                        context.HttpContext.RequestAborted
                    );

                // Rejeita o token se:
                // - o usuário não existir;
                // - estiver inativo;
                // - seu perfil tiver sido alterado.
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
// 7. AUTORIZAÇÃO
// ======================================

// Necessário para utilizar:
// [Authorize]
// [Authorize(Roles = "AdmMaster")]
// [Authorize(Roles = "AdmMaster,Professor")]

builder.Services.AddAuthorization();

// ======================================
// 8. CONSTRUIR A APLICAÇÃO
// ======================================

var app = builder.Build();

// ======================================
// 9. CONFIGURAÇÃO DO AMBIENTE
// ======================================

if (app.Environment.IsDevelopment())
{
    // Disponibiliza a documentação OpenAPI.
    app.MapOpenApi();
}

// Redirecionamento para HTTPS.
app.UseHttpsRedirection();

// ======================================
// 10. MIDDLEWARES DE SEGURANÇA
// ======================================
app.UseCors("RelaxWeb");

// Identifica o usuário pelo JWT.
app.UseAuthentication();

// Verifica as permissões do usuário.
app.UseAuthorization();

app.MapGet("/api/teste-ambiente", (IConfiguration config) =>
{
    return Results.Ok(new
    {
        ambienteConfigurado =
            config["RELAX_TESTE"] == "funcionando"
    });
});

// ======================================
// 11. ROTAS DOS CONTROLLERS
// ======================================

// Habilita as rotas definidas nos controllers.
app.MapControllers();

// ======================================
// 12. TESTE DE CONEXÃO SQL SERVER
// ======================================

// Endpoint temporário para desenvolvimento.
// Remover ou proteger antes da publicação.
if (app.Environment.IsDevelopment())
{
    app.MapGet(
        "/api/teste-banco",
        async (RelaxDbContext db) =>
        {
            try
            {
                bool conectado =
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
// 13. INICIALIZAÇÃO DO ADM MASTER
// ======================================

// O inicializador só cria o primeiro Master
// quando BootstrapAdmin:Enabled estiver ativo.
//
// Como já criamos o primeiro ADM Master e
// removemos os secrets BootstrapAdmin,
// nenhuma nova conta será criada.

await AdmMasterInitializer.CriarAsync(
    app.Services,
    app.Configuration
);

// ======================================
// 14. INICIAR A API
// ======================================

app.Run();

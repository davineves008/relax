
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

// Prioriza as variáveis exclusivas do Relax.
//
// Em desenvolvimento, utiliza os
// User Secrets como alternativa.
//
// Em produção, exige as variáveis RELAX_
// para evitar conflitos com o SystemsI.


string ObterConfiguracao(
    string variavelRelax,
    string configuracaoLocal)
{
    // Lê diretamente a variável de ambiente.
    var valorRelax =
        Environment.GetEnvironmentVariable(variavelRelax);

    if (!string.IsNullOrWhiteSpace(valorRelax))
    {
        return valorRelax;
    }

    // Em Production, exige a variável RELAX_.
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            $"A variável {variavelRelax} não foi configurada."
        );
    }

    // Em Development, utiliza os User Secrets.
    var valorLocal =
        builder.Configuration[configuracaoLocal];

    if (string.IsNullOrWhiteSpace(valorLocal))
    {
        throw new InvalidOperationException(
            $"A configuração {configuracaoLocal} não foi encontrada."
        );
    }

    return valorLocal;
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

builder.Services.AddDbContext<RelaxDbContext>(
    options =>
        options.UseSqlServer(connectionString)
);

// ======================================
// 3. CONTROLLERS E OPENAPI
// ======================================

builder.Services.AddControllers();

// Permite requisições da aplicação
// React Native Web em desenvolvimento.

builder.Services.AddCors(options =>
{
    options.AddPolicy("RelaxWeb", policy =>
    {
        policy
            .WithOrigins("http://localhost:8081")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Documentação OpenAPI.
builder.Services.AddOpenApi();

// ======================================
// 4. SEGURANÇA DAS SENHAS
// ======================================

// Responsável por gerar e validar
// hashes seguros das senhas.

builder.Services.AddScoped<
    IPasswordHasher<Usuario>,
    PasswordHasher<Usuario>
>();

// ======================================
// 5. CONFIGURAÇÕES JWT
// ======================================

// Variáveis cadastradas no SmarterASP.NET:
//
// RELAX_Jwt__Key
// RELAX_Jwt__Issuer
// RELAX_Jwt__Audience
//
// No desenvolvimento local, utiliza
// Jwt:Key, Jwt:Issuer e Jwt:Audience.

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

// Converte a chave JWT de Base64
// para um conjunto de bytes.

byte[] jwtKeyBytes;

try
{
    jwtKeyBytes =
        Convert.FromBase64String(jwtKey);
}
catch (FormatException)
{
    throw new InvalidOperationException(
        "A chave JWT não está em formato Base64 válido."
    );
}

// Exige pelo menos 32 bytes
// para a chave de assinatura.

if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "A chave JWT deve conter pelo menos 32 bytes."
    );
}

// ======================================
// 6. AUTENTICAÇÃO JWT
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
                // Validação do emissor.
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                // Validação do destinatário.
                ValidateAudience = true,
                ValidAudience = jwtAudience,

                // Validação da assinatura.
                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        jwtKeyBytes
                    ),

                // Validação da expiração.
                ValidateLifetime = true,

                // Identificação do usuário.
                NameClaimType = ClaimTypes.Name,

                // Identificação do perfil.
                RoleClaimType = ClaimTypes.Role,

                // Tolerância de horário.
                ClockSkew =
                    TimeSpan.FromMinutes(1)
            };

        // ======================================
        // 7. VALIDAÇÃO DO USUÁRIO NO BANCO
        // ======================================

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                // Recupera o ID do usuário.
                var idTexto = context.Principal?
                    .FindFirst(
                        ClaimTypes.NameIdentifier
                    )?
                    .Value;

                // Recupera o perfil do JWT.
                var perfilToken = context.Principal?
                    .FindFirst(
                        ClaimTypes.Role
                    )?
                    .Value;

                // Valida o identificador.
                if (!int.TryParse(
                    idTexto,
                    out var usuarioId))
                {
                    context.Fail(
                        "Usuário inválido."
                    );

                    return;
                }

                // Obtém o banco de dados.
                var db = context.HttpContext
                    .RequestServices
                    .GetRequiredService<
                        RelaxDbContext
                    >();

                // Consulta o usuário.
                var usuario = await db.Usuarios
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        u => u.Id == usuarioId,
                        context.HttpContext
                            .RequestAborted
                    );

                // Rejeita o token quando:
                //
                // - O usuário não existe;
                // - Está inativo;
                // - O perfil foi alterado.

                if (usuario == null ||
                    !usuario.Ativo ||
                    usuario.Perfil.ToString()
                        != perfilToken)
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
// 8. AUTORIZAÇÃO
// ======================================

// Permite utilizar:
//
// [Authorize]
//
// [Authorize(Roles = "AdmMaster")]
//
// [Authorize(Roles = "AdmMaster,Professor")]
//
// Os demais perfis continuam definidos
// pelos atributos dos controllers.

builder.Services.AddAuthorization();

// ======================================
// 9. CONSTRUIR A APLICAÇÃO
// ======================================

var app = builder.Build();

// ======================================
// 10. CONFIGURAÇÃO DO AMBIENTE
// ======================================

if (app.Environment.IsDevelopment())
{
    // Disponibiliza a documentação
    // OpenAPI apenas em desenvolvimento.

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
                    config["RELAX_TESTE"]
                        == "funcionando"
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
                bool conectado =
                    await db.Database
                        .CanConnectAsync();

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
// 11. HTTPS E SEGURANÇA
// ======================================

// Redireciona HTTP para HTTPS.
app.UseHttpsRedirection();

// Aplica a política CORS.
app.UseCors("RelaxWeb");

// Identifica o usuário pelo JWT.
app.UseAuthentication();

// Verifica as permissões.
app.UseAuthorization();

// ======================================
// 12. ROTAS DOS CONTROLLERS
// ======================================

// Habilita as rotas dos controllers,
// incluindo autenticação e usuários.

app.MapControllers();

// ======================================
// 13. INICIALIZAÇÃO DO ADM MASTER
// ======================================

// O inicializador só deve criar
// o ADM Master quando a configuração
// BootstrapAdmin:Enabled estiver ativa.
//
// Em produção, manter desabilitado
// após a criação do primeiro administrador.

await AdmMasterInitializer.CriarAsync(
    app.Services,
    app.Configuration
);

// ======================================
// 14. INICIAR A API
// ======================================

app.Run();

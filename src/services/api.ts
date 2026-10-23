
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('EXPO_PUBLIC_API_URL não configurada.');
}

export const API_BASE_URL = API_URL?.replace(/\/+$/, '') ?? '';

export type PerfilUsuario =
  | 'AdmMaster'
  | 'Professor'
  | 'Aluno'
  | 'Cliente';

export type LoginResponse = {
  token: string;
  expiracao: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: PerfilUsuario;
  };
};

export async function fazerLogin(
  email: string,
  senha: string
): Promise<LoginResponse> {
  if (!API_BASE_URL) {
    throw new Error('Endereço da API não configurado.');
  }

  const resposta = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      senha,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem ?? 'Não foi possível realizar o login.'
    );
  }

  return dados as LoginResponse;
}

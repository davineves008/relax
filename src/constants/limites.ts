export const LIMITES = {
  nome: { min: 3, max: 60 },
  email: { max: 100 },
  senha: { min: 6, max: 64 },
  comentario: { max: 300 },
  busca: { max: 100 },
} as const;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cada função devolve a mensagem de erro, ou null se estiver tudo certo.

export function validarNome(valor: string): string | null {
  const nome = valor.trim();
  if (nome.length < LIMITES.nome.min) {
    return `O nome precisa ter pelo menos ${LIMITES.nome.min} letras.`;
  }
  if (nome.length > LIMITES.nome.max) {
    return `O nome pode ter no máximo ${LIMITES.nome.max} caracteres.`;
  }
  return null;
}

export function validarEmail(valor: string): string | null {
  const email = valor.trim();
  if (!REGEX_EMAIL.test(email)) {
    return 'Digite um e-mail válido.';
  }
  if (email.length > LIMITES.email.max) {
    return `O e-mail pode ter no máximo ${LIMITES.email.max} caracteres.`;
  }
  return null;
}

export function validarSenha(valor: string): string | null {
  if (valor.length < LIMITES.senha.min) {
    return `A senha precisa ter pelo menos ${LIMITES.senha.min} caracteres.`;
  }
  if (valor.length > LIMITES.senha.max) {
    return `A senha pode ter no máximo ${LIMITES.senha.max} caracteres.`;
  }
  return null;
}
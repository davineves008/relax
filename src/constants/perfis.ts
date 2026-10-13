export type Perfil = 'professor' | 'aluno' | 'cliente';

export type UsuarioLogado = {
  id: string;
  nome: string;
  perfil: Perfil;
};

// Apenas para testar a interface. Substituir pelo usuário autenticado depois.
export const USUARIO_TESTE: UsuarioLogado = {
  id: 'teste-1',
  nome: 'Maria Souza',
  perfil: 'cliente',
};

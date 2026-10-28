
import type { PerfilUsuario } from '@/services/api';

export type Perfil = PerfilUsuario;

export type UsuarioLogado = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
};

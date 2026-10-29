
import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from 'react';

import {
    LoginResponse,
    PerfilUsuario,
} from '@/services/api';

type UsuarioAutenticado = LoginResponse['usuario'];

type AuthContextData = {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  perfil: PerfilUsuario | null;
  autenticado: boolean;
  entrar: (resposta: LoginResponse) => void;
  sair: () => void;
};

const AuthContext = createContext<AuthContextData | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<UsuarioAutenticado | null>(null);

  const [token, setToken] = useState<string | null>(null);

  function entrar(resposta: LoginResponse) {
    setUsuario(resposta.usuario);
    setToken(resposta.token);
  }

  function sair() {
    setUsuario(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        perfil: usuario?.perfil ?? null,
        autenticado: !!usuario && !!token,
        entrar,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      'useAuth deve ser utilizado dentro de AuthProvider.'
    );
  }

  return contexto;
}

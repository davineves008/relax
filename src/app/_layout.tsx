
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

const ROTAS_PUBLICAS = ['/', '/cadastro'];

function ProtecaoRotas() {
  const { autenticado, usuario } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const rotaPublica = ROTAS_PUBLICAS.includes(pathname);

    if (!autenticado) {
      if (!rotaPublica) {
        router.replace('/');
      }
      return;
    }

    if (!usuario) return;

    if (rotaPublica) {
      router.replace('/home');
      return;
    }

    const perfil = usuario.perfil;

    // Somente Professor e AdmMaster acessam usuários
    if (
      pathname === '/usuarios' &&
      perfil !== 'Professor' &&
      perfil !== 'AdmMaster'
    ) {
      router.replace('/home');
    }
  }, [autenticado, usuario, pathname, router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtecaoRotas />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen
          name="home"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="usuarios" />
        <Stack.Screen name="agendamento" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="reservas" />
        <Stack.Screen name="perfil" />
      </Stack>
    </AuthProvider>
  );
}

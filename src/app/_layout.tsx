
import { AuthProvider } from '@/contexts/AuthContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
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

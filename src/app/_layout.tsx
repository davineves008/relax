import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cadastro" />
       <Stack.Screen name="home" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
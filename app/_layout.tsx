import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-url-polyfill/auto';

import { colors } from '@/styles/theme';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const bootstrapped = useAuthStore((state) => state.bootstrapped);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ title: 'Cadastro' }} />
        <Stack.Screen name="home" options={{ title: 'Home' }} />
        <Stack.Screen name="sobre" options={{ title: 'Sobre' }} />
        <Stack.Screen name="entidades/index" options={{ title: 'Times' }} />
        <Stack.Screen name="entidades/criar" options={{ title: 'Novo time' }} />
        <Stack.Screen name="entidades/[id]" options={{ title: 'Detalhes do time' }} />
        <Stack.Screen name="entidades/editar" options={{ title: 'Editar time' }} />
        <Stack.Screen name="entidades/relacionamentos" options={{ title: 'Pokemon do time' }} />
      </Stack>
    </>
  );
}

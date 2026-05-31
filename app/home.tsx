import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { useAuthStore } from '@/store/authStore';
import { colors, radii, spacing } from '@/styles/theme';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const displayName = user?.user_metadata?.display_name?.trim() || 'usuario';

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel sair agora.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Ola, {displayName}</Text>
        <Text style={styles.title}>Times de Pokemon</Text>
        <Text style={styles.description}>
          Esta e a base mobile do construtor de times. A arquitetura já esta pronta para CRUD,
          relacionamento com Pokemon e telas futuras.
        </Text>
      </View>

      <View style={styles.grid}>
        <AppButton label="Meus times" onPress={() => router.push('/entidades')} />
        <AppButton label="Criar time" variant="secondary" onPress={() => router.push('/entidades/criar')} />
        <AppButton label="Sobre" variant="ghost" onPress={() => router.push('/sobre')} />
      </View>

      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  hero: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  greeting: {
    color: colors.info,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  description: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    gap: spacing.md,
  },
  logoutButton: {
    alignSelf: 'center',
    padding: spacing.md,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '800',
  },
});

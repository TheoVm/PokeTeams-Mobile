import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/styles/theme';

export default function SobreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sobre</Text>
      <View style={styles.card}>
        <Text style={styles.text}>
          App mobile criado com Expo Router, Zustand e Supabase, baseado visualmente no projeto
          Next original web.
        </Text>
        <Text style={styles.text}>
          O foco inicial e autenticar, navegar e preparar a base para gerenciar times e Pokemon.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  text: {
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 24,
  },
});

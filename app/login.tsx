import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { colors, radii, spacing } from '@/styles/theme';
import { isValidEmail } from '@/utils/validation';

export default function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const loading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(true);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Email invalido', 'Informe um email valido para entrar.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha invalida', 'A senha deve ter no minimo 6 caracteres.');
      return;
    }

    try {
      await signIn(normalizedEmail, password);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Nao foi possivel entrar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.kicker}>Poketeams Mobile</Text>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>Monte e acompanhe seus times de Pokemon pelo celular.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="voce@email.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            editable={!loading}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            placeholder="Sua senha"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            editable={!loading}
          />
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberSession }}
          onPress={() => setRememberSession((current) => !current)}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkbox, rememberSession && styles.checkboxChecked]}>
            {rememberSession ? <Text style={styles.checkmark}>OK</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>Manter sessao ativa neste aparelho</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
        </Pressable>

        <Link href="/signup" asChild>
          <Pressable disabled={loading} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Nao tem conta? Cadastrar</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 8,
  },
  kicker: {
    color: colors.info,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.input,
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.input,
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontWeight: '800',
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textSoft,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.info,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.68,
  },
});

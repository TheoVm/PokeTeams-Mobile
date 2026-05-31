import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { colors, radii, spacing } from '@/styles/theme';
import { isValidEmail } from '@/utils/validation';

export default function SignUpScreen() {
  const signUp = useAuthStore((state) => state.signUp);
  const loading = useAuthStore((state) => state.loading);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (displayName.trim() && displayName.trim().length < 3) {
      Alert.alert('Nome curto', 'Use pelo menos 3 caracteres no nome de usuario.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Email invalido', 'Informe um email valido.');
      return;
    }

    if (password.length < 6 || password !== confirmPassword) {
      Alert.alert('Senha invalida', 'A senha deve ter no minimo 6 caracteres e coincidir com a confirmacao.');
      return;
    }

    try {
      await signUp(email, password, displayName);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Cadastro nao concluido', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Estrutura preparada para autenticar no mesmo Supabase do projeto web.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nome de usuario</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} placeholder="Ash" placeholderTextColor={colors.muted} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="voce@email.com" placeholderTextColor={colors.muted} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Senha</Text>
        <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry placeholder="Minimo 6 caracteres" placeholderTextColor={colors.muted} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Confirmar senha</Text>
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} secureTextEntry placeholder="Repita a senha" placeholderTextColor={colors.muted} />
      </View>

      <Pressable onPress={handleSubmit} disabled={loading} style={styles.button}>
        <Text style={styles.buttonText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
      </Pressable>
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
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSoft,
    lineHeight: 21,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
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
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});

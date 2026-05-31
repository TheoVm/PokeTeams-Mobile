import { getSupabase } from '@/services/api';
import { assertApiConfig, hasApiConfig } from '@/config/env';

const MIN_DISPLAY_NAME_LENGTH = 3;
const DEFAULT_DISPLAY_NAME = 'Usuario';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function mapAuthErrorMessage(error: unknown, fallback = 'Nao foi possivel autenticar. Tente novamente.') {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Senha invalida.';
  }

  if (message.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar.';
  }

  return fallback;
}

export const authService = {
  async signUp(email: string, password: string, displayName?: string) {
    assertApiConfig();

    const normalizedEmail = normalizeEmail(email);
    const normalizedDisplayName = displayName?.trim();

    if (!normalizedEmail) throw new Error('Email invalido.');

    if (normalizedDisplayName && normalizedDisplayName.length < MIN_DISPLAY_NAME_LENGTH) {
      throw new Error(`O nome de usuario deve ter no minimo ${MIN_DISPLAY_NAME_LENGTH} caracteres.`);
    }

    const { data, error } = await getSupabase().auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          display_name: normalizedDisplayName || DEFAULT_DISPLAY_NAME,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    assertApiConfig();

    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) throw new Error(mapAuthErrorMessage(error));
    return data;
  },

  async signOut() {
    assertApiConfig();

    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  getCurrentUser() {
    if (!hasApiConfig()) {
      return Promise.resolve({ data: { user: null }, error: null });
    }

    return getSupabase().auth.getUser();
  },

  onAuthStateChange(callback: Parameters<ReturnType<typeof getSupabase>['auth']['onAuthStateChange']>[0]) {
    return getSupabase().auth.onAuthStateChange(callback);
  },
};

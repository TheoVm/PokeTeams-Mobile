import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { teamService } from '@/services/teamService';
import { colors, radii, spacing } from '@/styles/theme';

export default function CreateTeamScreen() {
  const [name, setName] = useState('Meu Time');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatorio', 'Informe o nome do time.');
      return;
    }

    try {
      setSaving(true);
      const team = await teamService.createTeam(name.trim(), []);
      router.replace(`/entidades/${team.id}`);
    } catch (error) {
      Alert.alert('Erro ao salvar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Novo time</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nome do time</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={colors.muted} />
      </View>
      <AppButton label={saving ? 'Salvando...' : 'Salvar time'} onPress={handleSave} disabled={saving} />
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
    fontSize: 28,
    fontWeight: '900',
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
});

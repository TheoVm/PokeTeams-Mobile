import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { teamService } from '@/services/teamService';
import { colors, radii, spacing } from '@/styles/theme';

export default function EditTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const team = await teamService.getTeamById(id);
      setName(team.name);
    };

    void load();
  }, [id]);

  const handleSave = async () => {
    if (!id || !name.trim()) return;

    try {
      setSaving(true);
      const existingTeam = await teamService.getTeamById(id);
      await teamService.updateTeam(id, name.trim(), existingTeam.team_pokemon);
      router.replace(`/entidades/${id}`);
    } catch (error) {
      Alert.alert('Erro ao atualizar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar time</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Nome do time" placeholderTextColor={colors.muted} />
      <AppButton label={saving ? 'Salvando...' : 'Salvar alteracoes'} onPress={handleSave} disabled={saving} />
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

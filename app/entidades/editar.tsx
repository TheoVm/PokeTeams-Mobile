import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { TeamBuilder } from '@/components/TeamBuilder';
import { teamService } from '@/services/teamService';
import { colors, spacing } from '@/styles/theme';
import type { Team } from '@/types/team';

export default function EditTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setTeam(await teamService.getTeamById(id));
      } catch (error) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Time nao encontrado.');
        router.replace('/entidades');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Carregando time...</Text>
      </View>
    );
  }

  return <TeamBuilder mode="edit" initialTeam={team} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textSoft,
  },
});

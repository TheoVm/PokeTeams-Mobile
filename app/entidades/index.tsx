import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { teamService } from '@/services/teamService';
import { colors, radii, spacing } from '@/styles/theme';
import type { Team } from '@/types/team';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setTeams(await teamService.getUserTeams());
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Nao foi possivel carregar os times.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTeams();
    }, [loadTeams])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.status}>Carregando times...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppButton label="Criar novo time" onPress={() => router.push('/entidades/criar')} />
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.status}>Nenhum time salvo ainda.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/entidades/${item.id}`)} style={styles.card}>
            <Text style={styles.teamName}>{item.name}</Text>
            <Text style={styles.teamMeta}>{item.team_pokemon.length}/6 Pokemon relacionados</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  list: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  teamName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  teamMeta: {
    color: colors.textSoft,
  },
  status: {
    color: colors.textSoft,
  },
});

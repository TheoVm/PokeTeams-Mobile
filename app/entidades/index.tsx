import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

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

  const handleDelete = (team: Team) => {
    Alert.alert('Excluir time', `Deseja excluir "${team.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await teamService.deleteTeam(team.id);
            await loadTeams();
          } catch (error) {
            Alert.alert('Erro ao excluir', error instanceof Error ? error.message : 'Tente novamente.');
          }
        },
      },
    ]);
  };

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
      <Text style={styles.title}>Meus Times Salvos</Text>
      <Text style={styles.subtitle}>Gerencie e visualize seus times</Text>
      <AppButton label="Criar novo time" onPress={() => router.push('/entidades/criar')} />
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.status}>Nenhum time salvo ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.teamName}>{item.name}</Text>
              <Text style={styles.badge}>{item.team_pokemon.length}/6 Pokemon</Text>
            </View>
            <View style={styles.spriteRow}>
              {item.team_pokemon.length === 0 ? (
                <Text style={styles.teamMeta}>Nenhum Pokemon neste time.</Text>
              ) : (
                item.team_pokemon.map((pokemon) => (
                  <View key={pokemon.id} style={styles.spriteBox}>
                    {pokemon.image_url ? <Image source={{ uri: pokemon.image_url }} style={styles.sprite} /> : null}
                  </View>
                ))
              )}
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => router.push(`/entidades/${item.id}`)} style={styles.actionButton}>
                <Text style={styles.actionText}>Ver Detalhes</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/entidades/editar', params: { id: item.id } })}
                style={[styles.actionButton, styles.loadButton]}
              >
                <Text style={styles.actionText}>Carregar para Editar</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={[styles.actionButton, styles.deleteButton]}>
                <Text style={styles.actionText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
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
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 16,
  },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  teamName: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.sm,
    color: colors.text,
    backgroundColor: '#12365f',
    fontWeight: '800',
  },
  teamMeta: {
    color: colors.textSoft,
  },
  spriteRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  spriteBox: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  sprite: {
    width: 58,
    height: 58,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.muted,
  },
  loadButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  actionText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
  },
  status: {
    color: colors.textSoft,
  },
});

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { teamService } from '@/services/teamService';
import { colors, radii, spacing } from '@/styles/theme';
import type { Team } from '@/types/team';

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setTeam(await teamService.getTeamById(id));
      } catch (error) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Time nao encontrado.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      await teamService.deleteTeam(id);
      router.replace('/entidades');
    } catch (error) {
      Alert.alert('Erro ao excluir', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Time nao encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{team.name}</Text>
      <Text style={styles.text}>{team.team_pokemon.length}/6 Pokemon vinculados ao time.</Text>

      <View style={styles.actions}>
        <AppButton label="Editar" onPress={() => router.push({ pathname: '/entidades/editar', params: { id: team.id } })} />
        <AppButton label="Relacionamentos" variant="secondary" onPress={() => router.push({ pathname: '/entidades/relacionamentos', params: { id: team.id } })} />
      </View>

      <View style={styles.pokemonList}>
        {team.team_pokemon.map((pokemon) => (
          <View key={pokemon.id} style={styles.pokemonCard}>
            {pokemon.image_url ? <Image source={{ uri: pokemon.image_url }} style={styles.sprite} /> : null}
            <View style={styles.pokemonInfo}>
              <Text style={styles.pokemonName}>{pokemon.nickname || pokemon.name}</Text>
              <Text style={styles.text}>Nivel {pokemon.level}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable disabled={deleting} onPress={handleDelete} style={styles.deleteButton}>
        <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Excluir time'}</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  text: {
    color: colors.textSoft,
  },
  actions: {
    gap: spacing.sm,
  },
  pokemonList: {
    gap: spacing.sm,
  },
  pokemonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  sprite: {
    width: 56,
    height: 56,
  },
  pokemonInfo: {
    flex: 1,
  },
  pokemonName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  deleteButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '800',
  },
});

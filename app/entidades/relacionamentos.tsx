import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';

import { teamService } from '@/services/teamService';
import { fetchPokemon, type PokeApiPokemon } from '@/services/pokeApi';
import { colors, radii, spacing } from '@/styles/theme';
import type { TeamPokemon } from '@/types/team';

export default function RelatedPokemonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pokemon, setPokemon] = useState<TeamPokemon[]>([]);
  const [pokeDetails, setPokeDetails] = useState<Record<number, PokeApiPokemon>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const team = await teamService.getTeamById(id);
      setPokemon(team.team_pokemon);

      const uniquePokemonIds = Array.from(new Set(team.team_pokemon.map((item) => item.pokemon_id)));
      const details: Record<number, PokeApiPokemon> = {};

      await Promise.all(
        uniquePokemonIds.map(async (pokemonId) => {
          try {
            details[pokemonId] = await fetchPokemon(pokemonId);
          } catch {
            // PokeAPI pode falhar para ids nao validos, mas o app continua funcionando.
          }
        })
      );

      setPokeDetails(details);
      setLoading(false);
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={pokemon}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={<Text style={styles.title}>Pokemon relacionados</Text>}
      ListEmptyComponent={<Text style={styles.text}>Este time ainda nao possui Pokemon relacionados.</Text>}
      renderItem={({ item }) => {
        const details = pokeDetails[item.pokemon_id];
        const pokemonName = item.nickname || item.name || details?.name || `Pokemon #${item.pokemon_id}`;
        const pokemonTypes = item.types.length > 0 ? item.types : details?.types ?? [];
        const imageUrl = item.image_url || details?.imageUrl;

        return (
          <View style={styles.card}>
            {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.sprite} /> : null}
            <View style={styles.cardContent}>
              <Text style={styles.name}>{pokemonName}</Text>
              <Text style={styles.text}>Pokemon #{item.pokemon_id} - Nivel {item.level}</Text>
              <Text style={styles.text}>Tipos: {pokemonTypes.join(', ') || 'nao informado'}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 28,
    fontWeight: '900',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  sprite: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.input,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  text: {
    color: colors.textSoft,
  },
});

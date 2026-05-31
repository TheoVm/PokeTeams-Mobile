import { getSupabase } from '@/services/api';
import { assertApiConfig } from '@/config/env';
import type { Team, TeamPokemon, TeamPokemonInput } from '@/types/team';

async function getRequiredUser() {
  assertApiConfig();

  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('Faca login para continuar.');

  return user;
}

function mapPokemonInsert(teamId: string, pokemon: TeamPokemonInput | TeamPokemon) {
  return {
    team_id: teamId,
    pokemon_id: pokemon.pokemon_id,
    nickname: pokemon.nickname ?? null,
    level: pokemon.level ?? 50,
    ivs: pokemon.ivs ?? {},
    evs: pokemon.evs ?? {},
    moves: pokemon.moves ?? [],
    ability: pokemon.ability ?? '',
    item: pokemon.item ?? '',
    name: pokemon.name,
    types: pokemon.types ?? [],
    base_stats: pokemon.base_stats ?? null,
    image_url: pokemon.image_url ?? null,
  };
}

function normalizeTeam(team: Team): Team {
  return {
    ...team,
    team_pokemon: (team.team_pokemon ?? []).filter(Boolean),
  };
}

export const teamService = {
  async createTeam(teamName: string, pokemonList: TeamPokemonInput[] = []) {
    const user = await getRequiredUser();

    const { data, error } = await getSupabase()
      .from('teams')
      .insert([{ user_id: user.id, name: teamName }])
      .select()
      .single<Team>();

    if (error) throw error;

    if (pokemonList.length > 0) {
      const { error: pokemonError } = await getSupabase()
        .from('team_pokemon')
        .insert(pokemonList.map((pokemon) => mapPokemonInsert(data.id, pokemon)));

      if (pokemonError) throw pokemonError;
    }

    return data;
  },

  async getUserTeams() {
    const user = await getRequiredUser();

    const { data, error } = await getSupabase()
      .from('teams')
      .select(`
        id,
        user_id,
        name,
        created_at,
        team_pokemon (
          id,
          team_id,
          pokemon_id,
          nickname,
          level,
          ivs,
          evs,
          moves,
          ability,
          item,
          name,
          types,
          base_stats,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .returns<Team[]>();

    if (error) throw error;
    return (data ?? []).map(normalizeTeam);
  },

  async getTeamById(teamId: string) {
    const user = await getRequiredUser();

    const { data, error } = await getSupabase()
      .from('teams')
      .select(`
        id,
        user_id,
        name,
        created_at,
        team_pokemon (
          id,
          team_id,
          pokemon_id,
          nickname,
          level,
          ivs,
          evs,
          moves,
          ability,
          item,
          name,
          types,
          base_stats,
          image_url
        )
      `)
      .eq('id', teamId)
      .eq('user_id', user.id)
      .single<Team>();

    if (error) throw error;
    return normalizeTeam(data);
  },

  async updateTeam(teamId: string, teamName: string, pokemonList: (TeamPokemonInput | TeamPokemon)[]) {
    const user = await getRequiredUser();

    const { data, error } = await getSupabase()
      .from('teams')
      .update({ name: teamName })
      .eq('id', teamId)
      .eq('user_id', user.id)
      .select()
      .single<Team>();

    if (error) throw error;

    const { error: deleteError } = await getSupabase().from('team_pokemon').delete().eq('team_id', teamId);
    if (deleteError) throw deleteError;

    if (pokemonList.length > 0) {
      const { error: pokemonError } = await getSupabase()
        .from('team_pokemon')
        .insert(pokemonList.map((pokemon) => mapPokemonInsert(teamId, pokemon)));

      if (pokemonError) throw pokemonError;
    }

    return data;
  },

  async deleteTeam(teamId: string) {
    const user = await getRequiredUser();

    const { error: pokemonError } = await getSupabase().from('team_pokemon').delete().eq('team_id', teamId);
    if (pokemonError) throw pokemonError;

    const { error } = await getSupabase().from('teams').delete().eq('id', teamId).eq('user_id', user.id);
    if (error) throw error;
  },
};

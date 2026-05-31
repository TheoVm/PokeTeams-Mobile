export type StatSpread = {
  hp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
};

export type TeamPokemonInput = {
  pokemon_id: number;
  nickname?: string | null;
  level?: number;
  ivs?: StatSpread;
  evs?: StatSpread;
  moves?: string[];
  ability?: string;
  item?: string;
  name: string;
  types?: string[];
  base_stats?: StatSpread | null;
  image_url?: string | null;
};

export type TeamPokemon = TeamPokemonInput & {
  id: string;
  team_id: string;
  pokemon_id: number;
  level: number;
  moves: string[];
  types: string[];
};

export type Team = {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
  team_pokemon: TeamPokemon[];
};

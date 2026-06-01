export type PokeApiPokemon = {
  id: number;
  name: string;
  imageUrl: string | null;
  types: string[];
  abilities: string[];
  stats: {
    hp?: number;
    attack?: number;
    defense?: number;
    specialAttack?: number;
    specialDefense?: number;
    speed?: number;
  };
  height: number;
  weight: number;
  moves: string[];
};

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2';

function mapStats(stats: Array<{ base_stat: number; stat: { name: string } }>) {
  return stats.reduce<Record<string, number>>((acc, item) => {
    const name = item.stat.name;
    if (name === 'hp') acc.hp = item.base_stat;
    if (name === 'attack') acc.attack = item.base_stat;
    if (name === 'defense') acc.defense = item.base_stat;
    if (name === 'special-attack') acc.specialAttack = item.base_stat;
    if (name === 'special-defense') acc.specialDefense = item.base_stat;
    if (name === 'speed') acc.speed = item.base_stat;
    return acc;
  }, {});
}

export async function fetchPokemon(idOrName: number | string): Promise<PokeApiPokemon> {
  const query = String(idOrName).trim().toLowerCase();
  const response = await fetch(`${POKE_API_BASE_URL}/pokemon/${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error(`Pokemon nao encontrado: ${query}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    name: data.name,
    imageUrl:
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.front_default ||
      null,
    types: (data.types ?? []).map((item: any) => item.type?.name).filter(Boolean),
    abilities: (data.abilities ?? []).map((item: any) => item.ability?.name).filter(Boolean),
    stats: mapStats(data.stats ?? []),
    height: data.height ?? 0,
    weight: data.weight ?? 0,
    moves: (data.moves ?? []).slice(0, 4).map((item: any) => item.move?.name).filter(Boolean),
  };
}

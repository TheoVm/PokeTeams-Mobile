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

export type PokemonListItem = {
  id: number;
  name: string;
  imageUrl: string;
};

type PokeApiNamedResource = {
  name: string;
  url: string;
};

type PokeApiPokemonResponse = {
  id: number;
  name: string;
  sprites?: {
    front_default?: string | null;
    other?: {
      'official-artwork'?: {
        front_default?: string | null;
      };
    };
  };
  types?: { type?: { name?: string } }[];
  abilities?: { ability?: { name?: string } }[];
  stats?: { base_stat: number; stat: { name: string } }[];
  height?: number;
  weight?: number;
  moves?: { move?: { name?: string } }[];
};

type PokeApiListResponse = {
  results?: PokeApiNamedResource[];
};

type PokeApiItemCategoryResponse = {
  items?: PokeApiNamedResource[];
};

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKE_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const ITEM_CATEGORY_IDS = [2, 3, 4, 5, 6, 9, 10];
const EXCLUDED_ITEM_PATTERNS = [
  'z-crystal',
  '-z',
  'box',
  'pokedex',
  'poke-ball',
  'ancient-feathers',
  'birthday-cupcake',
  'ice-type-dragon',
  'secret-blob',
  'glass-wing',
  'odd-potion',
  'secret-sauce',
];

function getPokemonIdFromUrl(url: string) {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

function mapStats(stats: { base_stat: number; stat: { name: string } }[]) {
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

function isBattleItem(itemName: string) {
  const lowerName = itemName.toLowerCase();
  return !EXCLUDED_ITEM_PATTERNS.some((pattern) => lowerName.includes(pattern));
}

export async function fetchPokemon(idOrName: number | string): Promise<PokeApiPokemon> {
  const query = String(idOrName).trim().toLowerCase();
  const response = await fetch(`${POKE_API_BASE_URL}/pokemon/${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error(`Pokemon nao encontrado: ${query}`);
  }

  const data = (await response.json()) as PokeApiPokemonResponse;

  return {
    id: data.id,
    name: data.name,
    imageUrl:
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.front_default ||
      null,
    types: (data.types ?? []).map((item) => item.type?.name).filter(Boolean) as string[],
    abilities: (data.abilities ?? []).map((item) => item.ability?.name).filter(Boolean) as string[],
    stats: mapStats(data.stats ?? []),
    height: data.height ?? 0,
    weight: data.weight ?? 0,
    moves: (data.moves ?? []).slice(0, 100).map((item) => item.move?.name).filter(Boolean) as string[],
  };
}

export async function fetchPokemonList(limit = 151, offset = 0): Promise<PokemonListItem[]> {
  const response = await fetch(`${POKE_API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a lista de Pokemon.');
  }

  const data = (await response.json()) as PokeApiListResponse;

  return (data.results ?? [])
    .map((item) => {
      const id = getPokemonIdFromUrl(item.url);
      return {
        id,
        name: item.name,
        imageUrl: `${POKE_SPRITE_BASE_URL}/${id}.png`,
      };
    })
    .filter((item: PokemonListItem) => item.id > 0);
}

export async function fetchBattleItemList(): Promise<string[]> {
  const itemNames = new Set<string>();

  await Promise.all(
    ITEM_CATEGORY_IDS.map(async (categoryId) => {
      const response = await fetch(`${POKE_API_BASE_URL}/item-category/${categoryId}`);

      if (!response.ok) {
        throw new Error('Nao foi possivel carregar a lista de items.');
      }

      const data = (await response.json()) as PokeApiItemCategoryResponse;
      (data.items ?? []).forEach((item) => {
        if (isBattleItem(item.name)) itemNames.add(item.name);
      });
    })
  );

  return Array.from(itemNames).sort((a, b) => a.localeCompare(b));
}

import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/AppButton';
import { fetchBattleItemList, fetchPokemon, fetchPokemonList, type PokeApiPokemon, type PokemonListItem } from '@/services/pokeApi';
import { teamService } from '@/services/teamService';
import { colors, radii, spacing } from '@/styles/theme';
import type { StatSpread, Team, TeamPokemon, TeamPokemonInput } from '@/types/team';

type BuilderPokemon = TeamPokemonInput & {
  level: number;
  moves: string[];
  types: string[];
  ivs: StatSpread;
  evs: StatSpread;
  availableMoves: string[];
  availableAbilities: string[];
};

type TeamBuilderProps = {
  mode: 'create' | 'edit';
  initialTeam?: Team | null;
};

const TEAM_SIZE = 6;
const STAT_KEYS: (keyof StatSpread)[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
const STAT_LABELS: Record<keyof StatSpread, string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defesa',
  specialAttack: 'Ataque E.',
  specialDefense: 'Defesa E.',
  speed: 'Velocidade',
};

const DEFAULT_IVS: Required<StatSpread> = {
  hp: 31,
  attack: 31,
  defense: 31,
  specialAttack: 31,
  specialDefense: 31,
  speed: 31,
};

const DEFAULT_EVS: Required<StatSpread> = {
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
};

function formatPokemonName(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toSlots(team?: Team | null): (BuilderPokemon | null)[] {
  const slots = Array<BuilderPokemon | null>(TEAM_SIZE).fill(null);

  (team?.team_pokemon ?? []).slice(0, TEAM_SIZE).forEach((pokemon, index) => {
    slots[index] = fromTeamPokemon(pokemon);
  });

  return slots;
}

function fromTeamPokemon(pokemon: TeamPokemon): BuilderPokemon {
  return {
    pokemon_id: pokemon.pokemon_id,
    nickname: pokemon.nickname,
    level: pokemon.level ?? 50,
    ivs: { ...DEFAULT_IVS, ...(pokemon.ivs ?? {}) },
    evs: { ...DEFAULT_EVS, ...(pokemon.evs ?? {}) },
    moves: normalizeMoves(pokemon.moves ?? []),
    ability: pokemon.ability ?? '',
    item: pokemon.item ?? '',
    name: pokemon.name,
    types: pokemon.types ?? [],
    base_stats: pokemon.base_stats ?? null,
    image_url: pokemon.image_url ?? null,
    availableMoves: pokemon.moves ?? [],
    availableAbilities: pokemon.ability ? [pokemon.ability] : [],
  };
}

function fromPokeApiPokemon(pokemon: PokeApiPokemon): BuilderPokemon {
  return {
    pokemon_id: pokemon.id,
    nickname: '',
    level: 50,
    ivs: DEFAULT_IVS,
    evs: DEFAULT_EVS,
    moves: normalizeMoves(pokemon.moves.slice(0, 4)),
    ability: pokemon.abilities[0] ?? '',
    item: '',
    name: formatPokemonName(pokemon.name),
    types: pokemon.types,
    base_stats: pokemon.stats,
    image_url: pokemon.imageUrl,
    availableMoves: pokemon.moves,
    availableAbilities: pokemon.abilities,
  };
}

function normalizeMoves(moves: string[]) {
  return Array.from({ length: 4 }, (_, index) => moves[index] ?? '');
}

function serializePokemon(pokemon: BuilderPokemon): TeamPokemonInput {
  return {
    pokemon_id: pokemon.pokemon_id,
    nickname: pokemon.nickname?.trim() || null,
    level: pokemon.level,
    ivs: pokemon.ivs,
    evs: pokemon.evs,
    moves: pokemon.moves.map((move) => move.trim()).filter(Boolean),
    ability: pokemon.ability ?? '',
    item: pokemon.item ?? '',
    name: pokemon.name,
    types: pokemon.types,
    base_stats: pokemon.base_stats,
    image_url: pokemon.image_url,
  };
}

function parseLimitedNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value.replace(/\D/g, ''));
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getStatValue(spread: StatSpread, stat: keyof StatSpread, fallback = 0) {
  return spread[stat] ?? fallback;
}

function calculateEffectiveStats(pokemon: BuilderPokemon) {
  const baseStats = pokemon.base_stats ?? {};

  return STAT_KEYS.reduce<Record<keyof StatSpread, number>>((effective, stat) => {
    const base = getStatValue(baseStats, stat);
    const iv = getStatValue(pokemon.ivs, stat, 31);
    const ev = getStatValue(pokemon.evs, stat);

    if (stat === 'hp') {
      effective[stat] = Math.floor((((base + iv + Math.floor(ev / 4)) * 2 + 100) * pokemon.level) / 100) + pokemon.level + 10;
      return effective;
    }

    effective[stat] = Math.floor((((base + iv + Math.floor(ev / 4)) * 2) * pokemon.level) / 100) + 5;
    return effective;
  }, {} as Record<keyof StatSpread, number>);
}

export function TeamBuilder({ mode, initialTeam }: TeamBuilderProps) {
  const [teamName, setTeamName] = useState(initialTeam?.name ?? 'Meu Time');
  const [slots, setSlots] = useState<(BuilderPokemon | null)[]>(() => toSlots(initialTeam));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [savedTeams, setSavedTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loadingPokemon, setLoadingPokemon] = useState(true);
  const [loadingSlot, setLoadingSlot] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [itemList, setItemList] = useState<string[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const selectedPokemon = slots[selectedSlot];
  const pokemonCount = slots.filter(Boolean).length;

  const filteredPokemon = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return pokemonList;
    return pokemonList.filter((pokemon) => pokemon.name.includes(normalized) || String(pokemon.id) === normalized);
  }, [pokemonList, search]);

  const loadSavedTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      setSavedTeams(await teamService.getUserTeams());
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Nao foi possivel carregar os times.');
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    setTeamName(initialTeam?.name ?? 'Meu Time');
    setSlots(toSlots(initialTeam));
  }, [initialTeam]);

  useEffect(() => {
    const loadPokemon = async () => {
      try {
        setLoadingPokemon(true);
        setPokemonList(await fetchPokemonList(151));
      } catch (error) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Nao foi possivel carregar a PokeAPI.');
      } finally {
        setLoadingPokemon(false);
      }
    };

    void loadPokemon();
    void loadSavedTeams();
  }, [loadSavedTeams]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoadingItems(true);
        setItemList(await fetchBattleItemList());
      } catch {
        setItemList([]);
      } finally {
        setLoadingItems(false);
      }
    };

    void loadItems();
  }, []);

  useEffect(() => {
    const hydrateSelectedPokemon = async () => {
      const current = slots[selectedSlot];
      if (!current || current.availableMoves.length > current.moves.filter(Boolean).length) return;

      try {
        const details = await fetchPokemon(current.pokemon_id);
        updateSlot(selectedSlot, {
          ...current,
          availableMoves: details.moves,
          availableAbilities: details.abilities,
          base_stats: current.base_stats ?? details.stats,
          types: current.types.length > 0 ? current.types : details.types,
          image_url: current.image_url ?? details.imageUrl,
        });
      } catch {
        // Existing saved data is enough for editing when PokeAPI is unavailable.
      }
    };

    void hydrateSelectedPokemon();
    // updateSlot is intentionally kept local to this effect through setSlots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot]);

  const updateSlot = (slotIndex: number, pokemon: BuilderPokemon | null) => {
    setSlots((currentSlots) => currentSlots.map((slot, index) => (index === slotIndex ? pokemon : slot)));
  };

  const patchSelectedPokemon = (patch: Partial<BuilderPokemon>) => {
    if (!selectedPokemon) return;
    updateSlot(selectedSlot, { ...selectedPokemon, ...patch });
  };

const updateSelectedStat = (group: 'ivs' | 'evs', stat: keyof StatSpread, value: string) => {
  if (!selectedPokemon) return;

  const max = group === 'ivs' ? 31 : 252;
  const fallback = selectedPokemon[group]?.[stat] ?? 0;

  const newValue = parseLimitedNumber(value, fallback, 0, max);

  if (group === 'evs') {
    const currentTotal = Object.values(selectedPokemon.evs).reduce(
      (sum, ev) => sum + (ev ?? 0),
      0
    );

    const currentStatValue = selectedPokemon.evs[stat] ?? 0;
    const newTotal = currentTotal - currentStatValue + newValue;

    if (newTotal > 510) {
      Alert.alert(
        'Limite de EVs',
        'A soma total dos EVs não pode ultrapassar 510.'
      );
      return;
    }
  }

  patchSelectedPokemon({
    [group]: {
      ...selectedPokemon[group],
      [stat]: newValue,
    },
  });
};  

  const updateMove = (moveIndex: number, value: string) => {
    if (!selectedPokemon) return;
    const nextMoves = [...selectedPokemon.moves];
    nextMoves[moveIndex] = value;
    patchSelectedPokemon({ moves: nextMoves });
  };

  const selectPokemon = async (pokemonId: number) => {
    try {
      setLoadingSlot(true);
      const pokemon = await fetchPokemon(pokemonId);
      updateSlot(selectedSlot, fromPokeApiPokemon(pokemon));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Nao foi possivel selecionar este Pokemon.');
    } finally {
      setLoadingSlot(false);
    }
  };

  const handleSave = async () => {
    const normalizedName = teamName.trim();
    if (!normalizedName) {
      Alert.alert('Nome obrigatorio', 'Informe o nome do time.');
      return;
    }

    try {
      setSaving(true);
      const pokemon = slots.filter((slot): slot is BuilderPokemon => Boolean(slot)).map(serializePokemon);

      if (mode === 'edit' && initialTeam?.id) {
        await teamService.updateTeam(initialTeam.id, normalizedName, pokemon);
        router.replace(`/entidades/${initialTeam.id}`);
        return;
      }

      const createdTeam = await teamService.createTeam(normalizedName, pokemon);
      router.replace(`/entidades/${createdTeam.id}`);
    } catch (error) {
      Alert.alert('Erro ao salvar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleNewTeam = () => {
    setTeamName('Meu Time');
    setSlots(Array<BuilderPokemon | null>(TEAM_SIZE).fill(null));
    setSelectedSlot(0);
    if (mode === 'edit') router.replace('/entidades/criar');
  };

  const handleDeleteTeam = (team: Team) => {
    Alert.alert('Excluir time', `Deseja excluir "${team.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await teamService.deleteTeam(team.id);
            await loadSavedTeams();
            if (initialTeam?.id === team.id) router.replace('/entidades');
          } catch (error) {
            Alert.alert('Erro ao excluir', error instanceof Error ? error.message : 'Tente novamente.');
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <AppButton label="Voltar para inicio" variant="ghost" onPress={() => router.replace('/home')} />
          <Text style={styles.title}>Construtor de Times</Text>
          <Text style={styles.subtitle}>{mode === 'edit' ? 'Edite slots, golpes e atributos do time.' : 'Crie um time com ate 6 Pokemon.'}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{mode === 'edit' ? 'Editar Time' : 'Novo Time'}</Text>
          <TextInput
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Nome do time"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <View style={styles.actionRow}>
            <AppButton label={saving ? 'Salvando...' : 'Salvar Time'} onPress={handleSave} disabled={saving} />
            <AppButton label="Novo Time" variant="secondary" onPress={handleNewTeam} disabled={saving} />
          </View>

          <View style={styles.slotGrid}>
            {slots.map((pokemon, index) => (
              <Pressable
                key={`slot-${index}`}
                onPress={() => setSelectedSlot(index)}
                style={({ pressed }) => [
                  styles.slotCard,
                  selectedSlot === index && styles.slotCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                {pokemon ? (
                  <>
                    {pokemon.image_url ? <Image source={{ uri: pokemon.image_url }} style={styles.slotSprite} /> : null}
                    <Text style={styles.slotName} numberOfLines={1}>{pokemon.nickname || pokemon.name}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.plus}>+</Text>
                    <Text style={styles.slotAdd}>Adicionar</Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Analise do Time</Text>
          <Text style={styles.text}>Total de Pokemon: {pokemonCount}</Text>
        </View>

        <View style={styles.panel}>
          {selectedPokemon ? (
            <PokemonEditor
              pokemon={selectedPokemon}
              onChange={patchSelectedPokemon}
              onMoveChange={updateMove}
              onStatChange={updateSelectedStat}
              itemList={itemList}
              loadingItems={loadingItems}
              onRemove={() => updateSlot(selectedSlot, null)}
            />
          ) : (
            <PokemonSelector
              loading={loadingPokemon || loadingSlot}
              search={search}
              onSearchChange={setSearch}
              pokemonList={filteredPokemon}
              onSelect={selectPokemon}
            />
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Times Salvos</Text>
          {loadingTeams ? (
            <ActivityIndicator color={colors.primary} />
          ) : savedTeams.length === 0 ? (
            <Text style={styles.text}>Nenhum time salvo ainda.</Text>
          ) : (
            <View style={styles.savedList}>
              {savedTeams.map((team) => (
                <View key={team.id} style={styles.savedCard}>
                  <View style={styles.savedInfo}>
                    <Text style={styles.savedName}>{team.name}</Text>
                    <Text style={styles.text}>{team.team_pokemon.length}/6 Pokemon</Text>
                  </View>
                  <View style={styles.savedActions}>
                    <Pressable onPress={() => router.push(`/entidades/${team.id}`)} style={styles.smallButton}>
                      <Text style={styles.smallButtonText}>Detalhes</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.replace({ pathname: '/entidades/editar', params: { id: team.id } })}
                      style={[styles.smallButton, styles.smallButtonBlue]}
                    >
                      <Text style={styles.smallButtonText}>Carregar</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteTeam(team)} style={[styles.smallButton, styles.smallButtonDanger]}>
                      <Text style={styles.smallButtonText}>Excluir</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type PokemonSelectorProps = {
  loading: boolean;
  search: string;
  pokemonList: PokemonListItem[];
  onSearchChange: (value: string) => void;
  onSelect: (pokemonId: number) => void;
};

function PokemonSelector({ loading, search, pokemonList, onSearchChange, onSelect }: PokemonSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.panelTitle}>Selecionar Pokemon</Text>
      <Text style={styles.text}>Busque e escolha um Pokemon para o slot atual.</Text>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder="Buscar Pokemon..."
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.text}>Carregando Pokemon...</Text>
        </View>
      ) : (
        <View style={styles.pokemonGrid}>
          {pokemonList.map((pokemon) => (
            <Pressable key={pokemon.id} onPress={() => onSelect(pokemon.id)} style={({ pressed }) => [styles.pokemonOption, pressed && styles.pressed]}>
              <Image source={{ uri: pokemon.imageUrl }} style={styles.optionSprite} />
              <Text style={styles.optionName} numberOfLines={1}>{formatPokemonName(pokemon.name)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

type PokemonEditorProps = {
  pokemon: BuilderPokemon;
  onChange: (patch: Partial<BuilderPokemon>) => void;
  onMoveChange: (moveIndex: number, value: string) => void;
  onStatChange: (group: 'ivs' | 'evs', stat: keyof StatSpread, value: string) => void;
  itemList: string[];
  loadingItems: boolean;
  onRemove: () => void;
};

function PokemonEditor({ pokemon, onChange, onMoveChange, onStatChange, itemList, loadingItems, onRemove }: PokemonEditorProps) {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(0);
  const [moveSearch, setMoveSearch] = useState('');
  const [abilitySearch, setAbilitySearch] = useState('');

  const filteredMoves = useMemo(() => {
    const normalized = moveSearch.trim().toLowerCase();
    if (!normalized) return pokemon.availableMoves;
    return pokemon.availableMoves.filter((move) => move.includes(normalized));
  }, [moveSearch, pokemon.availableMoves]);

  const filteredAbilities = useMemo(() => {
    const normalized = abilitySearch.trim().toLowerCase();
    if (!normalized) return pokemon.availableAbilities;
    return pokemon.availableAbilities.filter((ability) => ability.includes(normalized));
  }, [abilitySearch, pokemon.availableAbilities]);

  const handleMoveSelect = (move: string) => {
    const duplicateIndex = pokemon.moves.findIndex((currentMove, index) => index !== selectedMoveIndex && currentMove === move);

    if (duplicateIndex >= 0) {
      Alert.alert('Golpe repetido', `Este Pokemon ja usa ${formatPokemonName(move)} no golpe ${duplicateIndex + 1}.`);
      return;
    }

    onMoveChange(selectedMoveIndex, move);
  };

  return (
    <View style={styles.section}>
      <View style={styles.editorHeader}>
        {pokemon.image_url ? <Image source={{ uri: pokemon.image_url }} style={styles.editorSprite} /> : null}
        <View style={styles.editorTitleGroup}>
          <Text style={styles.panelTitle}>{pokemon.nickname || pokemon.name}</Text>
          <Text style={styles.text}>#{pokemon.pokemon_id} {pokemon.types.join(' / ')}</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Apelido</Text>
        <TextInput
          value={pokemon.nickname ?? ''}
          onChangeText={(nickname) => onChange({ nickname })}
          placeholder={pokemon.name}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nivel</Text>
        <TextInput
          value={String(pokemon.level)}
          onChangeText={(value) => onChange({ level: parseLimitedNumber(value, pokemon.level, 1, 100) })}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Golpes</Text>
        {pokemon.moves.map((move, index) => (
          <Pressable
            key={`move-${index}`}
            onPress={() => setSelectedMoveIndex(index)}
            style={({ pressed }) => [
              styles.readonlyChoice,
              selectedMoveIndex === index && styles.readonlyChoiceSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.readonlyChoiceLabel}>Golpe {index + 1}</Text>
            <Text style={styles.readonlyChoiceValue}>{move ? formatPokemonName(move) : 'Selecione pela lista'}</Text>
          </Pressable>
        ))}
        <TextInput
          value={moveSearch}
          onChangeText={setMoveSearch}
          placeholder={`Filtrar golpes para trocar o golpe ${selectedMoveIndex + 1}`}
          placeholderTextColor={colors.muted}
          style={styles.filterInput}
          autoCapitalize="none"
        />
        <OptionPicker
          title={`Lista completa de golpes - substitui o golpe ${selectedMoveIndex + 1}`}
          options={filteredMoves}
          selectedValue={pokemon.moves[selectedMoveIndex]}
          onSelect={handleMoveSelect}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Habilidade</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyChoiceLabel}>Habilidade atual</Text>
          <Text style={styles.readonlyChoiceValue}>
            {pokemon.ability ? formatPokemonName(pokemon.ability) : 'Selecione pela lista'}
          </Text>
        </View>
        <TextInput
          value={abilitySearch}
          onChangeText={setAbilitySearch}
          placeholder="Filtrar habilidades disponiveis"
          placeholderTextColor={colors.muted}
          style={styles.filterInput}
          autoCapitalize="none"
        />
        <OptionPicker
          title="Habilidades disponiveis"
          options={filteredAbilities}
          selectedValue={pokemon.ability ?? ''}
          onSelect={(ability) => onChange({ ability })}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Item Hold</Text>
        <TextInput
          value={pokemon.item ?? ''}
          onChangeText={(item) => onChange({ item })}
          placeholder="Selecione um item"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCapitalize="none"
        />
        {loadingItems ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.text}>Carregando items...</Text>
          </View>
        ) : (
          <OptionPicker
            title="Items da PokeAPI"
            options={itemList}
            selectedValue={pokemon.item ?? ''}
            onSelect={(item) => onChange({ item })}
          />
        )}
      </View>

      <EffectiveStats pokemon={pokemon} />

      <StatEditor title="IVs" values={pokemon.ivs} group="ivs" onChange={onStatChange} />
      <StatEditor title="EVs" values={pokemon.evs} group="evs" onChange={onStatChange} />

      <Pressable onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>Remover Pokemon deste slot</Text>
      </Pressable>
    </View>
  );
}

type OptionPickerProps = {
  title: string;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
};

function OptionPicker({ title, options, selectedValue, onSelect }: OptionPickerProps) {
  if (options.length === 0) {
    return <Text style={styles.text}>Nenhuma opcao disponivel.</Text>;
  }

  return (
    <View style={styles.optionPicker}>
      <Text style={styles.optionPickerTitle}>{title}</Text>
      <ScrollView nestedScrollEnabled style={styles.optionList} contentContainerStyle={styles.optionListContent}>
        {options.map((option) => {
          const selected = selectedValue === option;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.optionRow,
                selected && styles.optionRowSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.optionRowText, selected && styles.optionRowTextSelected]}>{formatPokemonName(option)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function EffectiveStats({ pokemon }: { pokemon: BuilderPokemon }) {
  const effectiveStats = calculateEffectiveStats(pokemon);

  return (
    <View style={styles.effectiveBox}>
      <Text style={styles.label}>Stats Efetivos</Text>
      {STAT_KEYS.map((stat) => {
        const value = effectiveStats[stat];
        const width = `${Math.min(100, Math.round((value / 300) * 100))}%` as const;

        return (
          <View key={`effective-${stat}`} style={styles.effectiveRow}>
            <Text style={styles.effectiveLabel}>{STAT_LABELS[stat]}</Text>
            <View style={styles.effectiveTrack}>
              <View style={[styles.effectiveFill, { width }]} />
            </View>
            <Text style={styles.effectiveValue}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

type StatEditorProps = {
  title: string;
  values: StatSpread;
  group: 'ivs' | 'evs';
  onChange: (group: 'ivs' | 'evs', stat: keyof StatSpread, value: string) => void;
};

function StatEditor({ title, values, group, onChange }: StatEditorProps) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.statGrid}>
        {STAT_KEYS.map((stat) => (
          <View key={`${group}-${stat}`} style={styles.statField}>
            <Text style={styles.statLabel}>{STAT_LABELS[stat]}</Text>
            <TextInput
              value={String(values[stat] ?? 0)}
              onChangeText={(value) => onChange(group, stat, value)}
              keyboardType="number-pad"
              style={styles.statInput}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 16,
  },
  panel: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  text: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.input,
    fontSize: 16,
  },
  filterInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: '#0b2338',
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotCard: {
    width: '31%',
    minWidth: 96,
    aspectRatio: 0.82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  slotCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#10243f',
  },
  slotSprite: {
    width: 70,
    height: 70,
  },
  slotName: {
    maxWidth: '90%',
    color: colors.text,
    fontWeight: '800',
  },
  plus: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
  },
  slotAdd: {
    color: colors.text,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
  },
  section: {
    gap: spacing.md,
  },
  loadingBox: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pokemonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pokemonOption: {
    width: '30.8%',
    minWidth: 92,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  optionSprite: {
    width: 56,
    height: 56,
  },
  optionName: {
    maxWidth: '100%',
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  editorSprite: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  editorTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  chipRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: '#24364f',
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
  },
  readonlyChoice: {
    gap: spacing.xs,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  readonlyChoiceSelected: {
    borderColor: colors.primary,
    backgroundColor: '#12365f',
  },
  readonlyField: {
    gap: spacing.xs,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  readonlyChoiceLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  readonlyChoiceValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  optionPicker: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  optionPickerTitle: {
    color: colors.textSoft,
    fontWeight: '800',
  },
  optionList: {
    maxHeight: 190,
  },
  optionListContent: {
    gap: spacing.xs,
  },
  optionRow: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: '#24364f',
  },
  optionRowSelected: {
    backgroundColor: colors.primary,
  },
  optionRowText: {
    color: colors.text,
    fontWeight: '700',
  },
  optionRowTextSelected: {
    color: '#fff',
  },
  effectiveBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  effectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  effectiveLabel: {
    width: 82,
    color: colors.textSoft,
    fontWeight: '800',
  },
  effectiveTrack: {
    flex: 1,
    height: 10,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  effectiveFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  effectiveValue: {
    width: 38,
    color: colors.text,
    textAlign: 'right',
    fontWeight: '900',
  },
  statBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statField: {
    width: '47%',
    gap: spacing.xs,
  },
  statLabel: {
    color: colors.textSoft,
    fontWeight: '700',
  },
  statInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: '#334155',
    fontSize: 16,
  },
  removeButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  removeText: {
    color: colors.danger,
    fontWeight: '900',
  },
  savedList: {
    gap: spacing.sm,
  },
  savedCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  savedInfo: {
    gap: spacing.xs,
  },
  savedName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  savedActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.muted,
  },
  smallButtonBlue: {
    backgroundColor: colors.primary,
  },
  smallButtonDanger: {
    backgroundColor: colors.danger,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});

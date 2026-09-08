import type { EntryFilters } from '@/services/entries'

/**
 * `list` tem um segmento próprio — `['entries', 'list', filtros]` — e não é
 * arrumação: é o que permite ESCREVER numa lista em cache sem acertar
 * `['entries', 42]`, a chave de detalhe, que guarda uma obra e não um array.
 * Sem o segmento as duas formas são `['entries', X]` e só o tipo de `X`
 * separa uma da outra.
 */
export const entryKeys = {
  all: ['entries'] as const,
  lists: () => ['entries', 'list'] as const,
  list: (filters: EntryFilters) => ['entries', 'list', filters ?? {}] as const,
  detail: (id: number) => ['entries', id] as const,
  piles: (id: number) => ['entries', id, 'piles'] as const,
  links: (id: number) => ['entries', id, 'links'] as const,
}

import type { PileFilters } from '@/services/piles'

/**
 * `list` tem um segmento próprio — `['piles', 'list', filtros]` — pelo mesmo
 * motivo de `entryKeys`: sem ele, a chave da lista e a de detalhe são as duas
 * `['piles', X]`, e só o tipo de `X` separa um array de uma pilha. Escrever em
 * cache pede endereço exato.
 */
export const pileKeys = {
  all: ['piles'] as const,
  lists: () => ['piles', 'list'] as const,
  list: (filters: PileFilters) => ['piles', 'list', filters ?? {}] as const,
  detail: (id: number) => ['piles', id] as const,
  entries: (id: number) => ['piles', id, 'entries'] as const,
}

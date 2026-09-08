import type { EntryStatus } from './media'

/**
 * As quatro ordens de `/library`, na ordem em que o menu as lista
 * (`design/mockups/library.html`). As chaves são as mesmas que o servidor
 * aceita em `?sort=` — o rótulo traduzível fica no catálogo de copy, nunca na
 * URL.
 */
export const ENTRY_SORTS = ['updated', 'added', 'title', 'rating'] as const

export type EntrySort = (typeof ENTRY_SORTS)[number]

export const DEFAULT_SORT: EntrySort = 'updated'

/**
 * A ordem em que o menu MOSTRA os status, que não é a do enum do schema.
 *
 * Ali a ordem é a da coluna; aqui é a do uso: o que está em andamento primeiro,
 * o abandonado por último. Separar as duas é o que permite acrescentar status
 * no schema sem reordenar o menu, e vice-versa.
 */
export const STATUS_ORDER: readonly EntryStatus[] = [
  'watching',
  'completed',
  'planned',
  'on-hold',
  'dropped',
]

/**
 * Os quatro modos de exibição, do mais denso ao mais espaçoso — a ordem em que
 * a fileira do menu os desenha, que é também a ordem de quanto cada um mostra.
 *
 * **O inventário é do OBJETO, não da tela** (design system, seção 5): `/piles`
 * tem três, sem a grade compacta, porque uma pilha sem o nome é um quadrado
 * anônimo. Um modo só entra se mostrar o que identifica o objeto.
 */
export const VIEW_MODES = [
  'compact-list',
  'list',
  'compact-grid',
  'grid',
] as const

export type ViewMode = (typeof VIEW_MODES)[number]

export const DEFAULT_VIEW: ViewMode = 'grid'

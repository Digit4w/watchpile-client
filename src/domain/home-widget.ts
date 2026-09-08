import type { EntryStatus, MediaType } from './media'

export const WIDGET_TYPES = ['list', 'grid', 'scroll', 'stats'] as const

export type WidgetType = (typeof WIDGET_TYPES)[number]

/**
 * O que o seletor oferece. `stats` existe no enum porque o servidor o aceita,
 * mas os campos dele seguem em aberto no brief 3.15 (agrega por tipo de mídia
 * ou geral? quais números?) — oferecer um tipo que só renderiza um aviso é pior
 * que não oferecer. Some daqui, não do enum: widget `stats` criado por fora da
 * UI continua válido e continua renderizando.
 */
export const SELECTABLE_WIDGET_TYPES = WIDGET_TYPES.filter(
  (type) => type !== 'stats',
)

/**
 * O filtro é do widget, não da pile (brief, 3.15) — a mesma pile aparece
 * filtrada de um jeito num widget e de outro no vizinho.
 */
export type WidgetFilter = {
  mediaType?: MediaType[]
  status?: EntryStatus[]
}

export type WidgetLayout = {
  x: number
  y: number
  w: number
  h: number
}

/**
 * `pileIds` vazio significa **a biblioteca inteira**, não widget vazio: sem
 * restrição de fonte, só o filtro decide (brief, 3.15).
 */
export type HomeWidget = WidgetLayout & {
  id: number
  type: WidgetType
  /**
   * Nome dado pelo usuário. `null` significa "use o rótulo derivado" (tipo +
   * fonte) — e não "sem nome": dois widgets da mesma pile ficavam com
   * cabeçalho idêntico e indistinguíveis na home.
   */
  title: string | null
  filter: WidgetFilter
  pileIds: number[]
  itemCount: number | null
  createdAt: string
  updatedAt: string
}

export function isWholeLibrary(widget: HomeWidget): boolean {
  return widget.pileIds.length === 0
}

export function hasFilter(filter: WidgetFilter): boolean {
  return Boolean(filter.mediaType?.length || filter.status?.length)
}

/**
 * O que o cabeçalho do widget mostra. O nome do usuário quando existe; senão o
 * rótulo derivado, que é o comportamento padrão e não um estado incompleto.
 *
 * Vive no domínio porque é regra, não formatação: quem decide se há nome não é
 * o componente que desenha.
 */
export function widgetLabel(
  widget: HomeWidget,
  derived: { type: string; source: string },
): string {
  return widget.title ?? `${derived.type} · ${derived.source}`
}

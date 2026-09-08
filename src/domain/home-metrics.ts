import type { WidgetType } from './home-widget'

/**
 * A geometria da Home, e a única conta que faz a carta encaixar na grade.
 *
 * ── O problema que isto resolve (29/08/2026) ────────────────────────────────
 * A grade tem passo fixo; a carta de mídia tem altura própria. Se os dois não
 * forem múltiplos, o usuário arrasta a borda do widget procurando a fileira
 * certa e sempre para numa carta cortada pela metade ou num vão sobrando. Não
 * é um problema de ajuste fino: é aritmético, e some ou não some conforme os
 * números se dividam.
 *
 * ── O acordo ────────────────────────────────────────────────────────────────
 * A carta tem tamanho FIXO — a altura dela não depende da largura do widget —,
 * e todas as alturas do sistema são múltiplas do passo da grade. Quem cede é a
 * carta, não a altura: em troca, sobra faixa à direita quando a largura do
 * widget não é múltipla da carta, do mesmo jeito que Plex e Netflix, que
 * também usam tile de tamanho fixo.
 *
 * ── A conta ─────────────────────────────────────────────────────────────────
 * Um widget de `h` linhas tem `h·PITCH − GAP` px. Descontando o chrome dele,
 * sobra o conteúdo:
 *
 *     conteúdo(h) = h·PITCH − GAP − CHROME
 *
 * Com `n` fileiras de altura `H` separadas por `GAP`, o conteúdo é preenchido
 * exatamente quando `n·H + (n−1)·GAP = conteúdo(h)`, ou seja:
 *
 *     n·(H + GAP) = h·PITCH − CHROME
 *
 * **É por isso que `CHROME` vale exatamente um `PITCH`**: com `CHROME = PITCH`
 * o lado direito vira `PITCH·(h−1)`, e a conta fecha em inteiros sempre que
 * `H + GAP` for múltiplo de `PITCH`. Mexer no padding ou no header do widget
 * sem mexer aqui quebra o encaixe inteiro — o número não é estético.
 */

export const GRID_COLS = 12
export const GRID_ROW_HEIGHT = 56
export const GRID_GAP = 16

/** O que uma linha a mais custa em pixels. */
export const ROW_PITCH = GRID_ROW_HEIGHT + GRID_GAP

/**
 * Padding + header do widget, cravado em uma linha de grade.
 *
 * `p-4` (16 + 16) + header `h-6` (24) + `mb-4` (16) = 72. Duas armadilhas que
 * já custaram os 2px, e por isso estão escritas aqui:
 *
 * - **O contorno do widget é `ring`, não `border`.** Com `box-sizing:
 *   border-box` a borda sai de dentro da altura, e 1px em cima mais 1px
 *   embaixo levariam o chrome a 74 — o bastante pra cortar a última fileira
 * - **O header tem altura fixa `h-6`.** Os botões de configurar/remover só
 *   existem no Edit Layout; sem `h-6` no próprio header o chrome encolheria
 *   8px ao sair do modo, e o conteúdo mudaria de altura sozinho
 */
export const WIDGET_CHROME = ROW_PITCH

/** Linha do widget de lista. Uma linha de grade por linha de lista. */
export const LIST_ROW_HEIGHT = 56

/**
 * A carta de pôster: 133,33 × 200. Três linhas de grade por fileira.
 *
 * A altura é que foi escolhida — 200 é o menor valor acima de 128 que satisfaz
 * `H + GAP ≡ 0 (mod PITCH)` —, e a largura sai dela pelo `--aspect-poster`
 * (2:3). Escrever a largura como número redondo e deixar a altura seguir daria
 * 133 × 199,5, e o encaixe morreria por meio pixel acumulado por fileira.
 */
export const CARD_HEIGHT = 200
export const CARD_WIDTH = (CARD_HEIGHT * 2) / 3

/**
 * Quantas linhas da grade uma fileira de conteúdo ocupa.
 *
 * Fracionário aqui significa que o encaixe não fecha — por isso o teste em
 * `home-metrics.spec.ts` exige inteiro para as duas alturas do sistema.
 */
export function rowsPerContentRow(itemHeight: number): number {
  return (itemHeight + GRID_GAP) / ROW_PITCH
}

/** Altura de conteúdo, em px, de um widget de `h` linhas. */
export function contentHeight(h: number): number {
  return h * ROW_PITCH - GRID_GAP - WIDGET_CHROME
}

/** Quantas fileiras de `itemHeight` cabem exatas num widget de `h` linhas. */
export function contentRows(h: number, itemHeight: number): number {
  return (h - 1) / rowsPerContentRow(itemHeight)
}

type WidgetMetrics = {
  /** De quantas em quantas linhas a altura do widget anda. */
  step: number
  minH: number
  /** Altura travada, quando o tipo só admite uma. */
  maxH?: number
}

/**
 * O passo de cada tipo. Lista anda de 1 em 1 porque a linha dela custa uma
 * linha de grade; grade anda de 3 em 3 porque a carta custa três.
 *
 * `scroll` é uma fileira só que desliza na horizontal (é a definição do tipo,
 * não uma limitação), então a altura dele não é escolha do usuário — trava em
 * `4`, que é exatamente uma fileira de carta.
 */
const METRICS: Record<WidgetType, WidgetMetrics> = {
  list: { step: rowsPerContentRow(LIST_ROW_HEIGHT), minH: 3 },
  grid: { step: rowsPerContentRow(CARD_HEIGHT), minH: 4 },
  scroll: { step: rowsPerContentRow(CARD_HEIGHT), minH: 4, maxH: 4 },
  // `stats` não tem campos decididos (brief, 3.15) e não renderiza fileira
  // nenhuma — anda de 1 em 1 pra não inventar encaixe pra conteúdo que não
  // existe.
  stats: { step: 1, minH: 3 },
}

export function metricsFor(type: WidgetType): WidgetMetrics {
  return METRICS[type]
}

/**
 * A maior altura válida que não passa da pedida.
 *
 * Alturas válidas são `1 + n·step` — o `1` é o chrome, que custa uma linha e
 * não mostra conteúdo. Arredonda sempre **para baixo**: quem chama já limitou
 * `h` pelo vizinho de baixo (`clampResize`), e subir de novo passaria por cima
 * dele.
 *
 * Quando nem a menor altura válida cabe, devolve o que veio em vez de forçar:
 * um widget fora de encaixe é feio, um widget sobreposto é bug.
 */
export function snapHeight(h: number, type: WidgetType): number {
  const { step, minH, maxH } = metricsFor(type)

  if (h < minH) {
    return h
  }
  if (maxH !== undefined) {
    return maxH
  }

  const rows = Math.floor((h - 1) / step)
  const snapped = 1 + rows * step

  return snapped < minH ? minH : snapped
}

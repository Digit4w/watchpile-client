import type { Compactor, Layout, LayoutItem } from 'react-grid-layout'
import { verticalCompactor } from 'react-grid-layout'
import { placeInRow, pushAfterResize } from '@/domain/widget-fit'

/**
 * O arrasto em andamento. O `Compactor` da lib não recebe nada sobre o gesto —
 * só o layout —, então quem está sendo arrastado chega por aqui.
 */
export type Gesture = {
  kind: 'drag' | 'resize'
  i: string
  /**
   * Posição que o cursor pede, em unidades de grade, escrita pela constraint
   * de posição a cada tick.
   *
   * **É daqui que o arrasto lê a posição, não do layout** — e isso não é
   * detalhe. Ler do layout cria realimentação: o widget vira 10 colunas, passa
   * a colidir com o vizinho, a lib empurra o vizinho, a geometria muda, o `y`
   * derivado dela volta pra linha antiga, a largura volta pra 6, o empurrão se
   * desfaz — e o ciclo recomeça, um tick sim outro não. Era o preview piscando
   * no arrasto diagonal (28/08/2026). O cursor, ao contrário, é monotônico e
   * nada do que o compactor faz o perturba.
   */
  cursor?: { x: number; y: number }
  /**
   * Posições de ANTES do gesto. O `react-grid-layout` empurra os vizinhos
   * antes do compactor rodar e, sem compactação depois, nada desfaz esse
   * empurrão — então cada tick é reconstruído a partir daqui, não do layout
   * que chegou.
   */
  others: LayoutItem[]
}

/**
 * Compactor que implementa o modelo de layout da Home (brief, 3.15), decidido
 * em 28/08/2026:
 *
 * - **Tudo sobe até encostar** (compactação vertical, 28/08/2026). Não existe
 *   linha vazia: sobrou espaço em cima, os widgets de baixo ocupam. É isso que
 *   dá o limite do arrasto de graça — soltar em qualquer profundidade para na
 *   primeira linha livre, então a grade nunca cresce além de uma linha depois
 *   da última. Reverte a escolha anterior de posicionamento livre
 * - **A linha se divide entre quem está nela** ao arrastar, e linha é grupo
 *   de mesmo `y` — a regra e o porquê estão em `domain/widget-fit.ts`
 * - **O resize empurra os companheiros de linha** quando há espaço. O tamanho
 *   em si é limitado em `resize-constraint.ts`, que roda antes do placeholder;
 *   o empurrão é aqui, porque constraint nenhum alcança outro item.
 * - **Crescer pra baixo empurra quem está embaixo** (29/08/2026), e isso sai
 *   de graça da compactação: tirada a parede do `clampResize`, o widget passa
 *   a colidir com o de baixo, e a compactação vertical o desce. Não existe
 *   código de empurrão vertical aqui — existe a ausência de um teto.
 *
 * Por que o arrasto é aqui e não em `constraints`: `constrainPosition` só
 * devolve `{ x, y }`, e nenhum constraint alcança outro item que não o do
 * gesto — mas dividir a linha significa mexer nos vizinhos. O `compactor`
 * recebe o layout inteiro e devolve outro, a cada tick; é o único ponto com
 * poder pra isso.
 */
export function createFitCompactor(
  baseline: { current: Gesture | null },
  minW: number,
): Compactor {
  return {
    type: verticalCompactor.type,
    allowOverlap: verticalCompactor.allowOverlap,

    compact(layout: Layout, cols: number): Layout {
      const active = baseline.current
      const target = active && layout.find((item) => item.i === active.i)

      if (!active || !target) {
        return verticalCompactor.compact(layout, cols)
      }

      // Resize: o tamanho já veio limitado do `resize-constraint`; o que falta
      // é acomodar quem estava no caminho.
      if (active.kind === 'resize') {
        const from = active.others.find(({ i }) => i === active.i)
        if (!from) {
          return layout.map((item) => ({ ...item }))
        }
        const pushed = new Map(
          pushAfterResize({ resized: target, from, others: active.others }).map(
            (patch) => [patch.i, patch],
          ),
        )
        const settled = layout.map((item) => {
          const base = active.others.find(({ i }) => i === item.i) ?? item
          const patch = pushed.get(item.i)
          return item.i === active.i
            ? { ...item }
            : { ...item, x: patch?.x ?? base.x, y: base.y, w: base.w }
        })
        return verticalCompactor.compact(settled, cols)
      }

      const origin = active.others.find(({ i }) => i === active.i)
      if (!origin) {
        return verticalCompactor.compact(layout, cols)
      }

      const others = active.others.filter((item) => item.i !== active.i)
      // O tamanho vem da baseline, não do layout: o layout já carrega o que
      // este mesmo compactor escreveu no tick anterior.
      const dragged = {
        ...origin,
        x: active.cursor?.x ?? target.x,
        y: active.cursor?.y ?? target.y,
      }
      const patches = placeInRow({ origin, dragged, others, cols, minW })
      const byId = new Map((patches ?? []).map((patch) => [patch.i, patch]))

      const placed = layout.map((item) => {
        // Vizinho sempre volta pra baseline antes de receber a divisão: é isso
        // que desfaz o empurrão do `moveElement`.
        const base = others.find(({ i }) => i === item.i) ?? item
        const patch = byId.get(item.i)

        if (item.i !== active.i) {
          return {
            ...item,
            x: patch?.x ?? base.x,
            y: patch?.y ?? base.y,
            w: patch?.w ?? base.w,
            h: base.h,
          }
        }

        // Recusa: a linha não comporta mais ninguém acima do mínimo, então o
        // arrastado fica onde estava em vez de sobrepor alguém.
        if (!patch) {
          return { ...item, ...origin }
        }

        return { ...item, x: patch.x, y: patch.y, w: patch.w }
      })

      // A compactação por último: a linha já foi decidida acima, e isto só
      // fecha os buracos que sobraram em cima. Não realimenta nada, porque a
      // entrada da decisão é o cursor, não este resultado.
      return verticalCompactor.compact(placed, cols)
    },
  }
}

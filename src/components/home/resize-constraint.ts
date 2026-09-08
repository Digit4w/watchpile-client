import type {
  ConstraintContext,
  LayoutConstraint,
  LayoutItem,
  ResizeHandleAxis,
} from 'react-grid-layout/core'
import { snapHeight } from '@/domain/home-metrics'
import type { WidgetType } from '@/domain/home-widget'
import type { ResizeTowards } from '@/domain/widget-fit'
import { clampResize } from '@/domain/widget-fit'
import type { Gesture } from './fit-compactor'

/**
 * Limita o resize ao espaço que a linha realmente tem — a regra e o porquê
 * estão em `domain/widget-fit.ts`.
 *
 * **Por que `constrainSize` e não o compactor**, mesmo o compactor também
 * conseguindo limitar: o elemento redimensionado sempre acompanha o mouse, por
 * design da lib (`resizePositionRef` alimenta o estilo direto, sem passar por
 * constraint nenhuma). Quem mostra o tamanho de verdade é o **placeholder** —
 * e ele é montado a partir do valor que sai daqui. Limitar no compactor
 * chegava tarde: o placeholder anunciava um tamanho e, ao soltar, o widget
 * pulava pra outro.
 *
 * O empurrão dos vizinhos é a outra metade, e essa **é** do compactor: nenhum
 * constraint alcança outro item que não o do gesto.
 *
 * `applySizeConstraints` aplica em sequência, então isto entra **depois** de
 * `defaultConstraints` pra ter a última palavra.
 */
export function createResizeRoom(
  minW: number,
  minH: number,
  gesture: { current: Gesture | null },
  /**
   * Tipo de cada widget, por id. O passo de altura é do TIPO — lista anda de
   * 1 em 1, grade de 3 em 3 —, e o `LayoutItem` só carrega o `i`.
   */
  typeOf: (i: string) => WidgetType | undefined,
): LayoutConstraint {
  return {
    name: 'resizeRoom',

    /**
     * Não constrange nada — anota. É o único ponto do ciclo onde a posição
     * pedida pelo cursor aparece limpa, antes de virar layout, e o compactor
     * precisa dela justamente por isso (ver `Gesture['cursor']`).
     */
    constrainPosition(item: LayoutItem, x: number, y: number) {
      const active = gesture.current
      if (active?.kind === 'drag' && active.i === item.i) {
        active.cursor = { x, y }
      }
      return { x, y }
    },

    constrainSize(
      item: LayoutItem,
      w: number,
      h: number,
      handle: ResizeHandleAxis,
      context: ConstraintContext,
    ) {
      const towards: ResizeTowards = handle.includes('w') ? 'left' : 'right'

      const room = clampResize({
        box: { i: item.i, x: item.x, y: item.y, w, h },
        others: context.layout.filter(({ i }) => i !== item.i),
        cols: context.cols,
        minW: item.minW ?? minW,
        minH: item.minH ?? minH,
        towards,
        // `item` ainda é o widget como ele estava, então esta é a borda parada.
        edge: towards === 'right' ? item.x : item.x + item.w,
      })

      /**
       * O encaixe entra DEPOIS do limite, nunca antes: `snapHeight` só
       * arredonda pra baixo, então nunca desfaz o piso que o `clampResize`
       * acabou de impor. Na ordem inversa, encaixar primeiro e limitar depois
       * devolveria uma altura fora do passo sempre que o mínimo do tipo
       * mordesse.
       *
       * Isto lê só o TIPO do widget, que é dado estático — não a geometria do
       * conteúdo renderizado. É de propósito: derivar a restrição do que está
       * na tela realimenta o layout, que é a armadilha registrada em
       * `client/CLAUDE.md` e custou três reescritas do modelo de grade.
       */
      const type = typeOf(item.i)

      return type === undefined
        ? room
        : { w: room.w, h: snapHeight(room.h, type) }
    },
  }
}

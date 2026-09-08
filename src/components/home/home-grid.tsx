import { useMemo, useRef } from 'react'
import type { EventCallback, Layout } from 'react-grid-layout'
import GridLayout, { useContainerWidth } from 'react-grid-layout'
import { defaultConstraints } from 'react-grid-layout/core'
import 'react-grid-layout/css/styles.css'
// depois do CSS da lib, no mesmo módulo: é o que garante a ordem no bundle
import '@/styles/grid-layout.css'
import {
  GRID_COLS,
  GRID_GAP,
  GRID_ROW_HEIGHT,
  metricsFor,
  snapHeight,
} from '@/domain/home-metrics'
import type { HomeWidget, WidgetType } from '@/domain/home-widget'
import { resizeRoom } from '@/domain/widget-fit'
import { useSaveLayout } from '@/hooks/mutations/home-widgets/use-save-layout'
import type { Gesture } from './fit-compactor'
import { createFitCompactor } from './fit-compactor'
import { createResizeRoom } from './resize-constraint'
import { WidgetFrame } from './widget-frame'

/**
 * A geometria mora em `domain/home-metrics.ts` — ela é o que faz a carta de
 * mídia encaixar na grade, e um número solto aqui quebraria a conta em
 * silêncio.
 */
const COLS = GRID_COLS
const ROW_HEIGHT = GRID_ROW_HEIGHT
const GAP = GRID_GAP

/** Piso de LARGURA do widget. O `MIN_W` também é o limite da divisão de linha
 * ao arrastar: se dividir deixaria alguém abaixo disso, o widget não entra na
 * linha (`domain/widget-fit.ts`).
 *
 * O piso de ALTURA não é global: depende do tipo, porque uma fileira de cartas
 * custa três linhas e uma linha de lista custa uma. Vem de `metricsFor`. */
const MIN_W = 2
const FALLBACK_MIN_H = 3

/** Tamanho de um widget recém-solto. Meia largura e altura confortável pra
 * lista — o usuário ajusta depois, e o encaixe de linha corrige a largura na
 * hora do drop. */
export const NEW_WIDGET_W = 6
export const NEW_WIDGET_H = 4

/** Uma linha de folga abaixo do conteúdo, no modo de edição, além da altura do
 * widget mais alto — o suficiente pra alcançar a primeira linha livre. Não
 * precisa de mais: a compactação puxa pra cima o que for solto além disso. */
const SPARE_ROWS = 1

type HomeGridProps = {
  widgets: HomeWidget[]
  editing: boolean
  /** Tipo em arrasto vindo do painel, ou `null`. Liga o `dropConfig`. */
  dropping: WidgetType | null
  onDrop: (position: { x: number; y: number }) => void
}

export function HomeGrid({
  widgets,
  editing,
  dropping,
  onDrop,
}: HomeGridProps) {
  const { width, containerRef } = useContainerWidth()
  const saveLayout = useSaveLayout()

  /**
   * O compactor precisa saber qual widget está no gesto e como o layout estava
   * antes dele — e o `Compactor` da lib não recebe nada disso. Um ref
   * preenchido no início do gesto é a ponte; identidade estável porque a lib
   * memoiza os callbacks de drag/resize pelo compactor.
   */
  const baseline = useRef<Gesture | null>(null)
  const compactor = useMemo(() => createFitCompactor(baseline, MIN_W), [])

  // Espelho id → tipo num ref: o constraint precisa do tipo durante o gesto, e
  // recriar o array de constraints a cada render faria a lib remontar os
  // callbacks memoizados no meio do arrasto.
  const typeById = useRef(new Map<string, WidgetType>())
  typeById.current = new Map(
    widgets.map((widget) => [String(widget.id), widget.type]),
  )

  const constraints = useMemo(
    () => [
      ...defaultConstraints,
      createResizeRoom(MIN_W, FALLBACK_MIN_H, baseline, (i) =>
        typeById.current.get(i),
      ),
    ],
    [],
  )

  // Cópia rasa item a item, não do array: o `moveElement` da lib muta as
  // posições no lugar durante o arrasto, e guardar as mesmas referências faria
  // a baseline andar junto — que é exatamente o que ela existe pra não fazer.
  const handleDragStart: EventCallback = (current, oldItem) => {
    baseline.current = oldItem
      ? { kind: 'drag', i: oldItem.i, others: current.map((i) => ({ ...i })) }
      : null
    gestureHeight(true)
  }

  const handleResizeStart: EventCallback = (current, oldItem) => {
    baseline.current = oldItem
      ? { kind: 'resize', i: oldItem.i, others: current.map((i) => ({ ...i })) }
      : null
  }

  const handleGestureStop: EventCallback = () => {
    baseline.current = null
    gestureHeight(false)
  }

  /**
   * O `snapHeight` na montagem existe pelo mesmo motivo que a compactação:
   * corrigir layout que o banco guarda fora de encaixe. Widget criado antes
   * desta regra, ou por fora da UI, tem altura qualquer — e sem isso ele ficaria
   * com a última fileira cortada até alguém pensar em redimensioná-lo.
   *
   * Não vira laço: `snapHeight` é idempotente, então o `handleLayoutChange`
   * abaixo grava uma vez e para de ver diferença.
   */
  const boxes = widgets.map((widget) => ({
    i: String(widget.id),
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
  }))

  const layout: Layout = widgets.map((widget, index) => {
    const { minH, maxH } = metricsFor(widget.type)
    const box = boxes[index] as (typeof boxes)[number]

    /**
     * `maxW` vira limite de PIXEL no elemento arrastado (a lib o converte em
     * `maxConstraints` do `react-resizable`). Sem ele, só o placeholder parava
     * no vizinho e o widget passava por cima — ver `resizeRoom` em
     * `domain/widget-fit.ts`.
     *
     * **Não há `maxH` de espaço, e isso é a regra de 29/08/2026:** crescer pra
     * baixo empurra quem está embaixo, então o único teto de altura é o do
     * TIPO — `scroll` é uma fileira só, mesmo com meia tela livre embaixo.
     */
    const { maxW } = resizeRoom({
      box,
      others: boxes.filter(({ i }) => i !== box.i),
      cols: COLS,
      minW: MIN_W,
      minH,
    })

    return {
      ...box,
      h: snapHeight(widget.h, widget.type),
      minW: MIN_W,
      minH,
      maxW,
      maxH,
    }
  })

  /**
   * O `react-grid-layout` emite o layout INTEIRO a cada gesto, e é por isso
   * que o servidor tem uma rota de lote: um PATCH por widget seria uma rajada
   * por arrasto, e falha no meio deixaria o layout pela metade.
   *
   * Salva também fora do modo de edição, e isso é de propósito: a compactação
   * corrige o layout na montagem — um widget encurtado deixa quem está abaixo
   * subir —, e sem gravar a tela mostraria uma coisa e o banco guardaria
   * outra. Escrever no carregamento não é acidente, é o layout compactado
   * virando o canônico.
   *
   * Não vira laço: a comparação abaixo só deixa passar diferença real, e
   * compactar um layout já compactado não muda nada. Uma escrita e para.
   */
  function handleLayoutChange(next: Layout) {
    const changed = next.some((item) => {
      const widget = widgets.find(({ id }) => String(id) === item.i)
      return (
        widget !== undefined &&
        (widget.x !== item.x ||
          widget.y !== item.y ||
          widget.w !== item.w ||
          widget.h !== item.h)
      )
    })
    if (!changed) {
      return
    }

    saveLayout.mutate(
      next.map((item) => ({
        id: Number(item.i),
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      })),
    )
  }

  /**
   * `dragConfig.bounded` prende o elemento arrastado ao container — é o que
   * impede a página de alargar quando ele encosta na borda direita (o elemento
   * segue o cursor em pixels, por design da lib, e chegava a centenas de px
   * fora da janela).
   *
   * Só que `bounded` limita os DOIS eixos, e o limite de baixo é o
   * `clientHeight` do container, que o `autoSize` deixa exatamente na altura
   * do conteúdo — ou seja, não dava mais pra descer e abrir linha nova. O
   * `min-height` daqui resolve: em CSS ele vence o `height` inline do
   * `autoSize`, então o limite horizontal continua colado na borda e o
   * vertical ganha folga.
   */
  const bottomRow = widgets.reduce(
    (lowest, widget) => Math.max(lowest, widget.y + widget.h),
    0,
  )
  // A folga inclui a altura do widget mais alto porque o `bounded` desconta a
  // altura de quem está sendo arrastado: com folga fixa, um widget mais alto
  // que ela não alcançava sequer a linha logo abaixo do conteúdo.
  const tallest = widgets.reduce(
    (highest, widget) => Math.max(highest, widget.h),
    FALLBACK_MIN_H,
  )
  const slack = (bottomRow + tallest + SPARE_ROWS) * (ROW_HEIGHT + GAP)

  /**
   * A folga vale **durante o gesto**, não durante o modo de edição inteiro.
   *
   * Antes ela entrava junto com o Edit Layout e inflava a grade em centenas de
   * pixels de vazio — a página ganhava uma barra de rolagem que não tinha, só
   * por alternar o modo. Ela existe pra o `bounded` deixar alcançar a primeira
   * linha livre; fora do arrasto não serve pra nada.
   *
   * Arrastar de dentro é imperativo, sem passar por estado: mudar estado no
   * início do gesto força um render no meio dele, e re-render durante arrasto é
   * a família de bug que custou três reescritas deste modelo. Escrever
   * `style.minHeight` no nó não repinta React nenhum.
   *
   * Soltar um widget NOVO vindo do painel é o outro caso, e esse é de render:
   * `dropping` já vem por prop, e a grade precisa da altura antes de o gesto
   * começar — não há `onDragStart` nosso pra escutar.
   */
  const gridStyle =
    editing && dropping !== null ? { minHeight: slack } : undefined

  function gestureHeight(on: boolean) {
    const grid = containerRef.current?.firstElementChild
    if (grid instanceof HTMLElement) {
      grid.style.minHeight = on ? `${slack}px` : ''
    }
  }

  return (
    // `overflow-x-clip` é o guarda contra transbordo horizontal no resize: o
    // elemento redimensionado acompanha o cursor em pixels, por design da lib,
    // e passava da grade alargando a página inteira. `clip` corta sem virar
    // container de rolagem, então o vertical segue livre — que é o único
    // transbordo permitido. (No arrasto quem resolve é `dragConfig.bounded`.)
    //
    // `select-none` só no modo de edição: nem a lib nem o react-draggable
    // ligam o hack de `user-select`, então arrastar por cima de um widget
    // selecionava o texto dele e a tela piscava.
    <div
      ref={containerRef}
      className={editing ? 'select-none overflow-x-clip' : undefined}
    >
      <GridLayout
        width={width}
        layout={layout}
        // `containerPadding` cai pro valor de `margin` quando não é informado, e
        // isso punha um gutter de 16px antes da primeira coluna: o título da
        // página começava em x, o primeiro widget em x+16, e a área de conteúdo
        // dele em x+32 — três bordas esquerdas diferentes na mesma tela.
        //
        // Zerado, a borda do widget encosta na do container e alinha com o
        // título. O recuo que sobra é só o `p-4` do próprio card, que é padding
        // de card e não gutter de grade. De brinde, 32px a mais de largura útil
        // pras colunas.
        gridConfig={{
          cols: COLS,
          rowHeight: ROW_HEIGHT,
          margin: [GAP, GAP],
          containerPadding: [0, 0],
        }}
        style={gridStyle}
        dragConfig={{
          enabled: editing,
          bounded: true,
          handle: '.widget-drag-handle',
        }}
        // Dois handles: o `se` cresce pra direita, o `sw` pra esquerda. Sem o
        // `sw`, encolher pela esquerda exigia mover o widget e redimensionar
        // de novo.
        resizeConfig={{ enabled: editing, handles: ['se', 'sw'] }}
        compactor={compactor}
        constraints={constraints}
        // Arrastar do painel pra grade: a lib cuida do fantasma e do
        // posicionamento; o tipo vem por fora, porque `dataTransfer` não é
        // legível durante o `dragover`.
        dropConfig={{
          enabled: dropping !== null,
          defaultItem: { w: NEW_WIDGET_W, h: NEW_WIDGET_H },
        }}
        onDrop={(_layout, item) => {
          if (item) {
            onDrop({ x: item.x, y: item.y })
          }
        }}
        onDragStart={handleDragStart}
        onDragStop={handleGestureStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleGestureStop}
        onLayoutChange={handleLayoutChange}
      >
        {widgets.map((widget, index) => (
          <div key={widget.id}>
            <WidgetFrame widget={widget} editing={editing} index={index} />
          </div>
        ))}
      </GridLayout>
    </div>
  )
}

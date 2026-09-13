import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { type GridSlice, gridSlice } from '@/domain/grid-window'

/**
 * Monta só a fatia visível de uma lista longa (`domain/grid-window.ts`).
 *
 * ── O que ele mede, e por que não lê token nenhum ───────────────────────────
 * A altura da carta e a largura mínima da coluna estão em `tokens.css`, e
 * repeti-las aqui em pixel seria uma segunda conta da mesma coisa — a forma
 * mais conhecida de uma delas ficar pra trás, e a que este projeto já pagou
 * três vezes. Então ele **lê o layout que o navegador acabou de fazer**: a
 * altura sai do primeiro item montado, e o número de colunas sai de quantos
 * itens compartilham o mesmo topo.
 *
 * Vale para os quatro modos de `/library` sem saber de nenhum deles: grade,
 * grade compacta e as duas listas são a mesma pergunta com colunas diferentes,
 * e lista é grade de uma coluna.
 *
 * ── O arranque ──────────────────────────────────────────────────────────────
 * Não há o que medir antes do primeiro layout, então a primeira passada monta
 * um lote de arranque e mede em `useLayoutEffect` — antes da pintura, para que
 * ninguém veja a lista curta. Dura um layout, não um quadro.
 */

/** Quantos itens a primeira passada monta, só para haver o que medir. */
const PROBE = 24

type Metrics = { rowHeight: number; columns: number; gap: number }

export function useGridWindow<T extends HTMLElement>(count: number) {
  const ref = useRef<T | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [slice, setSlice] = useState<GridSlice | null>(null)

  const measure = useCallback(() => {
    const element = ref.current
    if (!element) {
      return null
    }

    const items = [...element.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    )
    const first = items[0]
    if (!first) {
      return null
    }

    const rowHeight = first.offsetHeight
    if (!(rowHeight > 0)) {
      return null
    }

    /**
     * Colunas = quantos itens dividem o topo do primeiro.
     *
     * É a única leitura que concorda com o CSS em qualquer largura: as grades
     * usam `auto-fill`, cujo número de colunas depende da janela, e a conta
     * própria só acertaria repetindo a fórmula do navegador aqui dentro.
     */
    let columns = 0
    for (const item of items) {
      if (item.offsetTop !== first.offsetTop) {
        break
      }
      columns += 1
    }

    /**
     * O vão entre LINHAS, e ele não é o `gap` do CSS quando a lista é flex:
     * medido do fim de uma linha ao começo da seguinte, vale nos dois casos.
     * Com uma linha só não há o que medir, e zero é a resposta certa — uma
     * lista que cabe inteira na dobra não precisa de vão nenhum na conta.
     */
    const nextRow = items[columns]
    const gap = nextRow
      ? Math.max(0, nextRow.offsetTop - (first.offsetTop + rowHeight))
      : 0

    return { rowHeight, columns: Math.max(1, columns), gap }
  }, [])

  /** Mede depois de cada layout — o arranque e toda remedição caem aqui. */
  useLayoutEffect(() => {
    const next = measure()
    if (!next) {
      return
    }

    setMetrics((current) =>
      current &&
      current.rowHeight === next.rowHeight &&
      current.columns === next.columns &&
      current.gap === next.gap
        ? current
        : next,
    )
  })

  /**
   * Recalcula a fatia e **só escreve quando ela muda de verdade**.
   *
   * O evento de rolagem dispara dezenas de vezes por segundo; escrever estado
   * em todos eles faria a tela re-renderizar a cada pixel para montar
   * exatamente as mesmas cartas, que é o custo que isto existe pra tirar.
   */
  const recompute = useCallback(() => {
    const element = ref.current
    if (!element || !metrics) {
      return
    }

    const box = element.getBoundingClientRect()
    const next = gridSlice({
      count,
      columns: metrics.columns,
      rowHeight: metrics.rowHeight,
      gap: metrics.gap,
      /**
       * A rolagem é da JANELA — nenhum ancestral de `/library` tem `overflow`
       * próprio (`app-shell.tsx`), o que se confirmou medindo. `box.top` já é
       * relativo à dobra, então o quanto a grade subiu é o seu negativo.
       */
      scrollTop: -box.top,
      viewport: window.innerHeight,
    })

    setSlice((current) =>
      current &&
      current.first === next.first &&
      current.count === next.count &&
      current.padTop === next.padTop &&
      current.padBottom === next.padBottom &&
      current.totalHeight === next.totalHeight
        ? current
        : next,
    )
  }, [count, metrics])

  useLayoutEffect(recompute, [recompute])

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    window.addEventListener('scroll', recompute, { passive: true })
    window.addEventListener('resize', recompute, { passive: true })
    /**
     * Observa o container também: trocar de modo ou abrir a folha lateral muda
     * a largura sem rolar nem redimensionar a janela, e sem isto a conta
     * ficaria com o número de colunas de antes.
     */
    const observer = new ResizeObserver(recompute)
    observer.observe(element)

    return () => {
      window.removeEventListener('scroll', recompute)
      window.removeEventListener('resize', recompute)
      observer.disconnect()
    }
  }, [recompute])

  /**
   * Enquanto não mediu, o lote de arranque. Depois, a fatia — e nunca a lista
   * inteira, que é o ponto.
   */
  const shown = slice ?? {
    first: 0,
    count: Math.min(count, PROBE),
    padTop: 0,
    padBottom: 0,
    totalHeight: 0,
  }

  return {
    ref,
    first: shown.first,
    /** Já fatiado: quem chama faz `entries.slice(first, first + visible)`. */
    visible: shown.count,
    /**
     * Os dois vãos vão como `padding` do próprio container — e não como itens
     * espaçadores, que numa grade CSS ocupariam colunas e empurrariam a
     * primeira carta da fatia para o meio da linha.
     */
    style: {
      paddingTop: shown.padTop,
      paddingBottom: shown.padBottom,
    },
  }
}

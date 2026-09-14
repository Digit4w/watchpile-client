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

/**
 * Quem rola: o ancestral com `overflow` próprio, ou a janela — 14/09/2026.
 *
 * A primeira versão assumia a janela, porque em `/library` nenhum ancestral
 * rola (`app-shell.tsx`). **Os widgets da Home rolam dentro de si**, e a
 * suposição os deixava de fora: a conta lia a rolagem da página enquanto o
 * conteúdo se movia dentro de uma caixa parada, então a fatia nunca mudava e a
 * grade inteira precisava existir.
 *
 * Descobrir em vez de receber por parâmetro: quem chama sabe o que está
 * listando, não onde a peça foi montada — e o mesmo componente aparece dentro
 * de um widget e numa tela inteira.
 */
function scrollerOf(element: HTMLElement, axis: Axis): HTMLElement | null {
  /**
   * **Começa no PRÓPRIO elemento**, e é o eixo `x` que obriga: na fileira
   * horizontal do widget o `overflow-x-auto` está no mesmo `<ul>` que lista os
   * itens, não num ancestral. Subir direto para o pai o deixaria de fora e a
   * conta leria a rolagem de outra caixa.
   */
  let node: HTMLElement | null = element
  while (node) {
    const style = getComputedStyle(node)
    const overflow = axis === 'x' ? style.overflowX : style.overflowY
    if (overflow === 'auto' || overflow === 'scroll') {
      return node
    }
    node = node.parentElement
  }
  return null
}

type Metrics = { rowHeight: number; columns: number; gap: number }

/**
 * Em que eixo a lista cresce — 14/09/2026.
 *
 * `y` é o caso comum: grades e listas que rolam para baixo. `x` é a fileira de
 * rolagem horizontal do widget da Home, que é uma linha só e cresce para o
 * lado. **A aritmética é a mesma** (`gridSlice` não sabe de eixo); o que muda é
 * qual medida do item se lê e contra qual borda a rolagem se mede.
 */
export type Axis = 'x' | 'y'

export function useGridWindow<T extends HTMLElement>(
  count: number,
  axis: Axis = 'y',
) {
  const ref = useRef<T | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [slice, setSlice] = useState<GridSlice | null>(null)

  const measure = useCallback(() => {
    const element = ref.current
    if (!element) {
      return null
    }

    /**
     * **Os espaçadores ficam de fora da medição** — 14/09/2026. No eixo `x` o
     * vão é um item do flex, e ele tem a largura do RESTO da lista; lido como
     * se fosse uma carta, ele daria um passo de milhares de pixels e a fatia
     * inteira caberia numa "coluna". Eles se marcam com `aria-hidden`, que é o
     * que já os tira da árvore de acessibilidade pelo mesmo motivo: não são
     * conteúdo.
     */
    const items = [...element.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.getAttribute('aria-hidden') === null,
    )
    const first = items[0]
    if (!first) {
      return null
    }

    const rowHeight = axis === 'x' ? first.offsetWidth : first.offsetHeight
    if (!(rowHeight > 0)) {
      return null
    }

    /**
     * Numa fileira horizontal todo item divide o mesmo topo, então a contagem
     * de colunas abaixo acharia a fileira inteira. O eixo `x` é sempre uma
     * "coluna" — os itens se sucedem no outro sentido.
     */
    if (axis === 'x') {
      const next = items[1]
      return {
        rowHeight,
        columns: 1,
        gap: next
          ? Math.max(0, next.offsetLeft - (first.offsetLeft + rowHeight))
          : 0,
      }
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
  }, [axis])

  /**
   * Mede o layout — e **só quando pode ter mudado** (13/09/2026).
   *
   * ── O que este efeito era, e o que custava ─────────────────────────────────
   * Ele nasceu sem lista de dependências, ou seja, rodando depois de TODO
   * render. Como `measure()` lê `offsetTop` e `offsetHeight`, cada passagem
   * força o navegador a calcular layout na hora, no meio da tarefa — e montar a
   * grade dispara vários renders em sequência (o lote de arranque, a fatia
   * medida, a fatia recalculada pela rolagem restaurada).
   *
   * Medido ao voltar de uma obra para `/library` com 1.442 obras: a remontagem
   * era **uma tarefa síncrona de ~140ms**, com 46 mutações da grade no mesmo
   * instante — tempo em que a interface não responde a nada, e que é o que se
   * sente como travada ao navegar e voltar.
   *
   * As dependências são o que o resultado da medição pode depender: quantos
   * itens estão montados agora (`count`) e se já houve uma medição. Rolar não
   * entra, e é o ponto — rolar muda a FATIA, não a altura da linha nem o número
   * de colunas. Largura de janela e troca de modo continuam cobertas pelo
   * `ResizeObserver` lá embaixo, que é quem deve pegá-las.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: medir depende do DOM montado, não de valores — ver o bloco acima
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
  }, [measure, count])

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
    const scroller = scrollerOf(element, axis)

    /**
     * O mesmo cálculo nos dois casos, e a diferença é só contra QUE borda a
     * distância se mede: a da caixa que rola, ou a da dobra da janela.
     */
    /**
     * Quanto a lista já subiu (ou andou para a esquerda), e há **dois casos**:
     *
     * - o scroller É o próprio elemento — a fileira horizontal do widget, onde
     *   `overflow-x` está no mesmo `<ul>`. Aí a diferença de bordas é sempre
     *   zero, e quem responde é `scrollLeft`/`scrollTop`
     * - o scroller é um ANCESTRAL (ou a janela) — aí o que vale é a distância
     *   entre as duas bordas
     */
    const scrollerBox = scroller?.getBoundingClientRect()
    const proprio = scroller === (element as unknown as HTMLElement)
    const scrollTop =
      axis === 'x'
        ? proprio
          ? scroller.scrollLeft
          : (scrollerBox?.left ?? 0) - box.left
        : proprio
          ? scroller.scrollTop
          : (scrollerBox?.top ?? 0) - box.top
    const viewport =
      axis === 'x'
        ? (scroller?.clientWidth ?? window.innerWidth)
        : (scroller?.clientHeight ?? window.innerHeight)

    const next = gridSlice({
      count,
      columns: metrics.columns,
      rowHeight: metrics.rowHeight,
      gap: metrics.gap,
      scrollTop,
      viewport,
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
  }, [count, metrics, axis])

  useLayoutEffect(recompute, [recompute])

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    /**
     * O evento de rolagem de uma caixa **não sobe para a janela**, então ouvir
     * só `window` deixaria os widgets sem recalcular. Ouvir os dois cobre as
     * duas montagens sem quem chama precisar dizer qual é.
     */
    const scroller = scrollerOf(element, axis)
    scroller?.addEventListener('scroll', recompute, { passive: true })
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
      scroller?.removeEventListener('scroll', recompute)
      window.removeEventListener('scroll', recompute)
      window.removeEventListener('resize', recompute)
      observer.disconnect()
    }
  }, [recompute, axis])

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
    /**
     * Os dois vãos, crus — quem monta decide COMO reservá-los.
     *
     * No eixo `y` eles viram padding do container (ver `style`). No eixo `x`
     * não podem: ali o elemento que rola é o MESMO que receberia o padding, e
     * padding lateral num flex que é o próprio scroller **infla o
     * `clientWidth`** em vez de criar espaço rolável — medido em 14/09/2026, a
     * fita colapsava para 1.438 cartas montadas assim que alguém a arrastava.
     * Lá o vão vira um item espaçador.
     */
    padStart: shown.padTop,
    padEnd: shown.padBottom,
    /**
     * Os dois vãos como `padding` do container — e não como itens espaçadores,
     * que numa grade CSS ocupariam colunas e empurrariam a primeira carta da
     * fatia para o meio da linha. **Serve o eixo `y`**; ver `padStart` acima.
     */
    style: { paddingTop: shown.padTop, paddingBottom: shown.padBottom },
  }
}

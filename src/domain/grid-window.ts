/**
 * Que fatia de uma lista longa precisa existir no DOM agora.
 *
 * ── Por que isto existe ─────────────────────────────────────────────────────
 * `/library` monta uma peça por obra, e o custo é proporcional: medido em
 * 13/09/2026 contra um banco de teste, **200 obras dão 5.588 nós de DOM e 77ms
 * por layout; 1.200 dão 37.788 nós e 611ms** (pior caso 841ms). A curva é reta
 * — 6× obras, 6,8× nós, 7,9× layout —, então não há tamanho de biblioteca a
 * partir do qual piora de repente: **já aos 200 um layout custa cinco vezes o
 * orçamento de um quadro**, e tudo que invalida layout (rolar, redimensionar,
 * abrir um menu) paga a conta inteira.
 *
 * O servidor não entra nessa conta: ele responde as 1.200 obras em 8–34ms. O
 * que cresce é o DOM, e o que conserta DOM que cresce é não montá-lo.
 *
 * ── Por que é conta nossa, e não uma biblioteca ─────────────────────────────
 * Virtualização genérica existe pra alturas que só se descobrem medindo. Aqui
 * **toda altura é conhecida antes de renderizar**: a carta tem 200px por
 * decisão (design system, seção 4), a compacta 150, e as duas listas são
 * contíguas em 56 e 36px. Com a altura dada, o que sobra é aritmética — e
 * aritmética decidível mora em `domain/` com teste, como `chip-fit` e
 * `widget-fit` (`vitest.config.ts` roda em `node`, sem navegador).
 *
 * ── O que isto CUSTA, e é custo assumido ────────────────────────────────────
 * O que não está no DOM não é achável pelo `Ctrl+F` do navegador. A busca da
 * própria tela continua servindo — ela roda no servidor e recorta a lista —,
 * mas a do navegador passa a ver só a fatia visível. É o preço de não montar
 * mil peças, e ele se paga: hoje as mil peças montadas custam 611ms por layout
 * a quem só quer rolar.
 */

export type GridWindow = {
  /** Quantos itens a lista tem no total. */
  count: number
  /** Quantas colunas a grade tem. **Lista é grade de uma coluna.** */
  columns: number
  /** Altura de uma linha, sem o gap. */
  rowHeight: number
  /** Espaço entre linhas, em pixel. */
  gap: number
  /**
   * Quanto já rolou, **medido do topo da grade** e não do topo da página.
   *
   * A grade nunca começa no topo: há o cabeçalho de duas faixas acima dela.
   * Quem chama subtrai o deslocamento; negativo aqui significa que a grade
   * ainda está abaixo da dobra, e vira zero.
   */
  scrollTop: number
  /** Altura visível, em pixel. */
  viewport: number
  /**
   * Linhas a mais renderizadas acima e abaixo da dobra.
   *
   * Não é folga arbitrária: sem ela a linha que entra pela borda é montada no
   * mesmo quadro em que precisa aparecer, e a grade pisca em branco enquanto
   * rola.
   *
   * **Quatro, e o número foi medido, não estimado** (13/09/2026). Com duas, um
   * gesto de roda de dez cliques — ~1.000px de uma vez — descobre o pé da dobra
   * por um quadro, e o vazio aparece no meio da grade; com rolagem de três
   * cliques ela nunca se descobria. Quatro linhas são 864px de folga de cada
   * lado, que é quase uma dobra inteira, e custam 24 cartas a mais num total de
   * 72 — contra as 1.200 que o modo sem esta conta montava.
   */
  overscan?: number
}

export type GridSlice = {
  /** Índice do primeiro item a montar. */
  first: number
  /** Quantos itens montar, a partir de `first`. */
  count: number
  /** Altura do vão que segura o que está acima, em pixel. */
  padTop: number
  /** Altura do vão que segura o que está abaixo, em pixel. */
  padBottom: number
  /**
   * Altura que a grade inteira teria montada.
   *
   * **A barra de rolagem tem que medir a lista INTEIRA**, não a fatia: se ela
   * encolhesse com a fatia, rolar mudaria o tamanho da própria barra e a
   * posição fugiria da mão de quem arrasta.
   */
  totalHeight: number
}

/**
 * A fatia que precisa existir agora.
 *
 * Devolve índices de ITEM, não de linha, porque quem renderiza pensa em obra —
 * a linha é detalhe da aritmética e não precisa vazar pra tela. `first` é
 * sempre múltiplo de `columns`, o que faz a fatia começar no começo de uma
 * linha e a grade não andar de lado ao rolar.
 */
export function gridSlice({
  count,
  columns,
  rowHeight,
  gap,
  scrollTop,
  viewport,
  overscan = 4,
}: GridWindow): GridSlice {
  const cols = Math.max(1, Math.floor(columns))

  if (count <= 0 || !(rowHeight > 0)) {
    return { first: 0, count: 0, padTop: 0, padBottom: 0, totalHeight: 0 }
  }

  const rows = Math.ceil(count / cols)
  const step = rowHeight + gap
  /** O último gap não existe: n linhas têm n−1 vãos entre elas. */
  const totalHeight = rows * step - gap

  const top = Math.max(0, scrollTop)
  const height = Math.max(0, viewport)

  /**
   * O teto de `firstRow` é a ÚLTIMA linha que existe, não `rows` — senão um
   * `scrollTop` além do fim devolve um `first` fora da lista.
   *
   * E isso não é caso de laboratório: rolar até o fim de mil obras e então
   * apertar um filtro que deixa cinquenta faz exatamente isso, no quadro entre
   * a lista encolher e o navegador corrigir a rolagem.
   */
  const firstRow = clamp(Math.floor(top / step) - overscan, 0, rows - 1)
  const lastRow = clamp(
    Math.ceil((top + height) / step) + overscan,
    firstRow,
    rows,
  )

  const first = firstRow * cols
  /** A última linha pode estar incompleta — daí o `min` contra o total. */
  const last = Math.min(count, lastRow * cols)

  const padTop = firstRow * step
  /**
   * `padBottom` é **derivado**, nunca calculado por conta própria: a soma dos
   * três tem que fechar `totalHeight` exatamente, e duas contas da mesma coisa
   * é como uma fica pra trás — aqui ficaria como um pulo de um gap no fim da
   * lista, visível só na última linha.
   */
  const rendered = lastRow > firstRow ? (lastRow - firstRow) * step - gap : 0
  const padBottom = Math.max(0, totalHeight - padTop - rendered)

  return {
    first,
    count: Math.max(0, last - first),
    padTop,
    padBottom,
    totalHeight,
  }
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value))
}

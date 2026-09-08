/**
 * Quais chips cabem na fileira, e quais transbordam pro menu.
 *
 * ── Por que isto é conta, e não CSS ─────────────────────────────────────────
 * `overflow-x: auto` resolve o layout e **esconde o problema**: no desktop a
 * fileira passa a rolar sem barra visível, e os tipos que sobraram deixam de
 * existir pra quem olha. A decisão de 29/08 diz que filtro que não cabe na
 * fileira **se define no menu e volta a ela como chip** — e pra saber o que
 * não cabe é preciso medir, não estimar (design system, seção 8, quarta leva:
 * *affordance de "tem mais" se mede, não se estima*).
 *
 * ── Por que a largura vem de fora ───────────────────────────────────────────
 * O rótulo é traduzível e a fonte é do sistema, então a largura de um chip não
 * se calcula — se lê do DOM. O que mora aqui é só a aritmética, que é o que dá
 * pra testar sem navegador (`vitest.config.ts` roda em `node`; toda regra
 * decidível vai pra `domain/`).
 */

export type ChipFit = {
  /** Larguras em pixel, na ordem do vocabulário. */
  widths: number[]
  /** Espaçamento entre chips, em pixel. */
  gap: number
  /** Espaço livre depois do que é fixo — o chip de status e o `All`. */
  available: number
  /**
   * Índice que precisa aparecer aconteça o que acontecer: o tipo ativo.
   *
   * **Ele nunca some pro menu.** Um filtro ligado que não aparece na tela é o
   * defeito que esta função existe pra evitar; esconder justamente o que está
   * ligado seria trocar um problema por um pior.
   */
  required?: number | null
}

/**
 * Os índices que ficam na fileira, **em ordem de vocabulário**.
 *
 * A ordem nunca é a de escolha: a fileira é a mesma lista de Settings e do
 * menu, e reordená-la por uso faria o alvo mudar de lugar entre duas visitas.
 *
 * Quando o obrigatório não cabe nem sozinho, ele sai assim mesmo — a fileira
 * rola, e é melhor rolar até um filtro ligado do que não ter como vê-lo.
 */
export function fittingChips({
  widths,
  gap,
  available,
  required = null,
}: ChipFit): number[] {
  const chosen = new Set<number>()
  let used = 0

  /** O primeiro chip não paga gap; os seguintes, sim. */
  const cost = (index: number) =>
    widths[index] === undefined
      ? Number.POSITIVE_INFINITY
      : (widths[index] as number) + (chosen.size === 0 ? 0 : gap)

  if (required !== null && widths[required] !== undefined) {
    chosen.add(required)
    used = widths[required] as number
  }

  for (let index = 0; index < widths.length; index += 1) {
    if (chosen.has(index)) {
      continue
    }

    const next = cost(index)
    if (used + next > available) {
      /**
       * Para no primeiro que não cabe, em vez de pular pro seguinte que
       * caberia. Preencher o buraco com um chip de depois faria a fileira
       * mudar de composição ao redimensionar de um jeito que ninguém
       * consegue prever — e a ordem do vocabulário é a promessa.
       */
      break
    }

    chosen.add(index)
    used += next
  }

  return [...chosen].sort((a, b) => a - b)
}

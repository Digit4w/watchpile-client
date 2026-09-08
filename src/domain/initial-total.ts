/**
 * O total com que uma obra NASCE, a partir do que o tipo dela sabe.
 *
 * ── Por que isto é uma regra, e não um ternário na folha ────────────────────
 * A folha de criar obra escrevia `asksTotal ? digitado : 1`, e isso passou por
 * três formas em 07/09/2026 antes de fechar. Primeiro `asks_total` respondia
 * duas perguntas ao mesmo tempo; depois `counts_progress` saiu de dentro dele;
 * e por fim `asks_total` foi REMOVIDO, porque a pergunta que sobrou nele já
 * tinha resposta — **o campo de total é opcional**, então deixá-lo em branco
 * produz o mesmo `null` que ele produzia, e o `false` dele só tirava a
 * capacidade de registrar um total que É conhecido.
 *
 * ── São dois casos, e o que os separa é o TIPO ──────────────────────────────
 * | `countsProgress` | Nasce com |
 * | --- | --- |
 * | `false` | `1` — é 1/1, e o status é o progresso |
 * | `true` | o que a pessoa digitou, ou `null` |
 *
 * `null` e não zero: zero é um total que existe e vale zero, e `entries.total`
 * nulo é o que a 3.11 desenha como "não se sabe" — o `12 / ?`. **Quem responde
 * "esta obra tem fim conhecido?" é esta coluna, por OBRA**, e não o tipo: um
 * webnovel terminado tem número de capítulos, e um em publicação não.
 */

/**
 * O total de uma obra cujo tipo não conta nada.
 *
 * Era `MOVIE_TOTAL`, e o nome mentia por ser específico demais: a regra nunca
 * foi sobre filme, e sim sobre **tipo que não conta** — filme era só o único
 * que existia assim, até o jogo acompanhá-lo em 07/09/2026.
 */
export const SINGLE_UNIT_TOTAL = 1

export function initialTotal({
  countsProgress,
  typed,
}: {
  countsProgress: boolean
  /** O que veio do campo. Vazio, lixo ou zero contam como não preenchido. */
  typed: number | null
}): number | null {
  if (!countsProgress) {
    return SINGLE_UNIT_TOTAL
  }

  return typed !== null && Number.isFinite(typed) && typed > 0 ? typed : null
}

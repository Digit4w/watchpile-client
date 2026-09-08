/**
 * Esta obra desenha o contador `+`/`−`, ou o controle de status no lugar dele?
 *
 * ── Duas perguntas, e basta uma dizer que não ───────────────────────────────
 * A primeira é do TIPO (`counts_progress`, 07/09/2026): filme não conta nada,
 * o status é o progresso. A segunda é da OBRA, e chegou depois, olhando a tela:
 * **uma obra com exatamente uma unidade não tem o que contar**, seja ela de que
 * tipo for.
 *
 * O caso que a revelou foi um jogo. O tipo `game` CONTA — uns contam horas,
 * outros capítulos, outros conquistas —, mas aquela obra específica tinha
 * `total = 1` e lia `− 1 / 1 +`: um contador que só pode ir de 0 a 1, que é
 * exatamente a pergunta que o status já responde. **O tipo estava certo e a
 * tela estava errada**, e por isso a regra é da obra e não do tipo: mudar
 * `game` tiraria o contador de quem acompanha um jogo de quarenta horas.
 *
 * ── A escada inteira, pra não confundir os três níveis ──────────────────────
 * | `total` | O que é | O que a tela faz |
 * | --- | --- | --- |
 * | `null` | não se sabe o fim (mangá em publicação) | conta, `12 / ?` |
 * | `1` | uma unidade só | **status**, não há o que contar |
 * | `> 1` | fim conhecido | conta, `12 / 24` |
 *
 * As duas regras compõem sem brigar, e num filme elas concordam: o tipo diz
 * que não conta, e `initialTotal` já o faz nascer com `1`.
 */
export function showsCounter({
  typeCounts,
  total,
}: {
  /** `counts_progress` do tipo desta obra. */
  typeCounts: boolean
  /**
   * O total EFETIVO — o da obra, ou o que o provedor sabe. Na tela de detalhe
   * são coisas diferentes (`entries.total` fica nulo em quase toda obra vinda
   * da busca), e quem decide é o número que a pessoa está vendo.
   */
  total: number | null
}): boolean {
  if (!typeCounts) {
    return false
  }

  return total !== 1
}

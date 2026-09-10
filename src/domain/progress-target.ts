/**
 * O campo pede um ALVO; o que sai daqui é o delta que leva o contador até ele.
 *
 * ── Por que alvo e não valor ────────────────────────────────────────────────
 * Progresso é **contador + log append-only** (brief, 3.11): a escrita é sempre
 * um evento com delta, e corrigir para trás é um delta negativo — não uma
 * reescrita da linha. O campo é a interface humana disso, e a tradução mora
 * aqui em vez de nos dois componentes que a pedem.
 *
 * ── Por que ela virou regra pura — 10/09/2026 ───────────────────────────────
 * Ela estava escrita no popover de atalho da carta desde 28/08, e o campo da
 * tela de detalhe seria a **segunda cópia**. *Duas contas da mesma coisa é como
 * uma fica pra trás* — e aqui o que fica pra trás não é um rótulo, é a regra
 * que decide se uma escrita acontece.
 */
export function progressDelta({
  typed,
  progress,
  total,
}: {
  /** O que está no campo, cru — ele é texto até o último momento. */
  typed: string
  /** O contador de agora. */
  progress: number
  /**
   * O teto EFETIVO — o da obra, ou o que o provedor sabe. Nulo é legítimo e
   * quer dizer "não se sabe o fim" (o `12 / ?` da 3.11), **não** "sem teto por
   * enquanto": num mangá em publicação não há número que esteja alto demais.
   */
  total: number | null
}): number | null {
  const cleaned = typed.trim()
  if (cleaned === '') {
    return null
  }

  const value = Number(cleaned)
  /**
   * Inteiro, não negativo, e dentro do teto quando há teto. `Number('')` é
   * zero e `Number('12abc')` é `NaN` — o `trim` acima cobre o primeiro, e
   * `Number.isInteger` cobre o segundo sem uma segunda checagem.
   */
  if (!Number.isInteger(value) || value < 0) {
    return null
  }
  if (total !== null && value > total) {
    return null
  }

  const delta = value - progress
  /**
   * Zero devolve **nulo e não zero**: não há evento a gravar, e um `0` obrigaria
   * todo chamador a distinguir "não mexeu" de "inválido" com um `=== 0` que um
   * deles esqueceria. Um valor que não produz escrita não é um delta.
   */
  return delta === 0 ? null : delta
}

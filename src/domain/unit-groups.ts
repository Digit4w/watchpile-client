/** Um grupo de unidades, como o servidor o entrega. */
type Group = { number: number }

/**
 * O cabeçalho do conjunto de grupos, ou nulo quando não há conjunto a nomear —
 * 10/09/2026.
 *
 * ── Por que isto é uma função e não dois `&&` na tela ─────────────────────
 * As DUAS telas de detalhe são um molde só, e **elas acabaram de divergir nesta
 * linha exata**: em 09/09 o rótulo de unidades foi corrigido em `/library/:id`
 * e ficou torto em `/search/:provider/:id`, com o mesmo literal escrito nos
 * dois. Corrigir de novo em dois lugares seria repetir o defeito na mesma
 * semana — *duas contas da mesma coisa é como uma fica pra trás*.
 *
 * ── As três respostas ──────────────────────────────────────────────────────
 * | Estado | O que a tela faz |
 * | --- | --- |
 * | sem grupos | nada: nem seção nem linha |
 * | com grupos, sem rótulo | **nada também** |
 * | com grupos e rótulo | seção com o título, linha com a contagem |
 *
 * O segundo caso é o que mais surpreende, e é decisão: **a tela não inventa um
 * coletivo**. Um cabeçalho que o produto escreveu sobre uma lista que o
 * provedor organizou é a mesma mentira que `'Seasons'` num mangá, com outra
 * palavra — e os nomes que o provedor deu já se explicam sozinhos.
 */
export function unitGroupSummary({
  groups,
  label,
}: {
  groups: readonly Group[]
  /** O coletivo declarado no par (`unitGroupLabel`). */
  label: string | null
}): { label: string; count: number } | null {
  if (label === null || groups.length === 0) {
    return null
  }

  /**
   * **O grupo ZERO fica fora da conta.** Numeração começa em 1, e os especiais
   * do TMDB voltam como `season_number: 0` — contá-los diria que Breaking Bad
   * tem seis temporadas. É a mesma exclusão que `unit-offset.ts` faz no
   * contador, pelo mesmo motivo.
   */
  return {
    label,
    count: groups.filter(({ number }) => number >= 1).length,
  }
}

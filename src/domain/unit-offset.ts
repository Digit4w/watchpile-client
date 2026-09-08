/**
 * Onde um grupo começa no contador ABSOLUTO.
 *
 * ── Por que existe ──────────────────────────────────────────────────────────
 * O progresso é um contador só — "22 / 36" atravessa as temporadas (brief,
 * 3.11) —, mas o provedor devolve as unidades numeradas **dentro do grupo**: o
 * episódio 3 da segunda temporada volta como `3`. Traduzir um no outro é somar
 * o que veio antes.
 *
 * **É isso que dispensa uma tabela de episódios.** A lista é apresentação do
 * contador, e marcar uma unidade é mover o contador até ela — nada de novo se
 * guarda.
 *
 * ── O caso que quebra, e o que se faz com ele ───────────────────────────────
 * A soma depende de o provedor dizer quantas unidades cada grupo anterior tem.
 * Quando ele não diz — `count` nulo —, não há como somar, e **inventar seria
 * pior que não traduzir**: marcaria o episódio errado. Nesse caso o offset é
 * nulo e quem chama desliga a marcação, mostrando a lista como leitura.
 */
export function unitOffset(
  groups: { number: number; count: number | null }[],
  group: number,
): number | null {
  /**
   * **Grupo zero fica FORA da sequência principal.**
   *
   * Não é conhecimento do TMDB, é como numeração funciona: a sequência começa
   * em 1, e o 0 é o que se pendura ao lado dela — especiais, extras, um
   * capítulo avulso. O contador da obra conta a sequência (o TMDB diz 62
   * episódios de Breaking Bad, sem os especiais), então somar o grupo 0
   * deslocaria a série inteira e marcaria o episódio errado.
   *
   * E o próprio grupo 0 não tem posição no contador: pedir o offset dele é
   * nulo, e quem chama desliga a marcação. Melhor não marcar que marcar
   * errado.
   */
  if (group <= 0) {
    return null
  }

  const previous = groups.filter((g) => g.number >= 1 && g.number < group)

  if (previous.some((g) => g.count === null)) {
    return null
  }

  return previous.reduce((sum, g) => sum + (g.count ?? 0), 0)
}

/**
 * Qual grupo abrir quando ninguém escolheu.
 *
 * **O primeiro da sequência principal, não o primeiro da lista.** O TMDB
 * devolve os especiais como grupo 0 e eles vêm primeiro, então "o primeiro"
 * abriria a tela nos extras — que ninguém quer ver antes do episódio 1, e que
 * nem tem posição no contador.
 *
 * Sem nenhum grupo positivo, cai no primeiro que houver: é melhor mostrar os
 * especiais que não mostrar nada.
 */
export function defaultGroup(groups: { number: number }[]): number | null {
  const main = groups
    .filter((g) => g.number >= 1)
    .sort((a, b) => a.number - b.number)[0]

  return main?.number ?? groups[0]?.number ?? null
}

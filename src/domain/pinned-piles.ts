import type { Pile } from '@/domain/media'

/**
 * As pilhas fixadas, na ordem em que se lê — 10/09/2026.
 *
 * ── Por que virou regra pura ──────────────────────────────────────────────
 * Ela estava dentro da sidebar, e o menu de conta do celular passou a precisar
 * da mesma resposta (design system, decisão em aberto 10, FECHADA). Duas contas
 * da mesma coisa é como uma fica pra trás — e aqui o que ficaria pra trás é a
 * ORDEM, que é justamente o que não pode dançar entre duas telas.
 *
 * ── A ordem é a de FIXAÇÃO, crescente ─────────────────────────────────────
 * Quem fixou primeiro fica em cima, e a lista **não se reordena quando outra
 * pilha entra** — a régua de 30/08 aplicada a uma lista de navegação. Ordenar
 * por nome pareceria mais previsível e seria pior: renomear uma pilha mudaria
 * de lugar um alvo que a pessoa já sabia onde estava.
 *
 * ── Lista vazia é resposta, e quem chama não desenha cabeçalho ────────────
 * Um "Pinned" sobre o vazio é chrome que não faz nada — o mesmo argumento que
 * tira a fileira de chips de uma tela sem eixo.
 */
export function pinnedPiles(piles: readonly Pile[] | undefined): Pile[] {
  return (piles ?? [])
    .filter(({ pinnedAt }) => pinnedAt !== null)
    .sort((a, b) => (a.pinnedAt ?? '').localeCompare(b.pinnedAt ?? ''))
}

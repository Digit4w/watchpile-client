import type { ViewMode } from './library-view'
import type { Entry } from './media'

/**
 * O vocabulário de `/piles/:id` — a tela de uma pilha.
 *
 * **Os modos são os mesmos quatro de `/library`, e isso não é preguiça**: o
 * inventário é do OBJETO, e o objeto listado aqui é obra, exatamente como lá
 * (design system, seção 5). Por isso este arquivo reexporta `ViewMode` em vez
 * de declarar uma união própria — uma segunda lista com os mesmos quatro
 * valores seria duas coisas pra manter em sincronia sem nada em troca.
 */
export type PileDetailViewMode = ViewMode

/**
 * A ordenação, e a primeira é a única que o servidor não faz.
 *
 * `manual` é a ordem da própria pilha — a que `pile_entries.position` guarda
 * (brief, 3.14) e a que `GET /api/piles/:id/entries` já devolve. As outras três
 * são recorte de leitura, aplicado no cliente sobre a lista que chegou: a pilha
 * não tem paginação e a resposta já veio inteira, então mandar o servidor
 * reordenar seria uma volta de rede pra refazer o que está na memória.
 */
export const PILE_ENTRY_SORTS = ['manual', 'title', 'added', 'rating'] as const

export type PileEntrySort = (typeof PILE_ENTRY_SORTS)[number]

/**
 * `manual` é o padrão porque é o que a pilha É. Abrir numa ordem derivada
 * esconderia o trabalho de quem arrumou a fila.
 */
export const DEFAULT_PILE_ENTRY_SORT: PileEntrySort = 'manual'

/**
 * **Arrastar só existe na ordem manual, e só nos modos de lista** (design
 * system, seção 5, 31/08/2026).
 *
 * A ordenação: numa lista ordenada por título a ordem manual continua
 * existindo, mas não é a que está na tela — arrastar ali seria uma promessa que
 * o servidor não pode cumprir.
 *
 * O modo: na carta os quatro cantos já estão ocupados (nota, tipo, e o degradê
 * de título), e um item arrastável precisa de `touch-none`, que numa tela cheia
 * de cartas engole a rolagem do dedo. A lista tem lugar óbvio pra alça e o
 * gesto é 1-D, que é o que a ordem manual de fato é. Quem quer reordenar troca
 * de modo — "um modo pode trocar ação por densidade" (30/08/2026).
 */
export function canReorder(
  sort: PileEntrySort,
  view: PileDetailViewMode,
): boolean {
  return reorderAffordance(sort, view) === 'handle'
}

/**
 * COMO se reordena aqui — 10/09/2026, e ela reabre a decisão de 31/08.
 *
 * ── O que mudou, e não foi a opinião ──────────────────────────────────────
 * Aquela decisão excluiu os modos de grade por dois argumentos, e **os dois
 * eram sobre uma alça PERMANENTE**: os quatro cantos da carta já estão
 * ocupados, e `touch-none` numa tela cheia de cartas engole a rolagem do dedo.
 *
 * A Home resolveu o mesmo conflito de outro jeito em 10/09: **um MODO**, ligado
 * pelo menu da obra, em que a carta deixa de navegar e vira a alça inteira. Com
 * isso os dois argumentos caem juntos — não há alça a encaixar, porque ela é a
 * carta; e `touch-none` só vale enquanto se reordena, que é quando ninguém está
 * rolando.
 *
 * É *o argumento de uma decisão pode ser sobre COMPETIÇÃO por espaço, e quando
 * a competição acaba a decisão não vale mais* (design system, seção 8,
 * vigésima quinta leva) — aqui a competição acabou porque a peça virou
 * transitória.
 *
 * ── O que NÃO mudou ───────────────────────────────────────────────────────
 * **A ordenação continua mandando.** Numa lista ordenada por título a ordem
 * manual existe, mas não é a que está na tela — arrastar ali seria uma promessa
 * que o servidor não pode cumprir. Esse argumento não era sobre espaço.
 *
 * ── Por que três respostas e não um booleano ──────────────────────────────
 * Porque quem chama precisa saber **qual peça desenhar**, e as duas são
 * diferentes: a linha tem lugar óbvio pra alça e a mostra sempre; a carta não
 * tem, e depende do modo. Um booleano obrigaria cada chamador a reabrir a
 * pergunta do modo — que é como duas telas com a mesma regra divergem.
 */
export function reorderAffordance(
  sort: PileEntrySort,
  view: PileDetailViewMode,
): 'none' | 'handle' | 'mode' {
  if (sort !== 'manual') {
    return 'none'
  }
  return view === 'list' || view === 'compact-list' ? 'handle' : 'mode'
}

/**
 * A ordem de leitura da pilha, como uma lista de **ids**.
 *
 * Devolver ids e não obras é o que faz a régua de 30/08/2026 funcionar aqui
 * (design system, seção 8): escrita que muda o **conteúdo** de um item troca o
 * item no lugar, escrita que muda a **composição** refaz a lista. Quem chama
 * memoiza esta função pela composição — o conjunto de ids — e depois mapeia os
 * ids de volta para as obras atuais. O efeito é que dar nota a uma obra numa
 * lista ordenada por nota **não** a arranca de baixo do cursor; a ordem só se
 * refaz quando o leitor pede outra, ou quando alguém entra ou sai da pilha.
 *
 * Ordenar aqui e não no servidor: a pilha não pagina e a resposta já veio
 * inteira, então uma volta de rede refaria o que está na memória.
 */
export function orderedIds(entries: Entry[], sort: PileEntrySort): number[] {
  if (sort === 'manual') {
    // A ordem manual JÁ é a que chegou — `GET /:id/entries` devolve por
    // `position` (brief, 3.14). Reordenar aqui seria refazer, com menos
    // informação, o que o servidor decidiu.
    return entries.map(({ id }) => id)
  }

  // Cópia: `sort` muta no lugar, e o array vem do cache do TanStack Query.
  const copy = [...entries]

  copy.sort((a, b) => {
    if (sort === 'title') {
      // `localeCompare` e não `<`: sem ele "Álbum" cai depois de "Zulu", e o
      // catálogo pt-BR (brief, 3.8) enche a biblioteca de acento.
      return a.title.localeCompare(b.title)
    }
    if (sort === 'added') {
      return b.createdAt.localeCompare(a.createdAt)
    }
    /**
     * Obra sem nota vai para o FIM, nunca para o topo com valor zero. Sem nota
     * e nota zero são coisas diferentes, e um `?? 0` as confundiria — a lista
     * abriria com tudo que ninguém avaliou.
     */
    if (a.rating === null) {
      return b.rating === null ? 0 : 1
    }
    if (b.rating === null) {
      return -1
    }
    return b.rating - a.rating
  })

  return copy.map(({ id }) => id)
}

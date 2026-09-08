import type { ViewMode } from './library-view'
import type { Pile, PilePreview } from './media'

/**
 * As quatro ordens de `/piles`, na ordem em que o menu as lista
 * (`design/mockups/piles.html`). As chaves são as que o servidor aceita em
 * `?sort=`; o rótulo traduzível fica no catálogo de copy, nunca na URL.
 *
 * `size` é a única que `/library` não tem, e `rating` não existe aqui: pilha é
 * recipiente e não tem nota. **O inventário é do objeto, não da tela** — a
 * mesma régua que dá três modos de exibição a esta tela e quatro à outra
 * (design system, seção 5).
 */
export const PILE_SORTS = ['updated', 'added', 'name', 'size'] as const

export type PileSort = (typeof PILE_SORTS)[number]

export const DEFAULT_PILE_SORT: PileSort = 'updated'

/**
 * Três modos, e a ausência é a decisão: **não há grade compacta**.
 *
 * Ela mostra arte e esconde o nome, e numa pilha isso produz um quadrado
 * anônimo — quem identifica uma pilha é o nome, não a capa
 * (`design/mockups/piles.html`). Um modo só entra se mostrar o que identifica
 * o objeto.
 */
export const PILE_VIEW_MODES = [
  'compact-list',
  'list',
  'grid',
] as const satisfies readonly ViewMode[]

export type PileViewMode = (typeof PILE_VIEW_MODES)[number]

export const DEFAULT_PILE_VIEW: PileViewMode = 'grid'

/**
 * Como o ladrilho da pilha se identifica, em quatro níveis
 * (`design/mockups/piles.html`).
 *
 * A ordem é de precedência, não de preferência estética: capa subida sempre
 * vence, e o mosaico só acontece **cheio** — 2×2 com buraco fica pior que uma
 * peça só, então três obras caem no mesmo desenho que uma.
 *
 * O primeiro nível — a capa que o usuário subiu — **entrou em 31/08/2026**,
 * exatamente como esta nota previa: um `if` a mais no topo, e nada mais mudou.
 * Ela vence tudo porque escolha explícita vence derivação; o mosaico é o que a
 * pilha É, a capa é o que alguém decidiu que ela é.
 */
/**
 * As quatro peças do mosaico, com o `id` da obra junto. É ele que vira a chave
 * de lista do React: duas obras de mesmo título na mesma pilha são possíveis, e
 * o índice do array não é chave — é posição.
 */
type MosaicPieces = [PilePreview, PilePreview, PilePreview, PilePreview]

export type PileIdentity =
  | { kind: 'cover' }
  | { kind: 'mosaic'; pieces: MosaicPieces }
  | { kind: 'single'; title: string }
  | { kind: 'empty' }

export function identityOf(pile: Pile): PileIdentity {
  const { preview } = pile

  // A variante não carrega a URL: quem a monta é `pileCoverUrl`, que precisa
  // do `updatedAt` da pilha pra invalidar o cache do navegador. Passar a URL
  // por aqui faria uma regra pura depender de como o transporte endereça
  // imagem.
  if (pile.hasCover) {
    return { kind: 'cover' }
  }

  if (preview.length >= 4) {
    return {
      kind: 'mosaic',
      // `slice` devolve `PilePreview[]`, e o TypeScript não deriva a tupla de
      // quatro a partir do `length >= 4` acima — a asserção é o que fecha essa
      // lacuna, e o teste é quem a mantém honesta.
      pieces: preview.slice(0, 4) as MosaicPieces,
    }
  }

  const first = preview[0]
  return first === undefined
    ? { kind: 'empty' }
    : { kind: 'single', title: first.title }
}

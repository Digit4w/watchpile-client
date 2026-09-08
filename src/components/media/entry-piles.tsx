import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { Entry, Pile } from '@/domain/media'
import { useSetEntryPile } from '@/hooks/mutations/entries/use-set-entry-pile'
import { useCreatePile } from '@/hooks/mutations/piles/use-create-pile'
import { useEntryPiles } from '@/hooks/queries/entries/use-entry-piles'
import { usePiles } from '@/hooks/queries/piles/use-piles'
import { appCopy } from '@/lib/copy'

/**
 * Quando a busca aparece.
 *
 * O número não é chutado: a linha de pilha tem 48px (ladrilho de 32 + `py-2`) e
 * o grupo de baixo tem teto de 192px, então cabem exatamente 4. A partir da 5ª
 * a lista rola — e é aí que procurar pelo nome passa a ser mais rápido que
 * arrastar a barra. Abaixo disso a busca seria ruído: a lista inteira já está à
 * vista.
 *
 * Se o teto do grupo mudar, este número muda junto.
 */
const SEARCH_FROM = 5

function Check() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  )
}

function Plus() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

/**
 * Uma linha de pilha, com o estado à direita.
 *
 * O alvo de clique é a linha inteira, não só o botão — o disco de 20px da
 * direita é indicador, e obrigar a mira nele seria hostil. Por isso a linha é
 * um `<button>` e o disco é um `<span>`: dois botões aninhados não são HTML
 * válido, e o leitor de tela anunciaria dois alvos para uma ação.
 */
function PileRow({
  pile,
  inside,
  busy,
  onToggle,
}: {
  pile: Pile
  inside: boolean
  busy: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={inside}
      className="flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised disabled:opacity-[var(--opacity-disabled)]"
    >
      {/* Sem arte de pile ainda: o glifo da nav no lugar do mosaico de capas
       * que o Spotify mostra. Inventar uma capa a partir das obras seria
       * decisão de design que não foi tomada. */}
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-raised text-faint"
        aria-hidden="true"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="11" y="3" width="6" height="6" rx="1.5" />
          <rect x="3" y="11" width="6" height="6" rx="1.5" />
          <rect x="11" y="11" width="6" height="6" rx="1.5" />
        </svg>
      </span>

      <span className="min-w-0 flex-1 truncate text-ink text-sm">
        {pile.name}
      </span>

      {/* O estado, e o que o clique vai fazer, no mesmo lugar. Preenchido em
       * `ink` quando dentro — o mesmo tratamento de "ligado" dos chips, porque
       * o chrome é neutro (design system, seção 2); o verde do Spotify é a cor
       * de marca dele. */}
      <span
        title={inside ? appCopy.entry.inPile : appCopy.entry.notInPile}
        className={
          inside
            ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-surface'
            : 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-faint'
        }
      >
        {inside ? <Check /> : <Plus />}
      </span>
    </button>
  )
}

/**
 * "Adicionar à pilha", com a estrutura do Spotify **mobile** e não a do
 * desktop — pedido explícito, e a razão é boa: o menu do desktop só oferece o
 * destino, sem dizer onde a faixa já está. Quem quer conferir precisa abrir
 * pilha por pilha.
 *
 * Aqui cada linha mostra os dois de uma vez: o estado atual (disco cheio ou
 * vazado) e o que o clique faz. Isso transforma a tela de "adicionar" em
 * "gerenciar" sem custo nenhum de interface, e é por isso que a mutação é
 * `useSetEntryPile`, que liga E desliga.
 *
 * ── Os dois grupos ──────────────────────────────────────────────────────────
 * "Saved in" é um cabeçalho com objeto: as pilhas onde a obra JÁ está vêm logo
 * abaixo dele, e só depois vêm as outras. Uma lista chapada com o mesmo título
 * em cima é o que estava errado na primeira versão — o rótulo prometia "onde
 * está salvo" e entregava "todas as pilhas".
 *
 * **O agrupamento é tirado uma vez, quando o painel abre, e não se refaz a cada
 * clique.** Se refizesse, marcar uma pilha faria a linha saltar do grupo de
 * baixo pro de cima debaixo do dedo, e a próxima que se quer marcar já estaria
 * em outro lugar. O visto muda na hora; a posição, não.
 *
 * O que a versão em popover corta do mobile: o rodapé "Pronto" — cada clique já
 * grava, então um botão de salvar mentiria dizendo que ainda não gravou — e a
 * contagem de itens embaixo do nome, porque `GET /api/piles` não devolve isso
 * hoje. O mosaico de capas vira glifo neutro, já que pilha ainda não tem arte.
 */
export function EntryPiles({ entry }: { entry: Entry }) {
  const all = usePiles()
  const inside = useEntryPiles(entry.id)
  const set = useSetEntryPile(entry.id)
  const create = useCreatePile()

  const [searchQuery, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setNome] = useState('')

  // Foco por ref, não `autoFocus`: o campo nasce de um clique deliberado em
  // "New pile" e é a única coisa a fazer depois dele, então mover o cursor é o
  // certo — mas só quando o formulário abre, e não a cada render.
  const nameField = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (creating) {
      nameField.current?.focus()
    }
  }, [creating])

  /** Estado ao vivo: é ele que decide o visto de cada linha. */
  const members = useMemo(
    () => new Set((inside.data ?? []).map(({ id }) => id)),
    [inside.data],
  )

  /**
   * Retrato de quando o painel abriu: é ele que decide em qual GRUPO a linha
   * cai. Congelar é o ponto — sem isso a linha pula de grupo no clique.
   */
  const [initialGroup, setInitialGroup] = useState<Set<number> | null>(null)
  useEffect(() => {
    if (initialGroup === null && inside.data !== undefined) {
      setInitialGroup(new Set(inside.data.map(({ id }) => id)))
    }
  }, [inside.data, initialGroup])

  const piles = all.data ?? []
  const filtered = useMemo(() => {
    const term = searchQuery.trim().toLocaleLowerCase()
    return term === ''
      ? piles
      : piles.filter((pile) => pile.name.toLocaleLowerCase().includes(term))
  }, [piles, searchQuery])

  const saved = filtered.filter((pile) => initialGroup?.has(pile.id))
  const rest = filtered.filter((pile) => !initialGroup?.has(pile.id))

  // Enquanto o pertencimento não chegou, nenhuma linha sabe o próprio estado —
  // e uma linha que mostra "fora" e vira "dentro" no tick seguinte convida ao
  // clique errado.
  const busy = set.isPending || inside.isPending

  async function createAndAdd() {
    const cleared = name.trim()
    if (cleared === '' || create.isPending) {
      return
    }
    const pile = await create.mutateAsync({ name: cleared })
    set.mutate({ pileId: pile.id, member: true })
    // Entra no grupo de cima na hora: foi o usuário que acabou de mandar a obra
    // pra lá, então ver a pilha nova no meio das "não salvas" seria mentira.
    setInitialGroup((current) => new Set(current ?? []).add(pile.id))
    setNome('')
    setCreating(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* "New pile" mora no cabeçalho, ao lado de "SAVED IN", e isso é
       * deliberado: ele cria a pilha E já adiciona a obra, então ele age sobre
       * "onde isto está salvo" — é uma ação daquele grupo mesmo.
       *
       * Chegou a virar linha da lista, abaixo da busca, como no menu do
       * Spotify desktop. Descartado: lá "Nova playlist" é uma opção entre
       * outras porque o menu é sobre a faixa em geral; aqui o painel inteiro
       * já é sobre onde a obra vai, e ninguém cria pilha deste ponto senão
       * pra adicionar direto. */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-faint text-xs uppercase tracking-wide">
          {appCopy.entry.savedIn}
        </p>
        <button
          type="button"
          onClick={() => setCreating((open) => !open)}
          aria-expanded={creating}
          className="rounded-sm px-1.5 py-0.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
        >
          {appCopy.entry.newPile}
        </button>
      </div>

      {creating && (
        <form
          className="flex gap-1"
          onSubmit={(event) => {
            event.preventDefault()
            void createAndAdd()
          }}
        >
          <Input
            compact
            ref={nameField}
            value={name}
            onChange={(event) => setNome(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setCreating(false)
                setNome('')
              }
            }}
            placeholder={appCopy.entry.newPileName}
            aria-label={appCopy.entry.newPileName}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={name.trim() === '' || create.isPending}
            className="rounded-sm bg-ink px-2 py-1 font-medium text-surface text-xs disabled:opacity-[var(--opacity-disabled)]"
          >
            {appCopy.entry.createAndAdd}
          </button>
        </form>
      )}

      {piles.length === 0 && (
        <p className="px-2 py-3 text-faint text-xs">{appCopy.entry.noPiles}</p>
      )}

      {/* Group de cima: onde a entry JÁ está. É o que dá objeto ao "Saved in", e
       * é o que o usuário precisa alcançar pra desmarcar — o caso que a lista
       * chapada escondia no meio das outras. */}
      {saved.length > 0 && (
        <div className="-mx-1 px-1">
          {saved.map((pile) => (
            <PileRow
              key={pile.id}
              pile={pile}
              inside={members.has(pile.id)}
              busy={busy}
              onToggle={() =>
                set.mutate({ pileId: pile.id, member: !members.has(pile.id) })
              }
            />
          ))}
        </div>
      )}
      {initialGroup !== null &&
        saved.length === 0 &&
        searchQuery.trim() === '' && (
          <p className="px-2 pb-1 text-faint text-xs">
            {appCopy.entry.savedNowhere}
          </p>
        )}

      {/* A divisória é o que dá contorno ao group de cima.
       *
       * No mobile do Spotify quem separa os dois é a faixa de busca — mas ela
       * aqui só aparece com muitas pilhas, e sem nada no meio os dois grupos
       * voltavam a ler como uma lista só, desfazendo o agrupamento. A linha
       * resolve isso em qualquer quantidade.
       *
       * Some quando não há nada embaixo: divisória com um lado vazio é ruído,
       * e é o caso de quem já pôs a obra em todas as pilhas. */}
      {rest.length > 0 && (
        <span className="my-1 h-px shrink-0 bg-line/60" aria-hidden="true" />
      )}

      {piles.length >= SEARCH_FROM && (
        <Input
          compact
          type="search"
          value={searchQuery}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={appCopy.entry.findPile}
          aria-label={appCopy.entry.findPile}
        />
      )}

      {piles.length > 0 && filtered.length === 0 && (
        <p className="px-2 py-3 text-faint text-xs">
          {appCopy.entry.noPileMatch}
        </p>
      )}

      {/* Group de bottom: o resto. Teto de height só aqui — o de cima é curto
       * por natureza e não pode ficar atrás de rolagem. */}
      <div className="scrollbar-styled -mx-1 max-h-48 overflow-y-auto px-1">
        {rest.map((pile) => (
          <PileRow
            key={pile.id}
            pile={pile}
            inside={members.has(pile.id)}
            busy={busy}
            onToggle={() =>
              set.mutate({ pileId: pile.id, member: !members.has(pile.id) })
            }
          />
        ))}
      </div>
    </div>
  )
}

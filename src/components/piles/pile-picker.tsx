import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCreatePile } from '@/hooks/mutations/piles/use-create-pile'
import { usePiles } from '@/hooks/queries/piles/use-piles'
import { useDebounced } from '@/hooks/use-debounced'
import { libraryCopy } from '@/routes/-library.copy'

/** O que o seletor devolve: o bastante pra desenhar o chip e pra enviar. */
export type PickedPile = { id: number; name: string }

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
      <line
        x1="12.4"
        y1="12.4"
        x2="16.5"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M4.5 10.5 8 14 15.5 6" />
    </svg>
  )
}

function Plus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  )
}

function Close() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
    </svg>
  )
}

const ROW =
  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised'

/**
 * Em quais pilhas a obra entra ao nascer (brief, 3.17).
 *
 * ── Por que BOTÃO + POPOVER, e nunca uma fileira de chips ───────────────────
 * A fileira de tipos de `/search` foi construída, medida e derrubada no mesmo
 * dia (design system, seção 5, 01/09/2026): **sem teto, o controle é menu,
 * nunca fileira**. Pilha não tem teto nenhum — quem usa cria quantas quiser —,
 * então oferecer todas de uma vez estoura em rolagem horizontal silenciosa
 * exatamente para quem mais usa o produto.
 *
 * ── Por que o ESCOLHIDO volta como chip ─────────────────────────────────────
 * "Filtro que não cabe na fileira se define no menu, mas volta a ela como chip
 * removível" (design system, seção 5, 29/08/2026), porque escolha invisível é
 * escolha esquecida. O que cresce sem teto é o INVENTÁRIO, não a escolha: quem
 * guarda uma obra em oito pilhas de uma vez não existe.
 *
 * ── Criar aqui é o gesto que a decisão de 29/08 previu ──────────────────────
 * *"Criar pilha é gesto de meio de tarefa: você está guardando uma obra e
 * precisa de um lugar"* — e esse meio de tarefa nunca tinha existido numa
 * tela, porque `/piles` cria do começo. **O que se digitou na busca é o nome**,
 * então continua sendo um campo só, como o popover de `/piles`; reusar aquele
 * componente aqui pediria um popover dentro do outro, com foco preso em dois
 * níveis, e faria digitar o mesmo nome duas vezes.
 */
export function PilePicker({
  selected,
  onChange,
  hideLabel = false,
}: {
  selected: PickedPile[]
  onChange: (piles: PickedPile[]) => void
  /**
   * Quem já tem rótulo em volta pede pra este calar.
   *
   * Na folha ele é peça solta e se rotula; na coluna da tela de detalhe a
   * caixa já diz "Piles", e os dois juntos escreviam a palavra duas vezes,
   * uma embaixo da outra — visto na tela rodando.
   */
  hideLabel?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debounced = useDebounced(term)
  const create = useCreatePile()

  /**
   * A busca é do SERVIDOR, como em `/piles`: filtrar no cliente exigiria ter
   * todas as pilhas na mão, que é a suposição que este componente existe pra
   * não fazer.
   */
  const piles = usePiles(debounced.trim() ? { q: debounced.trim() } : undefined)

  const chosen = new Set(selected.map(({ id }) => id))
  const typed = term.trim()
  const list = piles.data ?? []

  /**
   * Oferecer criar só quando o nome ainda não existe — e a comparação é contra
   * o que ESTÁ NA TELA, não contra a lista inteira: a busca já é substring, e
   * o que ela devolveu é o que responde "já tenho uma assim?".
   *
   * Sem acento e sem `toLocaleLowerCase` porque a ordenação do servidor é
   * `COLLATE NOCASE`, que também é só ASCII (`piles.query.ts`) — os dois lados
   * erram junto, e desempatar aqui sozinho daria "não existe" pra uma pilha
   * que a lista mostra logo acima.
   */
  const alreadyExists = list.some(
    ({ name }) => name.toLowerCase() === typed.toLowerCase(),
  )
  const canCreate = typed !== '' && !alreadyExists && !create.isPending

  function toggle(pile: PickedPile) {
    onChange(
      chosen.has(pile.id)
        ? selected.filter(({ id }) => id !== pile.id)
        : [...selected, pile],
    )
  }

  function createAndPick() {
    if (!canCreate) {
      return
    }

    create.mutate(
      { name: typed },
      {
        onSuccess: (pile) => {
          onChange([...selected, { id: pile.id, name: pile.name }])
          setTerm('')
          /**
           * Criar FECHA o painel, e isso foi visto na tela rodando: limpar o
           * filtro traz a lista inteira de volta, e como o painel é ancorado
           * pela base ela cresce **pra cima, sob o cursor que acabou de
           * clicar** — um segundo clique rápido marcaria a pilha errada, sem
           * ruído nenhum ("a lista não se reordena sob a mão", design system,
           * seção 8).
           *
           * Fechar também é o fim honesto do gesto: *"você está guardando uma
           * obra e precisa de um lugar"* (decisão de 29/08) — o lugar existe e
           * já está escolhido. Quem quiser uma segunda pilha reabre, que é um
           * clique, e é o caso raro.
           */
          setOpen(false)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {!hideLabel && (
        <span className="text-muted text-xs" id="pile-picker-label">
          {libraryCopy.add.piles.label}
        </span>
      )}

      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setTerm('')
            create.reset()
          }
          setOpen(next)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-fit gap-1.5 text-xs"
            aria-describedby="pile-picker-label"
          >
            <Plus />
            {libraryCopy.add.piles.open}
          </Button>
        </PopoverTrigger>

        {/* `align="start"`: o gatilho é um botão estreito à esquerda de uma
         * folha, e alinhar pelo fim jogaria o painel pra fora dela.
         *
         * `side="top"` é ESCOLHA, não gosto. Este campo é o último da folha,
         * então quase nunca há espaço embaixo e o painel abre pra cima de
         * qualquer forma — mas a altura dele depende de quantas pilhas a busca
         * devolveu, e ao encolher ele passava a caber embaixo e **teleportava
         * pro outro lado do gatilho no meio da digitação**. Fixando o lado, o
         * que encolhe move a borda de cima e o painel fica ancorado onde
         * estava. A colisão continua ligada: se de fato não couber acima, o
         * Radix vira, e aí virar é a resposta certa. */}
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-72 p-2"
        >
          <div className="relative">
            <SearchIcon />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={libraryCopy.add.piles.search}
              aria-label={libraryCopy.add.piles.search}
              className="h-9 pl-8 text-sm"
              autoFocus
              onKeyDown={(event) => {
                // Enter cria: num painel cujo único campo é a busca, ela é
                // também o campo de nome, e Enter é o gesto principal — o
                // mesmo que o popover de `/piles` já faz.
                if (event.key === 'Enter' && canCreate) {
                  event.preventDefault()
                  createAndPick()
                }
              }}
            />
          </div>

          <ul className="scrollbar-styled mt-2 flex max-h-56 flex-col overflow-y-auto">
            {list.map((pile) => {
              const inside = chosen.has(pile.id)
              return (
                <li key={pile.id}>
                  <button
                    type="button"
                    onClick={() => toggle({ id: pile.id, name: pile.name })}
                    aria-pressed={inside}
                    className={`${ROW} ${inside ? 'text-ink' : 'text-muted'}`}
                  >
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      {inside && <Check />}
                    </span>
                    <span className="truncate">{pile.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {canCreate && (
            <>
              {list.length > 0 && <div className="my-1 h-px bg-line" />}
              <button
                type="button"
                onClick={createAndPick}
                className={`${ROW} text-ink`}
              >
                <Plus />
                <span className="truncate">
                  {libraryCopy.add.piles.create(typed)}
                </span>
              </button>
            </>
          )}

          {/* Nada casou e não há o que create: o campo está vazio e a count é
           * zero. Dizer isso é melhor que um painel de dois pixels de altura. */}
          {list.length === 0 && !canCreate && !piles.isPending && (
            <p className="px-2 py-3 text-center text-faint text-xs">
              {typed
                ? libraryCopy.add.piles.creating
                : libraryCopy.add.piles.none}
            </p>
          )}

          {create.isError && (
            <p className="px-2 pt-2 text-danger text-xs">
              {libraryCopy.add.piles.failed}
            </p>
          )}
        </PopoverContent>
      </Popover>

      {/* Os chips ficam SOB o gatilho, e isso não é estética.
       *
       * Descoberto na tela rodando: com eles acima, escolher a primeira pilha
       * empurrava o botão 40px pra baixo — e o painel, que é ancorado nele,
       * andava junto **no instante do clique**. Quem escolhia um item e mirava
       * o seguinte acertava outro. É "a lista não se reordena sob a mão de
       * quem a toca" (design system, seção 8, 30/08/2026) numa forma nova: o
       * painel não se reordenou, mas se MOVEU, e o efeito para quem aponta é o
       * mesmo.
       *
       * A régua que sai daí: **peça que ancora um painel flutuante não pode
       * ter conteúdo elástico acima dela**. Embaixo, o chip cresce pro lado
       * que não move a âncora. */}
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((pile) => (
            /**
             * `max-w-full` e `min-w-0` nas TRÊS camadas, e isso é o que faz o
             * chip caber onde quer que ele esteja.
             *
             * O `max-w-40` do rótulo é um teto de LEITURA — nome longo não
             * come uma fileira inteira na folha, que é larga. Ele não é o teto
             * do chip: item de flex nasce com `min-width: auto`, então sem os
             * dois abaixo o `li` se recusa a encolher e o chip transborda a
             * coluna de 200px da tela de detalhe (visto rodando).
             *
             * A régua: **peça com largura máxima própria precisa poder
             * encolher abaixo dela**, senão o número vira largura mínima em
             * todo container mais estreito que ele.
             */
            <li key={pile.id} className="min-w-0 max-w-full">
              <button
                type="button"
                onClick={() => toggle(pile)}
                className="flex h-8 max-w-full items-center gap-1.5 rounded-sm border border-ink bg-ink px-2.5 text-surface text-xs transition-opacity duration-[var(--motion-micro)] ease-chrome hover:opacity-80"
              >
                <span className="min-w-0 max-w-40 truncate">{pile.name}</span>
                {/* `shrink-0`: o alvo de tirar da pile não pode encolher
                 * antes do texto — é ele que a pessoa está mirando. */}
                <span className="shrink-0">
                  <Close />
                </span>
                <span className="sr-only">
                  {libraryCopy.add.piles.remove(pile.name)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

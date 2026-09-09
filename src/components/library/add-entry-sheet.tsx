import { type FormEvent, useState } from 'react'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { RemoteArt } from '@/components/media/remote-art'
import { type PickedPile, PilePicker } from '@/components/piles/pile-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { initialTotal } from '@/domain/initial-total'
import { STATUS_ORDER } from '@/domain/library-view'
import type { Entry, EntryStatus, MediaType } from '@/domain/media'
import { useCreateEntry } from '@/hooks/mutations/entries/use-create-entry'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { appCopy } from '@/lib/copy'
import { libraryCopy } from '@/routes/-library.copy'

const PICKED =
  'flex h-9 items-center gap-1.5 rounded-sm border border-ink bg-ink px-2.5 text-surface text-xs'
const AVAILABLE =
  'flex h-9 items-center gap-1.5 rounded-sm border border-line px-2.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'

const FIELD = 'h-9 rounded-md text-sm'

/**
 * Um resultado de busca escolhido, preenchendo a folha (brief, 3.10).
 *
 * **O template PREENCHE o formulário; ele nunca cria direto** — a mesma regra
 * que `Add type` fixou com os templates embarcados (design system, seção 5).
 * Criar num clique tiraria a chance de conferir que é esta obra mesmo, e a
 * sinopse é o que responde isso.
 *
 * O que vem daqui se divide por PROCEDÊNCIA:
 *
 * - o que definiu a BUSCA (o tipo) não se edita: é de onde o resultado veio
 * - o que é atributo da OBRA (o título) se edita — "Clube da Luta" é escolha
 *   legítima de quem vai ler a própria biblioteca
 * - o que a obra não guarda (ano, sinopse, arte) aparece como CONTEXTO e não
 *   como campo: `entries` não tem coluna pra nenhum dos três
 *
 * **E o TOTAL entrou em 09/09/2026, do lado dos que se editam.** O servidor já
 * o mapeava em `field_map` pros sete provedores e já o entregava no detalhe —
 * quem o descartava era este tipo, que não tinha o campo. O efeito era que toda
 * obra vinda da busca nascia com `total` nulo, e o `12 / ?` da 3.11, que é o
 * estado desenhado pra *não se sabe*, virava o estado de quase tudo — inclusive
 * de obra terminada cujo total o provedor tinha acabado de dizer na tela ao
 * lado. Ele é **editável**, como o título: a fonte propõe, a pessoa manda.
 */
export type EntryPick = {
  /**
   * A identidade desta abertura. **Dada por quem abre, nunca deduzida do
   * conteúdo** (design system, seção 8, quinta leva): dois resultados
   * diferentes podem ter o mesmo título, e "mudou de alvo?" não se responde
   * olhando o alvo.
   */
  key: string
  mediaType: string
  title: string
  year: number | null
  synopsis: string | null
  /**
   * Quantas unidades o provedor declara, ou nulo — que aqui é *em publicação*,
   * não *zero*: o servidor já converte o zero do MyAnimeList em nulo, porque
   * lá ele quer dizer que a obra não terminou.
   */
  total: number | null
  /** A URL já montada pelo servidor, ou nulo. Emprestada, como na grade. */
  art: string | null
  providerName: string
  source: { provider: string; externalId: string }
}

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    // `fieldset`/`legend` e não `div`/`span`: são seis botões que respondem a
    // UMA pergunta, e sem o agrupamento o leitor de tela anuncia "Anime" sem
    // dizer anime do quê.
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-muted text-xs">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  )
}

/**
 * A folha de adicionar obra — a ação primária de `/library`
 * (`design/mockups/library.html`).
 *
 * **Folha e não popover**, e a régua é o peso do objeto (design system, seção
 * 5): obra tem quatro campos e ganha folha; pilha tem um e ganha popover. Criar
 * pilha é gesto de meio de tarefa e não pode custar um formulário; cadastrar
 * obra é a tarefa.
 *
 * **Ela serve os dois caminhos**: `/search` a abre preenchida com um resultado
 * do provedor (`pick`), e `/library` a abre em branco pra quem digita à mão.
 * O formulário nasceu inteiro justamente pra isso — quando o TMDB chegou, ele
 * virou o caminho de escape em vez de precisar ser reescrito.
 *
 * `modal` explícito: o `Sheet` do projeto é não-modal por padrão, porque a
 * folha de widget existe pra se arrastar de dentro dela pra fora. Um formulário
 * quer o contrário — foco preso, `Esc` fecha, clique fora fecha.
 */
export function AddEntrySheet({
  open,
  onOpenChange,
  onCreated,
  pick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Chamado com a obra recém-criada, para quem precisa continuar com ELA.
   *
   * Existe por causa de um caminho só: na tela de detalhe do provedor você está
   * olhando UMA obra, e o que vem depois de adicionar é acompanhá-la — o que só
   * a tela de dentro sabe fazer. Quem abre esta folha de `/library` não passa
   * nada aqui, porque ali o gesto é "acrescentar ao acervo" e não "começar a
   * acompanhar esta".
   */
  onCreated?: (entry: Entry) => void
  /** Ausente é o caminho manual: formulário em branco, como sempre foi. */
  pick?: EntryPick
}) {
  const create = useCreateEntry()
  /**
   * O estado nasce do `pick`, e **quem o refaz numa abertura nova é a `key`**
   * de quem renderiza esta folha — não um efeito aqui dentro.
   *
   * A regra é a mesma (design system, seção 8, quinta leva): identidade de
   * formulário é dada por quem abre, nunca deduzida do conteúdo. O que muda é
   * a forma — remontar pela `key` é o idioma do React pra "isto agora é outro
   * formulário", e um efeito reagindo à chave faria o mesmo com um render a
   * mais e uma lista de dependências que mente sobre o que ele lê.
   */
  /**
   * **`null` é "ainda não escolhi", e o padrão sai do VOCABULÁRIO** — era
   * `'anime'` cravado, o que já supunha que a instalação tem aquele tipo (o
   * wizard permite apagá-lo, brief 3.9) e passou a supor também que o leitor o
   * mantém visível. Padrão de formulário se deriva do que a tela oferece.
   */
  const [mediaType, setMediaType] = useState<MediaType | null>(
    pick?.mediaType ?? null,
  )
  const [title, setTitle] = useState(pick?.title ?? '')
  const [status, setStatus] = useState<EntryStatus>('watching')
  /**
   * **Nasce com o que o provedor disse** (09/09/2026), e vazio quando ele não
   * disse. O que a pessoa apagar continua virando nulo em `initialTotal`, que
   * é o comportamento certo pra obra em publicação.
   */
  const [total, setTotal] = useState(
    pick?.total != null ? String(pick.total) : '',
  )
  /**
   * As pilhas escolhidas nascem vazias mesmo vindo da busca: um resultado do
   * TMDB não sabe nada sobre as pilhas de quem procurou.
   */
  const [piles, setPiles] = useState<PickedPile[]>([])

  /**
   * O tipo escolhido entra na oferta mesmo escondido: ele pode ter vindo de um
   * resultado de busca (`pick`), e um formulário que apagasse a escolha de quem
   * chegou por ali estaria trocando a obra sem dizer.
   */
  const offered = useOfferedMediaTypes(mediaType)
  const chosen = mediaType ?? offered[0]?.slug ?? null
  const chosenType = offered.find((info) => info.slug === chosen)
  /**
   * Quem responde "este tipo tem o que contar?" é o DADO, não mais um
   * `type !== 'movie'` escrito aqui (brief, 3.12). Enquanto o vocabulário não
   * chegou, assume que conta: mostrar um campo a mais e escondê-lo depois é
   * melhor que esconder um campo que a pessoa precisava preencher.
   *
   * **Uma pergunta só, desde que `asks_total` saiu** (07/09/2026): o campo de
   * total aparece sempre que houver o que contar, e é OPCIONAL — em branco é
   * "não se sabe o fim", que é o `12 / ?`. Um segundo campo dizendo se este
   * formulário pergunta só tirava a chance de registrar um fim que se sabe.
   */
  const countsProgress = chosenType?.countsProgress ?? true
  const trimmedTitle = title.trim()
  // O servidor exige título com pelo menos um caractere; barrar aqui é o que
  // evita um 400 previsível numa tela onde a pessoa vê o campo vazio.
  // Sem tipo não há o que criar — e sem vocabulário não há tipo. Barrar aqui é
  // a mesma régua do título vazio: 400 previsível não vira erro de tela.
  const canSubmit = trimmedTitle !== '' && chosen !== null && !create.isPending

  function clear() {
    setMediaType(pick?.mediaType ?? null)
    setTitle(pick?.title ?? '')
    setStatus('watching')
    setTotal(pick?.total != null ? String(pick.total) : '')
    setPiles([])
    create.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    const typed = Number.parseInt(total, 10)

    if (chosen === null) {
      return
    }

    create.mutate(
      {
        mediaType: chosen,
        title: trimmedTitle,
        status,
        /**
         * A procedência viaja junto: `entries` e `external_ids` nascem na
         * mesma transação (brief, 3.10). Sem ela a obra viria do provedor e
         * não saberia mais de onde veio.
         */
        source: pick?.source,
        /**
         * Escolher a pilha é o MESMO gesto de adicionar a obra: o servidor
         * escreve `entries`, `external_ids` e `pile_entries` numa transação só
         * (brief, 3.17). Vazio vira ausente porque obra fora de pilha é o caso
         * normal do modelo, não um pedido de lista vazia.
         */
        pileIds: piles.length > 0 ? piles.map(({ id }) => id) : undefined,
        // O tipo não perguntou nada: o número vem daqui, não do usuário — e
        // qual número depende de POR QUE ele não perguntou.
        total: initialTotal({ countsProgress, typed }),
      },
      {
        onSuccess: (created) => {
          clear()
          onOpenChange(false)
          onCreated?.(created)
        },
      },
    )
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          clear()
        }
        onOpenChange(open)
      }}
    >
      <SheetContent side="right" className="gap-4" aria-describedby={undefined}>
        <SheetHeader className="pb-0">
          {pick ? (
            <>
              {/* O bloco de PROCEDÊNCIA: arte, year, de quem veio e a sinopse.
               * Nada dele é campo — é o que responde "é esta obra mesmo?". */}
              <div className="flex items-start gap-3">
                <RemoteArt
                  src={pick.art}
                  title={pick.title}
                  className="h-24 w-16 shrink-0 rounded-md text-xl"
                />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base leading-tight">
                    {pick.title}
                  </SheetTitle>
                  <p className="mt-0.5 text-faint text-xs tabular-nums">
                    {pick.year ?? libraryCopy.add.yearUnknown}
                  </p>
                  <p className="mt-1.5 text-faint text-xs">
                    {libraryCopy.add.from(pick.providerName)}
                  </p>
                </div>
              </div>
              {pick.synopsis && (
                <SheetDescription className="line-clamp-3 text-xs leading-relaxed">
                  {pick.synopsis}
                </SheetDescription>
              )}
            </>
          ) : (
            <>
              <SheetTitle>{libraryCopy.add.title}</SheetTitle>
              <SheetDescription>{libraryCopy.add.body}</SheetDescription>
            </>
          )}
        </SheetHeader>

        {/* `form` de verdade: é o que faz Enter no campo de título submit, sem
         * um `onKeyDown` escrito à mão. */}
        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
        >
          <div className="scrollbar-styled flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4">
            {/* Vindo da searchQuery o type é PROCEDÊNCIA, não escolha: ele definiu
             * qual catálogo respondeu e qual mapa de campos leu o resultado.
             * Trocá-lo aqui guardaria uma série como livro, com o id externo
             * de uma série pendurado. */}
            {pick ? (
              <div className="flex flex-col gap-2">
                <span className="text-muted text-xs">
                  {libraryCopy.add.mediaType}
                </span>
                <span className={`${PICKED} w-fit`}>
                  <MediaTypeIcon
                    type={pick.mediaType}
                    size={13}
                    strokeWidth={1.7}
                  />
                  {chosenType?.name ?? pick.mediaType}
                </span>
                <p className="text-faint text-xs">
                  {libraryCopy.add.typeFromSearch}
                </p>
              </div>
            ) : (
              <Group label={libraryCopy.add.mediaType}>
                {offered.map((info) => (
                  <button
                    key={info.slug}
                    type="button"
                    onClick={() => setMediaType(info.slug)}
                    aria-pressed={chosen === info.slug}
                    className={chosen === info.slug ? PICKED : AVAILABLE}
                  >
                    <MediaTypeIcon
                      type={info.slug}
                      size={13}
                      strokeWidth={1.7}
                    />
                    {info.name}
                  </button>
                ))}
              </Group>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-muted text-xs" htmlFor="add-entry-title">
                {libraryCopy.add.titleField}
              </label>
              <Input
                id="add-entry-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={libraryCopy.add.titlePlaceholder}
                className={FIELD}
                autoFocus
              />
              {pick && (
                <p className="text-faint text-xs">
                  {libraryCopy.add.titleFromSearch}
                </p>
              )}
            </div>

            <Group label={libraryCopy.add.status}>
              {STATUS_ORDER.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  aria-pressed={status === value}
                  className={
                    status === value ? `${PICKED} gap-0` : `${AVAILABLE} gap-0`
                  }
                >
                  {appCopy.statuses[value]}
                </button>
              ))}
            </Group>

            {/* Some inteiro no tipo que não conta, em vez de virar um campo
             * desabilitado: campo cinza ainda ocupa a linha e ainda faz
             * perguntar por quê. */}
            {countsProgress && (
              <div className="flex flex-col gap-2">
                <label className="text-muted text-xs" htmlFor="add-entry-total">
                  {chosenType?.progressUnit
                    ? appCopy.totals.withUnit(chosenType.progressUnit)
                    : appCopy.totals.generic}
                </label>
                <Input
                  id="add-entry-total"
                  value={total}
                  onChange={(event) =>
                    // Só dígito: `type="number"` traz as setinhas e o scroll
                    // que muda o valor sem querer, e `inputMode` sozinho é
                    // dica de teclado, não validação.
                    setTotal(event.target.value.replace(/\D/g, ''))
                  }
                  inputMode="numeric"
                  className={`${FIELD} tabular-nums`}
                />
                <p className="text-faint text-xs">
                  {libraryCopy.add.totalHint}
                </p>
              </div>
            )}

            {/* Por último porque é opcional: a entry existe sem pile, e o
             * campo que não é obrigatório não pode ficar entre os que são. */}
            <PilePicker selected={piles} onChange={setPiles} />

            {create.isError && (
              <p className="text-danger text-xs">{libraryCopy.add.failed}</p>
            )}
          </div>

          {/* `env(safe-area-inset-bottom)` como na barra de abas: no iPhone a
           * barra de gestos come a base da tela, e sem isto ela ficaria por
           * cima do "Cancel". */}
          <div
            className="mt-auto flex flex-col gap-2 border-line border-t p-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <Button type="submit" disabled={!canSubmit}>
              {libraryCopy.add.submit}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {libraryCopy.add.cancel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

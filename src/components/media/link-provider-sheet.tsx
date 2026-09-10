import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RemoteArt } from '@/components/media/remote-art'
import { ChoicePicker } from '@/components/menu/choice-picker'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { type SearchRefusal, searchRefusalOf } from '@/domain/search-refusal'
import { sourcesByType } from '@/domain/search-scope'
import { useLinkEntry } from '@/hooks/mutations/entries/use-link-entry'
import { useMediaTypes } from '@/hooks/queries/media-types/use-media-types'
import { useProviders } from '@/hooks/queries/providers/use-providers'
import { useSearch } from '@/hooks/queries/search/use-search'
import { useDebounced } from '@/hooks/use-debounced'
import { searchCopy } from '@/routes/-search.copy'
import { titleDetailCopy } from '@/routes/-title-detail.copy'
import type { SearchResult } from '@/services/search'

const copy = titleDetailCopy.sources

/**
 * Escolher, num provedor, qual obra é esta (brief, 3.10).
 *
 * ── É a mesma FORMA da folha de adicionar, e é decisão ──────────────────────
 * O resultado da busca **preenche** em vez de agir sozinho, e aqui o que ele
 * preenche é o par `(provedor, id externo)`. O que muda em relação a
 * `AddEntrySheet` é que não há nada a editar: a obra já existe, e o único dado
 * novo é a identidade dela no catálogo do outro.
 *
 * ── O escopo NÃO é escolhível ───────────────────────────────────────────────
 * Em `/search` o tipo é parâmetro que a pessoa move. Aqui ele é **da obra**, e
 * oferecer um seletor deixaria vincular um mangá a um id de filme — que é
 * justamente o que o servidor recusa com 400, porque o id só é legível dentro
 * do par (tipo, provedor).
 *
 * A FONTE continua escolhível, e pelo mesmo motivo de `/search`: ela é
 * parâmetro da consulta. Só que aqui a lista já vem **sem os provedores que
 * esta obra tem** — oferecer um vínculo que o servidor recusaria com 409 é
 * aceitar o clique pra falhar depois dele, e o app não tem toast.
 */
export function LinkProviderSheet({
  entryId,
  mediaType,
  title,
  linked,
  isAdmin,
  open,
  onOpenChange,
}: {
  entryId: number
  mediaType: string
  title: string
  /** Os slugs que esta obra já tem. Saem da lista de fontes. */
  linked: readonly string[]
  /** Só admin recebe o atalho pra Settings: botão que não se pode usar mente. */
  isAdmin: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [term, setTerm] = useState(title)
  const [source, setSource] = useState<string | null>(null)
  const types = useMediaTypes()
  const providers = useProviders()
  const link = useLinkEntry(entryId)

  /**
   * O campo nasce com o TÍTULO da obra, e volta a ele a cada abertura.
   *
   * **A identidade da abertura é dada por quem abre** (design system, seção 8,
   * quinta leva): sem o `open` na dependência, reabrir a folha depois de uma
   * busca frustrada manteria o termo velho — e dois formulários com o mesmo
   * campo preenchido são indistinguíveis do estado certo.
   */
  useEffect(() => {
    if (open) {
      setTerm(title)
      setSource(null)
      link.reset()
    }
  }, [open, title, link.reset])

  const all = sourcesByType(types.data ?? [], providers.data ?? []).get(
    mediaType,
  )
  const available = (all?.options ?? []).filter(
    ({ slug }) => !linked.includes(slug),
  )
  /**
   * A fonte efetiva desta folha. **Onde o servidor decide, a tela lê a
   * decisão** — mas aqui a decisão do servidor (o efetivo) pode estar entre as
   * já vinculadas, e aí ela não serve: a primeira disponível é a resposta, e é
   * a mesma ordem alfabética que o servidor usa pra desempatar.
   */
  const active =
    available.find(({ slug }) => slug === source) ?? available[0] ?? null

  const searchQuery = useDebounced(term)
  const results = useSearch(
    { type: mediaType, q: searchQuery, provider: active?.slug ?? null },
    open && active !== null,
  )
  /**
   * **A recusa não é lista vazia, e confundi-las é a mentira que o vocabulário
   * de motivos existe pra impedir** (brief, 3.10).
   *
   * Visto rodando: o Jikan responde 504 em busca, o servidor devolve
   * `provider-down`, e esta folha escrevia "Nothing found for …" — dizendo que
   * a obra não está no catálogo quando não houve catálogo nenhum. É a mesma
   * régua de sempre: **onde o servidor decide, a tela lê a decisão**.
   */
  const refusal = searchRefusalOf(results.error)

  function content() {
    // Nenhum provedor serve este tipo. A tela responde sozinha, sem ida à rede.
    if (!all) {
      return (
        <Refusal title={copy.noSource} body={copy.noSourceAdmin}>
          <Link
            to="/settings/providers"
            className="text-ink text-xs underline underline-offset-2"
          >
            {copy.openProviders}
          </Link>
        </Refusal>
      )
    }

    // Há fonte, e esta obra já tem todas. Não é falha: é não ter o que fazer.
    if (!active) {
      return <Refusal title={copy.allLinked} />
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            aria-label={copy.searchLabel}
            className="h-9 text-sm"
          />
          {/* Com uma source só não há o que trocar, e um seletor de uma opção é
           * um controle que mente sobre ter escolha — a mesma régua do
           * cabeçalho de `/search`. **Aqui ele SOME em vez de virar texto**,
           * porque não há rótulo ao lado: uma palavra solta no meio do
           * formulário não se explica sozinha. */}
          {available.length > 1 && (
            <div className="self-start">
              <ChoicePicker
                options={available.map((option) => ({
                  value: option.slug,
                  label: option.name,
                }))}
                value={active.slug}
                onSelect={setSource}
                ariaLabel={titleDetailCopy.sources.linkTitle}
                align="start"
              />
            </div>
          )}
        </div>

        {results.data?.provider.attribution && (
          <p className="text-faint text-xs">
            {results.data.provider.attribution}
          </p>
        )}

        {link.isError && <p className="text-danger text-xs">{copy.failed}</p>}

        {refusal ? (
          <SearchRefusalPanel
            refusal={refusal}
            isAdmin={isAdmin}
            onRetry={() => void results.refetch()}
          />
        ) : (
          <List
            results={results.data?.results ?? []}
            owned={results.data?.owned ?? {}}
            isLoading={results.isPending && searchQuery.trim() !== ''}
            term={searchQuery}
            pending={link.isPending}
            onPick={(result) =>
              link.mutate(
                {
                  provider: result.provider,
                  externalId: result.externalId,
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          />
        )}
      </>
    )
  }

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-4 overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle>{copy.linkTitle}</SheetTitle>
          <SheetDescription>{copy.linkBody(title)}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">{content()}</div>
      </SheetContent>
    </Sheet>
  )
}

function Refusal({
  title,
  body,
  children,
}: {
  title: string
  body?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md px-3 py-4 ring-1 ring-line">
      <p className="text-ink text-sm">{title}</p>
      {body && <p className="text-faint text-xs">{body}</p>}
      {children}
    </div>
  )
}

/**
 * A recusa do provedor, dentro da folha.
 *
 * **Reusa a COPY de `/search` e não o painel dela**: `SearchRefused` oferece
 * "Add manually" e "Search your library", que são saídas erradas aqui — quem
 * abriu esta folha já está na obra, e adicionar de novo é o que a feature veio
 * evitar. A saída daqui é **trocar de fonte**, e ela já está no seletor acima.
 *
 * O corpo vem do SERVIDOR, que é quem sabe qual provedor falhou e com que
 * status — duas frases pra manter em sincronia é como as pontas divergem.
 */
function SearchRefusalPanel({
  refusal,
  isAdmin,
  onRetry,
}: {
  refusal: SearchRefusal
  isAdmin: boolean
  onRetry: () => void
}) {
  /**
   * O `no-provider` não chega aqui — a folha o responde sozinha, antes de
   * qualquer ida à rede —, mas a copy dele pede o nome do tipo, então o
   * `reason` precisa ser estreitado pros que sobram.
   */
  const title =
    refusal.reason === 'no-provider'
      ? copy.noSource
      : searchCopy.refusal[refusal.reason]

  /** **O botão existe onde há o que ARRUMAR** — o `5xx` não tem. */
  const toProviders =
    isAdmin &&
    (refusal.reason === 'not-configured' ||
      refusal.reason === 'provider-refused')

  const canRetry = refusal.reason !== 'not-configured'

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-md px-3 py-4 ring-1 ${
        refusal.severity === 'failure' ? 'ring-danger/40' : 'ring-line'
      }`}
    >
      <p className="text-ink text-sm">{title}</p>
      <p className="text-faint text-xs leading-snug">{refusal.message}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {toProviders && (
          <Link
            to="/settings/providers"
            className="text-ink text-xs underline underline-offset-2"
          >
            {searchCopy.refusal.openProviders}
          </Link>
        )}
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer text-muted text-xs underline underline-offset-2 hover:text-ink"
          >
            {searchCopy.refusal.retry}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * A lista de candidatos — LINHA, não a grade de `/search`.
 *
 * A folha tem ~400px, e a grade de pôsteres caberia em duas colunas. A tarefa
 * aqui também é outra: em `/search` a pessoa passeia por um catálogo, aqui ela
 * confere qual das linhas é a obra que já está na tela atrás da folha. O ano e
 * o subtipo são o que respondem isso, e em linha eles ficam legíveis.
 */
const ROW =
  'flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised focus-visible:ring-[3px] focus-visible:ring-ink/50 disabled:cursor-default disabled:opacity-[var(--opacity-disabled)] disabled:hover:bg-transparent'

function List({
  results,
  owned,
  isLoading,
  term,
  pending,
  onPick,
}: {
  results: SearchResult[]
  owned: Record<string, number>
  isLoading: boolean
  term: string
  pending: boolean
  onPick: (result: SearchResult) => void
}) {
  if (isLoading) {
    return <p className="text-faint text-xs">{copy.searching}</p>
  }

  if (term.trim() === '') {
    return null
  }

  if (results.length === 0) {
    return <p className="text-faint text-xs">{copy.noResults(term)}</p>
  }

  return (
    <ul className="flex flex-col">
      {results.map((result) => {
        /**
         * **A recusa se anuncia antes do clique** (design system, seção 5): um
         * id que outra obra sua já reivindica volta como 409, e sem toast não
         * há onde explicar isso depois. A linha nasce desabilitada com o
         * motivo, como `Add type` faz com template já instalado.
         */
        const taken = owned[result.externalId]

        const content = (
          <>
            <RemoteArt
              src={result.art}
              title={result.title}
              className="h-14 w-10 shrink-0 rounded-sm text-sm"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-ink text-sm">{result.title}</span>
              <span className="truncate text-[11px] text-faint">
                <span className="tabular-nums">
                  {result.year ?? titleDetailCopy.yearUnknown}
                </span>
                {result.subtype ? ` \u00b7 ${result.subtype}` : null}
              </span>
              {taken !== undefined && (
                <span className="truncate text-[11px] text-faint">
                  {copy.takenBadge}
                </span>
              )}
            </span>
          </>
        )

        return (
          <li key={`${result.provider}:${result.externalId}`}>
            {taken === undefined ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onPick(result)}
                className={ROW}
              >
                {content}
              </button>
            ) : (
              /**
               * **A linha tomada é um LINK, não um botão morto.**
               *
               * A decisão de 01/09 pede "marcado e desabilitado, com atalho pra
               * obra", e a metade do atalho faltava: visto rodando, a linha
               * dizia que outra obra usa aquele id e não dizia qual — um beco,
               * numa tela cuja pergunta inteira é "é esta obra mesmo?".
               *
               * Desabilitar é pra ação que FALHA; marcar é pra destino que
               * EXPLICA (design system, seção 5). Aqui o destino explica.
               */
              <Link
                to="/library/$entryId"
                params={{ entryId: String(taken) }}
                className={`${ROW} opacity-60`}
              >
                {content}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

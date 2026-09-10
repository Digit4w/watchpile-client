import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { SessionPending } from '@/components/chrome/session-pending'
import { AddEntrySheet } from '@/components/library/add-entry-sheet'
import { SearchHeader } from '@/components/search/search-header'
import {
  SearchGrid,
  SearchGridSkeleton,
  SearchResultsHeader,
} from '@/components/search/search-results'
import {
  SearchError,
  SearchIdle,
  SearchNoResults,
  SearchRefused,
} from '@/components/search/search-states'
import { type SearchRefusal, searchRefusalOf } from '@/domain/search-refusal'
import {
  defaultScope,
  effectiveSource,
  sourcesByType,
  type TypeSources,
} from '@/domain/search-scope'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { useSetSearchSource } from '@/hooks/mutations/preferences/use-set-search-source'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { useSearchSources } from '@/hooks/queries/preferences/use-search-sources'
import { useProviders } from '@/hooks/queries/providers/use-providers'
import { useSearch } from '@/hooks/queries/search/use-search'
import { useDebounced } from '@/hooks/use-debounced'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { useRememberedType } from '@/hooks/use-remembered-type'
import { useRequireSession } from '@/hooks/use-require-session'
import { searchCopy } from './-search.copy'

export const Route = createFileRoute('/search/')({
  component: SearchRoute,
})

/**
 * O termo, o ESCOPO e a FONTE moram na URL (brief, 3.13): os três decidem o
 * que a tela mostra, e "procure Andor em séries no TMDB" é uma tela inteira
 * que se manda pra alguém.
 *
 * `type` aceita qualquer slug, como em `/library`: o vocabulário é da
 * instância, e um parser literal descartaria calado um tipo que existe.
 */
const PARSERS = {
  q: parseAsString.withDefault(''),
  type: parseAsString,
  provider: parseAsString,
}

function SearchRoute() {
  const navigate = useNavigate()
  const user = useRequireSession()
  const logout = useLogout()
  const [{ q, type, provider }, setSearch] = useQueryStates(PARSERS)
  /**
   * A folha em branco — o caminho manual, que continua existindo quando o
   * catálogo não tem a obra ou não há catálogo nenhum.
   *
   * **Ele sobreviveu à carta virar link — 01/09/2026.** O outro estado desta
   * tela era `escolhido`, que abria a folha preenchida; agora a carta navega
   * pra tela de detalhe e é lá que se adiciona. O manual fica, porque ele
   * responde outra pergunta: o catálogo não tem a obra, ou não há catálogo.
   *
   * A folha NÃO vai pra URL: é um formulário meio preenchido, não um estado
   * que se manda pra alguém — a mesma régua de `/library`.
   */
  const [manual, setManual] = useState(false)

  /**
   * O escopo oferece só o que o leitor mantém visível (brief, 3.12) — e o tipo
   * que a URL já escolheu entra mesmo escondido, senão um link compartilhado
   * abriria buscando outra coisa sem dizer que trocou.
   */
  const types = useOfferedMediaTypes(type)
  const providers = useProviders()

  /**
   * A fonte preferida vem da CONTA, não deste navegador — 10/09/2026, decisão
   * do dono. Ver `hooks/queries/preferences/use-search-sources.ts`: isto só
   * desenha o valor atual do seletor; quem decide quem responde a busca é o
   * servidor, e a resposta dela é a palavra final.
   */
  const searchSources = useSearchSources()
  const setSearchSource = useSetSearchSource()

  /**
   * slug do tipo → as fontes dele, com quem responde já resolvido.
   *
   * **Os tipos entram na conta desde 02/09/2026**, e não só os provedores: é
   * `effectiveProvider` que diz quem manda, e calculá-lo aqui por alfabeto
   * fazia o menu prometer uma fonte e o servidor responder por outra. **A
   * preferência entrou em 10/09 pelo mesmo motivo, um degrau acima** — ela
   * vence o efetivo no servidor, e sem ela aqui o menu voltaria a prometer o
   * padrão do admin.
   *
   * **Enquanto ela não chega, o mapa é VAZIO e não é o padrão do admin** —
   * mesma régua de `useOfferedMediaTypes` (04/09). Com o padrão, o seletor
   * mostraria a fonte do admin por um quadro e trocaria sozinho pra escolhida,
   * e *peça que sai sozinha se lê como defeito*. Vazio, a tela cai no caminho
   * que ela já tem pra "ainda não sei quais tipos existem", em vez de inventar
   * um estado novo. As três consultas têm `staleTime` de meia hora, então isso
   * acontece uma vez por sessão.
   */
  const sourceByType = searchSources.data
    ? sourcesByType(types, providers.data ?? [], searchSources.data.sources)
    : new Map<string, TypeSources>()

  /**
   * O que a pessoa estava fazendo da última vez, validado contra o vocabulário
   * de agora (10/09/2026, decisão do dono). **A URL continua dona** — isto só
   * responde pelo `/search` pelado da nav, que é o único endereço ambíguo que
   * esta tela tem.
   */
  const [rememberedType, rememberType] = useRememberedType(sourceByType)

  /**
   * O escopo cai no primeiro tipo COM fonte quando a URL não diz — abrir num
   * tipo sem provedor mostraria uma explicação no lugar de um campo pronto, e
   * quem clicou em `Search` quer buscar.
   */
  const scope = type ?? rememberedType ?? defaultScope(types, sourceByType)

  /**
   * A memória decidiu o escopo → **a URL passa a dizê-lo**, sem entrada nova no
   * histórico (`nuqs` já substitui por padrão).
   *
   * Sem isto o remendo quebraria o que ele prometia não quebrar: buscar a
   * partir do `/search` pelado produziria `?q=naruto` **sem `type`**, e quem
   * recebesse esse link abriria no escopo lembrado DELE — a mesma URL
   * significando duas buscas diferentes. Escrever aqui devolve a invariante de
   * 01/09 inteira: *a URL é o estado*, e o `localStorage` só responde pelo
   * endereço que não diz nada.
   *
   * Roda uma vez por chegada, porque `type` deixa de ser nulo no mesmo gesto.
   */
  useEffect(() => {
    /**
     * **A fonte não vai junto**, e desde 10/09 isso é consequência e não
     * omissão: ela mora na conta e é por TIPO, então quem responde já é a
     * preferência daquele tipo — escrevê-la na URL aqui congelaria na barra de
     * endereço uma escolha que a pessoa pode trocar na conta depois, e faria o
     * `/search` pelado gerar um link que carrega a preferência de quem o
     * mandou.
     */
    if (type === null && rememberedType) {
      setSearch({ type: rememberedType })
    }
  }, [type, rememberedType, setSearch])
  /**
   * Só o `?provider=` da URL, e a preferência **não entra aqui** — ela já está
   * dentro de `sourceByType`, que é onde a precedência inteira mora.
   *
   * Mandá-la também na consulta seria a tela reafirmando ao servidor uma coisa
   * que ele acabou de lhe contar: `chooseSearchProvider` lê a preferência
   * sozinho, e quem manda `provider` explícito está dizendo *"desta vez, outra
   * fonte"*. Duas contas da mesma coisa é como uma fica pra trás.
   */
  const sourceSlug = provider
  const activeType = types.find((info) => info.slug === scope)
  const typeLabel = activeType?.plural ?? activeType?.name ?? ''

  // A caixa responde na hora; a consulta espera a digitação parar — e aqui isso
  // vale dinheiro, não só milissegundos: cada tecla seria uma chamada ao
  // provedor, contra uma cota compartilhada por todo o servidor (brief, 3.10).
  const term = useDebounced(q)

  /**
   * Sem fonte não há requisição a fazer: a tela já sabe a resposta, e pedi-la
   * ao servidor só pra receber o `no-provider` de volta seria uma ida à rede
   * pra confirmar o que já está na mão.
   */
  const canSearch = scope !== null && sourceByType.has(scope)
  const searchQuery = useSearch(
    { type: scope ?? '', q: term, provider: sourceSlug },
    canSearch,
  )

  const isLoading = useDelayedPending(searchQuery.isPending && q.trim() !== '')
  const refusal = searchRefusalOf(searchQuery.error)
  /**
   * A recusa que a tela responde sozinha. **Resposta definitiva não fica atrás
   * de espera** (design system, seção 8, quarta leva): a versão anterior desta
   * tela mostrava "digite um nome acima" num tipo sem fonte — com o campo
   * morto ao lado e a frase interpolando um nome de provedor vazio.
   */
  const withoutSource: SearchRefusal | null =
    scope !== null && !sourceByType.has(scope)
      ? {
          reason: 'no-provider',
          severity: 'condition',
          message: searchCopy.refusal.noProviderBody,
          // A tela responde sozinha: não houve provedor nenhum a recusar.
          providerMessage: null,
        }
      : null

  if (!user) {
    return <SessionPending />
  }

  /** A que a tela responde sozinha vence a que veio da rede: ela é definitiva. */
  const refusalVisible = withoutSource ?? refusal

  /**
   * A fonte que ESTA consulta usa, e as opções do tipo — o que alimenta a
   * faixa de fonte (09/09/2026).
   *
   * Sai de `sourceByType`, não da resposta: na recusa e no vazio não há
   * resposta nenhuma, e é justamente aí que o controle precisa existir. Quando
   * a resposta chega, ela vence — quem respondeu é fato, e o efetivo é
   * previsão.
   */
  const typeSources = scope ? (sourceByType.get(scope) ?? null) : null
  const querySource = effectiveSource(typeSources, sourceSlug)

  const data = searchQuery.data
  /**
   * O nome da fonte, pro vazio. Antes da primeira resposta ele sai dos
   * provedores que servem o tipo — a tela precisa dizer ONDE vai procurar
   * **antes** de procurar, que é o ponto inteiro daquele vazio.
   */
  const source = data?.provider.name ?? querySource?.name ?? null

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      screenTitle={searchCopy.title}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SearchHeader
          term={q}
          scope={scope}
          source={sourceSlug}
          types={types}
          sourceByType={sourceByType}
          onTerm={(next) => setSearch({ q: next || null })}
          /**
           * Trocar de tipo LIMPA a fonte: `provider` só vale dentro de um tipo,
           * e carregá-lo pra outro pediria um provedor que não serve ali — que
           * o servidor recusa com 400, e com razão.
           */
          onScope={(next) => {
            setSearch({ type: next, provider: null })
            rememberType(next)
          }}
          /**
           * Escolher fonte manda o TIPO junto: a fonte só existe dentro de um
           * tipo, e escolher "Jikan" na linha de Anime estando em Movies é um
           * gesto só — pedir dois cliques pra isso seria a tela cobrando por
           * uma distinção que ela mesma inventou.
           *
           * **São dois pedidos num gesto** — *busque aqui agora* e *lembre
           * disso* —, e eles vão pra lugares diferentes de propósito: o
           * primeiro na URL, que é o estado desta consulta; o segundo na
           * conta, que atravessa aparelho. A URL não espera a escrita.
           */
          onSource={(nextType, nextSource) => {
            setSearch({ type: nextType, provider: nextSource })
            rememberType(nextType)
            setSearchSource.mutate({
              mediaType: nextType,
              provider: nextSource,
            })
          }}
        />

        {/* A order em que a tela testa seus estados é decisão de design
         * (design system, seção 8): **o que ela já sabe, ela diz**. Primeiro a
         * recusa que a própria tela responde — tipo sem fonte —, depois a que
         * veio do servidor, depois o erro, e só então o vazio e a espera. */}
        {/* **A faixa de fonte fica ACIMA de todos os estados, e é a mesma em
         * todos** — 09/09/2026, decisão do dono. Ela vivia dentro do ramo
         * `data && …`, então o único controle rotulado da fonte sumia
         * exatamente na recusa (onde trocar de fonte é o que resolve) e no
         * vazio (onde se escolhe a fonte antes de digitar).
         *
         * Ela some sozinha em tipo SEM fonte, porque aí `options` é vazio e
         * não há nome a dizer. */}
        <SearchResultsHeader
          total={data && !refusalVisible ? data.results.length : null}
          attribution={data?.provider.attribution ?? null}
          sources={typeSources?.options ?? []}
          current={data?.provider.slug ?? querySource?.slug ?? ''}
          onSource={(slug) => {
            setSearch({ provider: slug })
            if (scope) {
              setSearchSource.mutate({ mediaType: scope, provider: slug })
            }
          }}
        />

        {refusalVisible && scope && (
          <SearchRefused
            refusal={refusalVisible}
            source={source}
            type={typeLabel}
            term={q}
            isAdmin={user.isAdmin}
            onManual={() => setManual(true)}
            onRetry={() => searchQuery.refetch()}
          />
        )}

        {!withoutSource && searchQuery.isError && !refusal && (
          <SearchError
            error={searchQuery.error}
            onRetry={() => searchQuery.refetch()}
          />
        )}

        {!withoutSource && !searchQuery.isError && q.trim() === '' && (
          <SearchIdle type={typeLabel} source={source ?? ''} />
        )}

        {!withoutSource &&
          !searchQuery.isError &&
          q.trim() !== '' &&
          isLoading && <SearchGridSkeleton />}

        {data &&
          !withoutSource &&
          !searchQuery.isError &&
          q.trim() !== '' &&
          !isLoading &&
          (data.results.length > 0 ? (
            <SearchGrid
              results={data.results}
              owned={data.owned}
              // Há resultados, logo houve escopo: a busca é POR TIPO e o
              // servidor recusa sem ele. O `??` é só o compilador.
              type={scope ?? ''}
            />
          ) : (
            <SearchNoResults
              term={term}
              source={data.provider.name}
              type={typeLabel}
              onManual={() => setManual(true)}
            />
          ))}
      </div>

      {/* Só o caminho MANUAL abre folha aqui. O preenchido mudou de endereço:
       * ele mora na tela de detalhe, que é onde se olha antes de decidir. */}
      <AddEntrySheet open={manual} onOpenChange={setManual} />
    </AppShell>
  )
}

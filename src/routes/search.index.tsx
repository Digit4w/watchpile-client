import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
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
} from '@/domain/search-scope'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { useProviders } from '@/hooks/queries/providers/use-providers'
import { useSearch } from '@/hooks/queries/search/use-search'
import { useDebounced } from '@/hooks/use-debounced'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
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
   * slug do tipo → as fontes dele, com quem responde já resolvido.
   *
   * **Os tipos entram na conta desde 02/09/2026**, e não só os provedores: é
   * `effectiveProvider` que diz quem manda, e calculá-lo aqui por alfabeto
   * fazia o menu prometer uma fonte e o servidor responder por outra.
   */
  const sourceByType = sourcesByType(types, providers.data ?? [])
  /**
   * O escopo cai no primeiro tipo COM fonte quando a URL não diz — abrir num
   * tipo sem provedor mostraria uma explicação no lugar de um campo pronto, e
   * quem clicou em `Search` quer buscar.
   */
  const scope = type ?? defaultScope(types, sourceByType)
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
    { type: scope ?? '', q: term, provider },
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
  const querySource = effectiveSource(typeSources, provider)

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
          source={provider}
          types={types}
          sourceByType={sourceByType}
          onTerm={(next) => setSearch({ q: next || null })}
          /**
           * Trocar de tipo LIMPA a fonte: `provider` só vale dentro de um tipo,
           * e carregá-lo pra outro pediria um provedor que não serve ali — que
           * o servidor recusa com 400, e com razão.
           */
          onScope={(next) => setSearch({ type: next, provider: null })}
          /**
           * Escolher fonte manda o TIPO junto: a fonte só existe dentro de um
           * tipo, e escolher "Jikan" na linha de Anime estando em Movies é um
           * gesto só — pedir dois cliques pra isso seria a tela cobrando por
           * uma distinção que ela mesma inventou.
           */
          onSource={(nextType, nextSource) =>
            setSearch({ type: nextType, provider: nextSource })
          }
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
          onSource={(slug) => setSearch({ provider: slug })}
        />

        {refusalVisible && scope && (
          <SearchRefused
            refusal={refusalVisible}
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

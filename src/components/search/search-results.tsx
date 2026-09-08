import { Link } from '@tanstack/react-router'
import { RemoteArt } from '@/components/media/remote-art'
import { countOf } from '@/lib/format'
import { searchCopy } from '@/routes/-search.copy'
import type { SearchResult, SearchSource } from '@/services/search'

/**
 * A linha de resultados é CONTEÚDO, não uma terceira faixa de chrome: ela rola
 * junto. Aqui moram a contagem, a **atribuição** — que é condição de uso do
 * TMDB e não cortesia (brief, 3.10) — e a troca de fonte.
 *
 * A atribuição vem do provedor que respondeu, nunca escrita aqui: o TMDB exige
 * a frase, AniList e Open Library não exigem nenhuma, e uma tela que
 * escrevesse a do TMDB fixa creditaria o provedor errado no dia em que outro
 * respondesse (design system, seção 8, sétima leva).
 */
export function SearchResultsHeader({
  total,
  provider,
  sources,
  onSource,
}: {
  total: number
  provider: { slug: string; name: string; attribution: string | null }
  sources: SearchSource[]
  onSource: (slug: string) => void
}) {
  return (
    <>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-faint text-sm tabular-nums">
          {countOf(total, searchCopy.results)}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-faint text-xs">{searchCopy.source}</span>
          {/* Com uma source só não há o que trocar, e um seletor de uma opção
           * é um controle que mente sobre ter escolha. */}
          {sources.length > 1 ? (
            <select
              value={provider.slug}
              onChange={(event) => onSource(event.target.value)}
              aria-label={searchCopy.changeSource}
              className="h-9 rounded-md bg-transparent px-1 text-ink text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised focus-visible:ring-[3px] focus-visible:ring-ink/50"
            >
              {sources.map((source) => (
                <option key={source.slug} value={source.slug}>
                  {source.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-ink text-sm">{provider.name}</span>
          )}
        </div>
      </div>

      {provider.attribution && (
        <p className="mb-4 text-faint text-xs">{provider.attribution}</p>
      )}
      {!provider.attribution && <div className="mb-4" />}
    </>
  )
}

/**
 * A carta de resultado usa a CAIXA da carta de mídia e nada mais dela.
 *
 * Um resultado de provedor **não é uma obra**: não tem status, progresso nem
 * nota, então os selos daquela carta não teriam o que mostrar. O selo de TIPO
 * também sai — aqui o tipo é o escopo da tela, e seria idêntico em toda carta.
 *
 * A carta inteira é o alvo, e desde 01/09/2026 ela **navega** em vez de abrir a
 * folha: adicionar mudou de lugar pra tela de detalhe, onde dá pra olhar a
 * sinopse inteira e a lista de unidades antes de decidir.
 */
function ResultCard({ result, type }: { result: SearchResult; type: string }) {
  return (
    <Link
      to="/search/$provider/$externalId"
      params={{ provider: result.provider, externalId: result.externalId }}
      // O tipo viaja no endereço: sem ele o id não identifica a obra — no TMDB
      // o mesmo número é uma série e pode ser outro filme.
      search={{ type }}
      className="group relative block h-full w-full overflow-hidden rounded-md text-left outline-none ring-ink transition-shadow duration-[var(--motion-micro)] ease-chrome hover:ring-2 focus-visible:ring-[3px] focus-visible:ring-ink/50"
    >
      <RemoteArt
        src={result.art}
        title={result.title}
        className="absolute inset-0 h-full w-full text-3xl"
      />
      {/* `from-35%`: o degradê fica SÓLIDO até 35% da band e só então abre.
       * Medido em 01/09/2026, contra o pior caso possível — um pôster branco
       * atrás do texto (design system, seção 9). Com a rampa começando na
       * base, o topo do título caía em **2,56:1**, quando 4,5 é o não
       * negociável; a 35% ele fecha em **5,36**. O número não é estético: a
       * faixa tem 75px e o título mora entre 27 e 43px acima da base, então é
       * a altura DELE que decide onde a rampa pode começar. */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-0.5 bg-gradient-to-t from-35% from-surface to-transparent px-2 pt-8 pb-2">
        <p className="truncate font-medium text-ink text-xs">{result.title}</p>
        {/* O year vira "Year unknown" em vez de sumir: uma carta sem a segunda
         * linha mudaria de altura no meio da fileira.
         *
         * ── O SUBTIPO mora AQUI, e não numa terceira linha — 02/09/2026 ──────
         * Não é economia de espaço: o degradê desta faixa foi MEDIDO contra um
         * pôster branco contando com o título entre 27 e 43px acima da base
         * (design system, seção 9). Uma linha a mais empurra o título pra cima
         * e invalida os 5,36:1 que o `from-35%` comprou.
         *
         * Ele é o que separa duas linhas com o MESMO título — o IGDB devolve o
         * jogo e um Mod chamado igual. Nulo nos provedores que não têm o
         * conceito, e aí o ponto some junto: separador sem segundo lado é
         * sujeira. */}
        <p className="truncate text-[11px] text-faint">
          <span className="tabular-nums">
            {result.year ?? searchCopy.yearUnknown}
          </span>
          {result.subtype ? ` ${searchCopy.dot} ${result.subtype}` : null}
        </p>
      </div>
    </Link>
  )
}

/**
 * O resultado que a pessoa JÁ tem — marcado e sem ação de adicionar, antes do
 * clique (brief, 3.10). Não é erro depois do clique porque o app não tem
 * toast, e a régua de "recusa se anuncia antes do clique" vale aqui igual.
 *
 * **O atalho passou a apontar pra obra em 01/09/2026**, quando `/library/:id`
 * nasceu. Antes ele levava a `/library` com o título no filtro — contorno de
 * quando não havia tela de detalhe, e o handoff já registrava que o destino é
 * que precisava melhorar, não a carta ganhar peças.
 */
function OwnedCard({
  result,
  entryId,
}: {
  result: SearchResult
  entryId: number
}) {
  return (
    <Link
      to="/library/$entryId"
      params={{ entryId: String(entryId) }}
      className="group relative block h-full w-full overflow-hidden rounded-md outline-none ring-line transition-shadow duration-[var(--motion-micro)] ease-chrome hover:ring-1 focus-visible:ring-[3px] focus-visible:ring-ink/50"
    >
      <div className="absolute inset-0 opacity-40">
        <RemoteArt
          src={result.art}
          title={result.title}
          className="absolute inset-0 h-full w-full text-3xl"
        />
      </div>
      <span className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center rounded-sm bg-glass p-1 text-ink backdrop-blur-md">
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4.5 10.5 8 14 15.5 6" />
        </svg>
        <span className="sr-only">{searchCopy.ownedBadge}</span>
      </span>
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-0.5 bg-gradient-to-t from-35% from-surface to-transparent px-2 pt-8 pb-2">
        <p className="truncate font-medium text-muted text-xs">
          {result.title}
        </p>
        <span className="text-[11px] text-faint">{searchCopy.owned}</span>
      </div>
    </Link>
  )
}

/**
 * A mesma trilha de `/library`: `minmax(--spacing-card-poster, 1fr)`, com o
 * excedente virando espaço simétrico entre as cartas.
 */
/**
 * **A carta navega, e o clique deixou de abrir a folha — 01/09/2026.**
 *
 * A bifurcação estava registrada em aberto: com tela de detalhe existindo,
 * adicionar ou ver detalhes vira a ação primária? A escolha de escopo do dono
 * respondeu — episódios entram na tela do PROVEDOR, e uma lista de episódios
 * só faz sentido se dá pra chegar nela **antes** de adicionar.
 *
 * Adicionar não some: mora na tela de detalhe, onde a folha continua sendo o
 * formulário. O que se ganha é olhar antes de decidir, com sinopse inteira e
 * episódios à vista, em vez de decidir a partir de um pôster de 137px.
 */
export function SearchGrid({
  results,
  owned,
  type,
}: {
  results: SearchResult[]
  owned: Record<string, number>
  /** O escopo da busca — o tipo que definiu o que estes resultados são. */
  type: string
}) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
      {results.map((result) => (
        <li
          key={`${result.provider}:${result.externalId}`}
          className="h-card-poster-h w-full max-w-card-poster-max"
        >
          {owned[result.externalId] === undefined ? (
            <ResultCard result={result} type={type} />
          ) : (
            <OwnedCard
              result={result}
              entryId={owned[result.externalId] as number}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export function SearchGridSkeleton() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
      {Array.from({ length: 10 }, (_, index) => index).map((index) => (
        <li
          key={index}
          className="h-card-poster-h w-full max-w-card-poster-max animate-pulse rounded-md bg-card"
        />
      ))}
    </ul>
  )
}

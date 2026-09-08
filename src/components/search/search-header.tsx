import type { MediaTypeInfo } from '@/domain/media-type'
import { effectiveSource, type TypeSources } from '@/domain/search-scope'
import { searchCopy } from '@/routes/-search.copy'
import { SearchScope } from './search-scope'

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      className="pointer-events-none shrink-0 text-faint"
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

/**
 * O cabeçalho de `/search` — **uma faixa só**, e isso não fura a divisão de
 * duas faixas: ela diz que a de baixo é o RECORTE, e *"a fileira de filtro só
 * existe quando há eixo"* (design system, seção 5, 29/08). Esta tela ainda não
 * tem eixo de recorte.
 *
 * **O escopo não é recorte — é parâmetro da consulta.** `GET /api/search` exige
 * `type`, e por isso ele vive DENTRO do campo, numa peça só com o termo: ler
 * "buscar *Movies* por *fight club*" é o que a rota de fato faz. Foi confundir
 * as duas coisas que produziu a fileira de chips com a bolinha muda.
 *
 * **Os dois lugares que ficam livres, de propósito:** a direita desta faixa,
 * pro modo de exibição quando houver mais de um; e a faixa de baixo, pro dia em
 * que existir filtro de verdade — o candidato mais provável é "esconder o que
 * eu já tenho", que sai de graça do `owned`. Peça que não existe não entra na
 * tela (design system, seção 5).
 */
export function SearchHeader({
  term,
  scope,
  source,
  types,
  sourceByType,
  onTerm,
  onScope,
  onSource,
}: {
  term: string
  scope: string | null
  /** A fonte pedida na URL. Nula = a que manda no tipo. */
  source: string | null
  types: MediaTypeInfo[]
  /** slug do tipo → as fontes dele. */
  sourceByType: Map<string, TypeSources>
  onTerm: (next: string) => void
  onScope: (next: string) => void
  onSource: (type: string, source: string) => void
}) {
  const activeType = types.find((type) => type.slug === scope)
  const activeLabel = activeType?.plural ?? ''
  const sources = scope ? (sourceByType.get(scope) ?? null) : null
  /**
   * O placeholder nomeia a fonte que VAI responder, não a que manda no tipo —
   * senão trocar de fonte mudaria o resultado e não a promessa acima dele.
   */
  const sourceName = effectiveSource(sources, source)?.name ?? null

  const placeholder = sourceName
    ? searchCopy.placeholder(activeLabel, sourceName)
    : searchCopy.placeholderWithoutSource(activeLabel)

  /**
   * Caixa composta: o seletor continua VIVO quando o input morre. Sem isso, um
   * tipo sem fonte viraria um beco — campo morto e nenhuma saída dentro da
   * própria peça.
   *
   * `ring` no foco vai no invólucro e não no input, senão o anel apareceria só
   * em volta de metade da caixa.
   */
  const box = (height: string) => (
    <div
      className={`flex ${height} min-w-0 flex-1 items-center rounded-md border border-line bg-raised transition-colors duration-[var(--motion-micro)] ease-chrome focus-within:border-ink focus-within:ring-[3px] focus-within:ring-ink/50`}
    >
      <SearchScope
        scope={scope}
        source={source}
        types={types}
        sourceByType={sourceByType}
        onScope={onScope}
        onSource={onSource}
      />
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <SearchIcon />
        {/* `text` + `searchbox`, e não `type="search"`: cada motor desenha o
         * próprio botão de limpar, e o do Firefox não tem pseudo-elemento —
         * nem padrão nem `-moz-` —, então não há como escondê-lo por CSS. O
         * `Input` do `ui/` faz a mesma troca; este campo é cru porque carrega o
         * seletor de escopo dentro, não porque é diferente.
         *
         * O `role` devolve a semântica de leitor de tela sem trazer o desenho
         * junto — e é ele que a regra abaixo quer trocar de volta pelo `type`
         * que acabamos de tirar. */}
        {/* biome-ignore lint/a11y/useSemanticElements: ver o comentário acima */}
        <input
          type="text"
          role="searchbox"
          value={term}
          onChange={(event) => onTerm(event.target.value)}
          placeholder={placeholder}
          // Campo morto sobre nada: um campo vivo prometeria uma busca que não
          // tem onde acontecer. O seletor ao lado é a saída.
          disabled={sourceName === null}
          className="min-w-0 flex-1 bg-transparent text-ink text-sm outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:text-faint"
        />
      </div>
    </div>
  )

  return (
    <header className="sticky top-[var(--wp-app-bar)] z-20 -mx-4 -mt-4 mb-4 border-line border-b bg-glass px-4 backdrop-blur md:top-0 md:-mx-8 md:-mt-8 md:px-8">
      <div className="hidden h-18 items-center gap-4 md:flex">
        <h1 className="shrink-0 truncate font-semibold text-xl tracking-tight">
          {searchCopy.title}
        </h1>
        <div className="flex min-w-0 max-w-xl flex-1">{box('h-9')}</div>
      </div>

      {/* No celular a band de título some — a barra do `AppShell` já mostra o
       * nome da tela. E some também a fileira de chips que existia aqui: são
       * 56px devolvidos numa tela de ~700. */}
      <div className="flex h-14 items-center md:hidden">{box('h-11')}</div>
    </header>
  )
}

import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { conditionOf } from '@/domain/provider-status'
import { requestFailure } from '@/domain/request-failure'
import { useMediaTypeMap } from '@/hooks/queries/media-types/use-media-type-map'
import { appCopy } from '@/lib/copy'
import { settingsCopy } from '@/routes/-settings.copy'
import type { Provider } from '@/services/providers'

const copy = settingsCopy.providers

/**
 * O que falta — nomeado pelo RÓTULO da credencial, não pela chave.
 *
 * `api_key` é nome de máquina; a declaração já carrega o rótulo humano porque é
 * dela que o formulário é gerado. **O rótulo vai como veio**: baixá-lo pra
 * minúscula transformava "API key" em "api key" na tela, rebaixando uma sigla.
 *
 * Sem artigo — ver a copy: "a" ou "an" dependeria da primeira letra de um dado
 * que vem do provedor, e em pt-BR o problema é outro.
 */
function missing(provider: Provider): string {
  const labels = provider.credentials
    .filter((c) => !c.configured)
    .map((c) => c.label)

  if (labels.length === 0) {
    return ''
  }
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
  return copy.missing(String(list))
}

/**
 * A linha de um provedor — 56px, o mesmo alvo da linha de tipo de mídia.
 *
 * **Provedor não tem ícone, e a ausência é decisão.** Quem identifica um
 * provedor é o nome próprio, e a régua do design system (seção 4) é arte quando
 * a arte identifica, texto quando o texto identifica sozinho. Inventar um glifo
 * por provedor seria pedir ao admin que desenhasse identidade de terceiro — e
 * ícone de marca não existe no acervo porque o Lucide removeu os dele.
 *
 * **A COBERTURA fica aqui, não na linha do tipo.** Ali é descrição de
 * capacidade — "pra que serve este provedor?" —, que é a pergunta de quem olha
 * uma lista de provedores. Na linha do tipo seria ruído: quatro dos seis tipos
 * não têm provedor, e o brief 3.10 chama isso de legítimo. Onde a ausência morde
 * é a busca, que já devolve 503 com o motivo.
 *
 * A segunda linha é **condição, não aviso**: ela não se dispensa, e some sozinha
 * quando deixa de ser verdade.
 */
function ProviderRow({
  provider,
  onOpen,
  coverage,
}: {
  provider: Provider
  onOpen: (provider: Provider) => void
  /** Já resolvida em NOMES de tipo — a linha não renderiza slug. */
  coverage: string
}) {
  const condition = conditionOf(provider)
  const state =
    condition === 'embedded-key'
      ? copy.embedded.row
      : condition === 'needs-credential'
        ? missing(provider)
        : ''

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(provider)}
        className="flex h-14 w-full items-center gap-3 rounded-md px-3 text-left transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
      >
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="truncate text-ink text-sm">{provider.name}</span>
          {state && (
            <span className="mt-0.5 flex items-center gap-1.5">
              <span
                className="size-1.5 shrink-0 rounded-full bg-warning"
                aria-hidden="true"
              />
              <span className="truncate text-warning text-xs">{state}</span>
            </span>
          )}
        </span>

        {/* A cobertura some no estreito: numa row de 390px o name do provedor
         * e a condição já ocupam a largura, e a cobertura é a informação menos
         * urgente das três. */}
        <span className="hidden min-w-0 max-w-48 shrink-0 sm:flex sm:justify-end">
          {coverage ? (
            <span className="truncate text-faint text-sm">{coverage}</span>
          ) : (
            /* **Ocioso, não quebrado** (brief, 3.10) — e a itálica separa a
             * frase de um valor. */
            <span className="truncate text-faint text-sm italic">
              {copy.servesNoType}
            </span>
          )}
        </span>

        <ChevronRight
          className="shrink-0 text-faint"
          size={16}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </button>
    </li>
  )
}

export function ProviderList({
  providers,
  onOpen,
}: {
  providers: Provider[]
  onOpen: (provider: Provider) => void
}) {
  const types = useTypeLabels()

  return (
    // `-mx-3` devolve o padding da linha à margem do painel, senão o nome do
    // provedor nasce 12px à direita do título da seção.
    <ul className="-mx-3 flex flex-col">
      {providers.map((provider) => (
        <ProviderRow
          key={provider.slug}
          provider={provider}
          onOpen={onOpen}
          coverage={types(provider.mediaTypes)}
        />
      ))}
    </ul>
  )
}

export function ProviderListSkeleton() {
  return (
    <ul className="-mx-3 flex flex-col">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex h-14 items-center gap-3 px-3">
          <span className="h-4 w-28 animate-pulse rounded-sm bg-raised" />
          <span className="ml-auto h-4 w-24 animate-pulse rounded-sm bg-raised" />
        </li>
      ))}
    </ul>
  )
}

/** `ring-1` e não `border` (design system, seção 4). */
const BOX =
  'flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-20 text-center ring-1'

/**
 * **Inalcançável hoje, e escrito assim mesmo.** Provedor é semeado SEMPRE
 * (brief, 3.9) e não há rota de apagar, então esta caixa só aparece num banco
 * editado à mão. Ela existe porque o dia em que provedor definido pelo usuário
 * chegar, apagar o último passa a ser alcançável — e a copy que a tela vai
 * precisar diz o que se perde: não uma configuração, a busca inteira.
 */
export function ProvidersEmpty() {
  return (
    <div className={`${BOX} ring-line`}>
      <p className="font-medium text-base">{copy.empty.title}</p>
      <p className="max-w-sm text-muted text-sm">{copy.empty.body}</p>
    </div>
  )
}

/**
 * A falha de um pedido ao nosso servidor.
 *
 * Recebe o ERRO e não um booleano: qual das duas frases vale é regra decidível,
 * e regra decidível mora em `domain/`.
 */
export function ProvidersError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const copy = appCopy.error[requestFailure(error)]

  return (
    <div className={`${BOX} ring-danger/40`}>
      <p className="font-medium text-base">{copy.title}</p>
      <p className="max-w-sm text-muted text-sm">{copy.body}</p>
      <Button variant="outline" className="mt-1" onClick={onRetry}>
        {appCopy.error.retry}
      </Button>
    </div>
  )
}

/**
 * **`ring-line` e não `ring-danger`: nada falhou.** O servidor respondeu certo, e
 * a resposta é que isto não é seu. A copy diz o que a pessoa AINDA pode fazer —
 * buscar com o que o admin configurou —, em vez de só constatar a recusa.
 */
export function ProvidersForbidden({ onBack }: { onBack: () => void }) {
  return (
    <div className={`${BOX} ring-line`}>
      <p className="font-medium text-base">{copy.forbidden.title}</p>
      <p className="max-w-sm text-muted text-sm">{copy.forbidden.body}</p>
      <Button variant="outline" className="mt-1" onClick={onBack}>
        {copy.forbidden.back}
      </Button>
    </div>
  )
}

/**
 * Os slugs de tipo virando os NOMES que a pessoa lê.
 *
 * `mediaTypes` vem do contrato como slug — `['movie', 'tv']` —, e renderizá-lo
 * cru põe nome de máquina na tela, que é o mesmo defeito que o servidor já
 * corrigiu duas vezes nas mensagens dele. Aqui ele apareceu de novo, e só na
 * tela rodando.
 *
 * Usa o **plural**, porque a coluna descreve um conjunto: "Movies, Series", não
 * "Movie, Series". O plural é chave própria do tipo justamente pra isso (brief,
 * 3.12) — o singular com "s" colado trava a tradução.
 *
 * Cai no slug quando o tipo é desconhecido, pela mesma razão de
 * `useMediaTypeName`: mostrar `podcast` é feio, mostrar vazio parece defeito.
 */
function useTypeLabels() {
  const { map } = useMediaTypeMap()

  return (slugs: readonly string[]) =>
    slugs.map((slug) => map.get(slug)?.plural ?? slug).join(', ')
}

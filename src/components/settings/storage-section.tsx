import { HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type CacheKind,
  useClearCache,
} from '@/hooks/mutations/storage/use-clear-cache'
import { useStorage } from '@/hooks/queries/storage/use-storage'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { countOf, formatBytes } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'
import { ProvidersError } from './provider-list'
import { SectionHeader } from './section-header'

const copy = settingsCopy.storage

/**
 * `THIS INSTANCE / Storage` — o que este servidor guardou porque podia buscar
 * de novo (brief, 3.9 e 3.10).
 *
 * **Do admin, e aqui divergimos do Yamtrack de propósito:** lá limpar o cache
 * de busca mora em `Advanced`, seção de usuário. Aqui os dois caches são
 * compartilhados pela instalação — duas pessoas com o mesmo filme dividem um
 * arquivo de arte —, e limpá-los gasta a cota de requisição, que também é.
 *
 * **São DUAS linhas porque são dois caches**, e limpar um não é limpar o outro:
 * quem quer espaço em disco quer a arte, quem quer catálogo atualizado quer as
 * respostas. Uma linha só, com um botão só, esconderia a diferença.
 *
 * **Nenhuma das duas é destrutiva**, e é isso que as separa do apagar a
 * biblioteca: as duas jogam fora dado DERIVADO, que volta sozinho. Por isso não
 * há confirmação — o passo a mais custaria um clique e não devolveria nada.
 */
export function StorageSection() {
  const storage = useStorage()
  const clear = useClearCache()
  const isLoading = useDelayedPending(storage.isPending)

  const data = storage.data ?? null
  /**
   * Qual das duas está sendo limpa. `clear.variables` é o argumento da mutação
   * em voo — ler dali é o que impede as duas linhas de entrarem em `Clearing…`
   * ao mesmo tempo, sem um segundo estado que precisaria concordar com este.
   */
  const clearing = clear.isPending ? clear.variables : null

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.storage}
        body={copy.body}
        Icon={HardDrive}
      />

      {storage.isError && (
        <ProvidersError
          error={storage.error}
          onRetry={() => storage.refetch()}
        />
      )}

      {!storage.isError && (
        <section className="flex flex-col">
          {isLoading && (
            <>
              <CacheRowSkeleton />
              <CacheRowSkeleton />
            </>
          )}

          {!isLoading && data && (
            <>
              <CacheRow
                title={copy.providerCache.title}
                body={copy.providerCache.body}
                held={
                  data.providerCache.responses === 0
                    ? copy.providerCache.empty
                    : copy.providerCache.held(
                        countOf(
                          data.providerCache.responses,
                          copy.providerCache.count,
                        ),
                        formatBytes(data.providerCache.bytes),
                      )
                }
                empty={data.providerCache.responses === 0}
                kind="provider"
                clearing={clearing}
                onClear={clear.mutate}
              />

              <CacheRow
                title={copy.artCache.title}
                body={copy.artCache.body}
                held={
                  data.artCache.files === 0
                    ? copy.artCache.empty
                    : copy.artCache.held(
                        countOf(data.artCache.files, copy.artCache.count),
                        formatBytes(data.artCache.bytes),
                        formatBytes(data.artCache.limitBytes),
                      )
                }
                empty={data.artCache.files === 0}
                kind="art"
                clearing={clearing}
                onClear={clear.mutate}
              />

              {/* A terceira coisa que NÃO se apaga aqui. Ela entra porque a
               * pergunta nasce olhando as duas linhas acima. */}
              <p className="mt-4 max-w-prose text-faint text-xs">
                {copy.snapshots}
              </p>

              {clear.isError && (
                <p className="mt-2 text-danger text-xs">{copy.failed}</p>
              )}
            </>
          )}
        </section>
      )}
    </>
  )
}

/**
 * Uma linha de cache. Divisória entre as linhas, nunca caixa — o painel já é um
 * container, e caixa dentro de container é o "card dentro de card" que Settings
 * recusa (`section-header.tsx`).
 */
function CacheRow({
  title,
  body,
  held,
  empty,
  kind,
  clearing,
  onClear,
}: {
  title: string
  body: string
  held: string
  empty: boolean
  kind: CacheKind
  clearing: CacheKind | null | undefined
  onClear: (kind: CacheKind) => void
}) {
  const isClearing = clearing === kind

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-line border-b py-4 first:pt-0 last:border-b-0">
      <div className="min-w-0">
        <p className="font-medium text-ink text-sm">{title}</p>
        <p className="mt-1 max-w-prose text-muted text-sm">{body}</p>
        {/* O número mora na linha, antes do clique: é ele que diz se limpar
         * vale a pena. */}
        <p className="mt-1 text-faint text-xs">{held}</p>
      </div>

      {/* Cache vazio não tem o que limpar, e a recusa se anuncia antes do
       * clique — o botão fica, desabilitado, porque sumir faria a linha mudar
       * de forma toda vez que o cache esvaziasse. */}
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        disabled={empty || Boolean(clearing)}
        onClick={() => onClear(kind)}
      >
        {isClearing ? copy.clearing : copy.action}
      </Button>
    </div>
  )
}

function CacheRowSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4 border-line border-b py-4 first:pt-0 last:border-b-0">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-raised" />
        <div className="h-3 w-72 animate-pulse rounded-sm bg-raised" />
        <div className="h-3 w-24 animate-pulse rounded-sm bg-raised" />
      </div>
      <div className="h-9 w-20 shrink-0 animate-pulse rounded-md bg-raised" />
    </div>
  )
}

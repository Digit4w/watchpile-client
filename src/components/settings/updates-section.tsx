import { ArrowUpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  useCheckNow,
  useDownloadUpdate,
  useInstallUpdate,
  useSetUpdateCheck,
} from '@/hooks/mutations/updates/use-update-actions'
import { useUpdates } from '@/hooks/queries/updates/use-updates'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { formatBytes, formatRelativeTime } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'
import { ProvidersError } from './provider-list'
import { SectionHeader } from './section-header'

const copy = settingsCopy.updates

const CHECK_LABEL_ID = 'updates-check-toggle'

/**
 * `THIS INSTANCE / Updates` — 10/09/2026 (brief, 3.9).
 *
 * **Do admin, caminho inteiro**, como `Storage` e `Network`: atualizar é
 * infraestrutura da instalação, e a versão que todo mundo lê fica em `About`,
 * que é de ninguém.
 *
 * **A seção NÃO ganha selo na coluna**, e isso é decisão. O contador de 01/09
 * conta condição de objeto em uso, colorida pela pior severidade — e uma versão
 * nova é `info`: nada está quebrado. *O barulho do sinal acompanha o tamanho do
 * fato*, e o sino já anuncia. Um segundo sinal permanente pra algo que
 * funciona é a régua do sinal virada contra si mesma.
 *
 * ── A tela troca de CONTEÚDO, nunca de posição ─────────────────────────────
 * A régua de 09/09: *controle cuja existência depende do estado é controle que
 * não se aprende*. `Check now` e o toggle ficam sempre; o que muda é a linha do
 * meio — em dia, versão nova, baixando, pronta, ou a explicação de que esta
 * instalação não se atualiza sozinha.
 */
export function UpdatesSection() {
  const updates = useUpdates()
  const setCheck = useSetUpdateCheck()
  const checkNow = useCheckNow()
  const download = useDownloadUpdate()
  const install = useInstallUpdate()
  const isLoading = useDelayedPending(updates.isPending)

  const data = updates.data ?? null

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.updates}
        body={copy.body}
        Icon={ArrowUpCircle}
      />

      {updates.isError && (
        <ProvidersError
          error={updates.error}
          onRetry={() => updates.refetch()}
        />
      )}

      {!updates.isError && (
        <section className="flex flex-col">
          {isLoading && <UpdatesSkeleton />}

          {!isLoading && data && (
            <>
              <div className="flex flex-col gap-1 border-line border-b py-4 first:pt-0">
                <p className="text-faint text-xs uppercase tracking-wide">
                  {copy.installed}
                </p>
                <p className="text-ink text-sm">
                  {data.current ?? copy.unknownVersion}
                </p>
              </div>

              <div className="flex flex-col gap-3 border-line border-b py-4">
                <Status
                  data={data}
                  onDownload={() => download.mutate()}
                  onInstall={() => install.mutate()}
                  downloadPending={download.isPending}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!data.enabled || checkNow.isPending}
                    onClick={() => checkNow.mutate()}
                  >
                    {checkNow.isPending ? copy.checking : copy.checkNow}
                  </Button>
                  {data.checkedAt && (
                    <p className="text-faint text-xs">
                      {copy.checkedAt(formatRelativeTime(data.checkedAt))}
                    </p>
                  )}
                </div>

                {checkNow.isError && (
                  <p className="text-danger text-xs">{copy.checkFailed}</p>
                )}
              </div>

              {/* O toggle é PREFERÊNCIA, e segue a régua de 04/09: sem `Save`,
               * efeito imediato, escrita otimista. É o único gesto desta seção
               * que se comporta assim, e o motivo é o que a peça promete —
               * `role="switch"` anuncia efeito imediato. */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* **`id` e `aria-labelledby`, não `aria-label`** — o
                   * `Switch` declara só o primeiro, e um `aria-label` ali é
                   * DESCARTADO pela peça, com o compilador limpo. É a régua
                   * de 10/09, e ela cobrou de novo aqui: o atributo estava
                   * escrito, plausível, e sem efeito até o teste procurar o
                   * controle pelo nome. */}
                  <p id={CHECK_LABEL_ID} className="text-ink text-sm">
                    {copy.checkToggle.title}
                  </p>
                  <p className="max-w-prose text-muted text-sm">
                    {copy.checkToggle.body}
                  </p>
                </div>
                <Switch
                  checked={data.enabled}
                  aria-labelledby={CHECK_LABEL_ID}
                  onCheckedChange={(next) => setCheck.mutate(next)}
                />
              </div>
            </>
          )}
        </section>
      )}
    </>
  )
}

function Status({
  data,
  onDownload,
  onInstall,
  downloadPending,
}: {
  data: NonNullable<ReturnType<typeof useUpdates>['data']>
  onDownload: () => void
  onInstall: () => void
  downloadPending: boolean
}) {
  if (!data.updateAvailable) {
    /**
     * **"Nunca conferido" não é "conferido e nada novo"**, e a diferença é o
     * que a tela sabe. A segunda frase tranquiliza; a primeira explicaria por
     * que o botão ao lado ainda não foi usado.
     */
    return (
      <p className="text-muted text-sm">
        {data.checkedAt ? copy.upToDate : copy.neverChecked}
      </p>
    )
  }

  const { download } = data

  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink text-sm">
        {copy.available(data.latest ?? copy.unknownVersion)}{' '}
        {data.latestUrl && (
          <a
            className="text-muted underline underline-offset-2 hover:text-ink"
            href={data.latestUrl}
            target="_blank"
            rel="noreferrer"
          >
            {copy.releaseNotes}
          </a>
        )}
      </p>

      {/* **A recusa mora na peça que a causou.** Quem não pode instalar daqui
       * lê isso no lugar do botão, não num banner acima da seção. */}
      {!data.canInstall && (
        <>
          <p className="max-w-prose text-muted text-sm">{copy.cannotInstall}</p>
          <code className="w-fit rounded-sm bg-raised px-2 py-1 text-faint text-xs">
            {copy.dockerHint}
          </code>
        </>
      )}

      {data.canInstall && download.state === 'downloading' && (
        <Progress received={download.received} total={download.total} />
      )}

      {data.canInstall && download.state === 'ready' && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={onInstall}>
            {copy.install}
          </Button>
          {/* A frase de COMO termina vem do servidor, porque termina diferente
           * em cada plataforma e o cliente não pode detectar o ambiente. */}
          {data.installHint && (
            <p className="text-faint text-xs">{data.installHint}</p>
          )}
        </div>
      )}

      {data.canInstall && download.state === 'failed' && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="max-w-prose text-danger text-sm">
            {copy.failed[download.reason ?? 'failed']}
          </p>
          <Button variant="secondary" size="sm" onClick={onDownload}>
            {copy.retry}
          </Button>
        </div>
      )}

      {data.canInstall && download.state === 'idle' && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={downloadPending} onClick={onDownload}>
            {downloadPending ? copy.downloading : copy.download}
          </Button>
          {data.installHint && (
            <p className="text-faint text-xs">{data.installHint}</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * **A BARRA é exceção registrada** (10/09/2026, decisão do dono). A regra de
 * 06/09 diz *progresso de trabalho em segundo plano é número, nunca barra*, e o
 * teste dela é *"o denominador é conhecido E o numerador anda de um em um?"* —
 * num download o denominador é conhecido e o numerador anda aos milhares, então
 * o próprio teste da regra exclui este caso.
 *
 * **Sem `Content-Length` a barra fica indeterminada**, e o texto diz só quanto
 * já veio: fingir uma fração seria a peça afirmando o que ela não sabe.
 */
function Progress({
  received,
  total,
}: {
  received: number | null
  total: number | null
}) {
  const got = received ?? 0
  const pct = total && total > 0 ? Math.min(100, (got / total) * 100) : null

  return (
    <div className="flex max-w-prose flex-col gap-2">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-label={copy.downloading}
        {...(pct === null
          ? {}
          : {
              'aria-valuenow': Math.round(pct),
              'aria-valuemin': 0,
              'aria-valuemax': 100,
            })}
      >
        <div
          className="h-full bg-ink transition-[width] duration-[var(--motion-chrome)] ease-[var(--ease-chrome)]"
          style={{ width: pct === null ? '100%' : `${pct}%` }}
        />
      </div>
      <p className="text-faint text-xs">
        {total === null
          ? copy.progressUnknown(formatBytes(got))
          : copy.progress(formatBytes(got), formatBytes(total))}
      </p>
    </div>
  )
}

function UpdatesSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <span className="h-4 w-32 animate-pulse rounded-sm bg-raised" />
      <span className="h-4 w-64 animate-pulse rounded-sm bg-raised" />
      <span className="h-8 w-28 animate-pulse rounded-sm bg-raised" />
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { ScrollText } from 'lucide-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  copyText,
  flattenFields,
  isAtEnd,
  type LogLevelFilter,
  type LogLine,
  levelLabel,
  levelTone,
  withDaySeparators,
} from '@/domain/log-view'
import { useLogStream } from '@/hooks/queries/logs/use-log-stream'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { HttpError } from '@/infra/lib/http-client'
import { countOf, formatBytes, formatDay, formatTime } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'
import { LOG_DOWNLOAD_URL, type LogUsage } from '@/services/logs'
import { ProvidersError } from './provider-list'
import { SectionHeader } from './section-header'

const copy = settingsCopy.logs

const LEVELS = ['all', 'warn', 'error'] as const

/**
 * `THIS INSTANCE / Logs` — o que este servidor andou fazendo (14/09/2026).
 *
 * Desenhada num mockup de RECORTE no mesmo dia: o shell, a coluna e os botões
 * já existiam, e o que ele desenhou foi o visualizador e os estados dele.
 *
 * **O filtro mora na URL** (`?level=`), porque é recorte e recorte é
 * compartilhável — a mesma régua de `/library`. E a lista é montada com
 * `key={level}`: outro filtro é outra lista, e reconciliar as duas misturaria
 * linhas de recortes diferentes.
 */
export function LogsSection() {
  const [level, setLevel] = useQueryState(
    'level',
    parseAsStringLiteral(LEVELS).withDefault('all'),
  )

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.logs}
        body={copy.body}
        Icon={ScrollText}
      />
      <LogStream key={level} level={level} onLevel={setLevel} />
    </>
  )
}

function LogStream({
  level,
  onLevel,
}: {
  level: LogLevelFilter
  onLevel: (level: LogLevelFilter) => void
}) {
  const stream = useLogStream(level)
  const isLoading = useDelayedPending(stream.isPending)

  /**
   * 403 não é erro: o servidor respondeu certo, e a resposta é que isto é do
   * admin. Por isso não oferece `Try again` — repetir dá 403 de novo.
   */
  if (stream.error instanceof HttpError && stream.error.status === 403) {
    return <Forbidden />
  }
  if (stream.isError) {
    return (
      <ProvidersError error={stream.error} onRetry={() => stream.refetch()} />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FileRow usage={stream.usage} lines={stream.lines} />
      <LevelChips level={level} onLevel={onLevel} />
      <Viewer
        stream={stream}
        level={level}
        isLoading={isLoading}
        onShowAll={() => onLevel('all')}
      />
    </div>
  )
}

/**
 * O arquivo é um RECURSO, e a linha segue a de `Storage`: o título nomeia a
 * coisa, os botões são os verbos, e a contagem fica ao lado.
 *
 * **Os botões ficam em todos os estados**, desabilitados quando não há o que
 * levar: *o que varia é o CONTEÚDO, nunca a posição* (design system, seção 5).
 */
function FileRow({
  usage,
  lines,
}: {
  usage: LogUsage | null
  lines: readonly LogLine[]
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )

  useEffect(() => {
    if (copyState !== 'copied') {
      return
    }
    const id = setTimeout(() => setCopyState('idle'), 2000)
    return () => clearTimeout(id)
  }, [copyState])

  async function copyVisible() {
    try {
      await navigator.clipboard.writeText(copyText(lines, formatTime))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const hasFiles = (usage?.files ?? 0) > 0

  return (
    <section className="flex flex-wrap items-start justify-between gap-4 border-line border-b pb-4">
      <div className="min-w-0">
        <p className="font-medium text-ink text-sm">{copy.file.title}</p>
        <p className="mt-1 max-w-prose text-muted text-sm">{copy.file.body}</p>
        {/* Sem o número enquanto ele não chegou: número que aparece sozinho
         * embaixo de um botão parece defeito. */}
        {usage && (
          <p className="mt-1 text-faint text-xs">
            {hasFiles
              ? copy.file.held(
                  countOf(usage.files, copy.file.count),
                  formatBytes(usage.bytes),
                  formatBytes(usage.limitBytes),
                )
              : copy.file.empty}
          </p>
        )}
        {copyState === 'failed' && (
          <p className="mt-1 text-danger text-xs">{copy.copyFailed}</p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {/* `min-w-20`: trocar `Copy` por `Copied` não pode mexer no vizinho. */}
        <Button
          type="button"
          variant="outline"
          className="min-w-20"
          disabled={lines.length === 0}
          onClick={copyVisible}
        >
          {copyState === 'copied' ? copy.copied : copy.copy}
        </Button>
        {hasFiles ? (
          // Destino é endereço: quem nomeia o arquivo é o servidor.
          <Button asChild variant="outline">
            <a href={LOG_DOWNLOAD_URL} download>
              {copy.download}
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            {copy.download}
          </Button>
        )}
      </div>
    </section>
  )
}

const CHIP_ON =
  'relative flex h-11 shrink-0 items-center gap-1.5 rounded-sm border border-ink bg-ink px-3 text-sm text-surface md:h-9'
const CHIP_OFF =
  'relative flex h-11 shrink-0 items-center gap-1.5 rounded-sm border border-line px-3 text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink md:h-9'

/**
 * `All · Warnings · Errors`, CUMULATIVOS por gravidade (decisão do dono). Nível
 * é enum fixo, então a fileira não se mede nem transborda — ao contrário da de
 * tipos de `/library`, que não tem teto.
 */
function LevelChips({
  level,
  onLevel,
}: {
  level: LogLevelFilter
  onLevel: (level: LogLevelFilter) => void
}) {
  return (
    <fieldset className="mt-4 mb-3 flex items-center gap-2">
      <legend className="sr-only">{copy.levelsLabel}</legend>
      {LEVELS.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={value === level}
          className={value === level ? CHIP_ON : CHIP_OFF}
          onClick={() => onLevel(value)}
        >
          {copy.levels[value]}
        </button>
      ))}
    </fieldset>
  )
}

type Stream = ReturnType<typeof useLogStream>

/**
 * O visualizador.
 *
 * ── Acompanha só COLADO NO FIM ──────────────────────────────────────────────
 * Decisão do dono, e exceção consciente a *a lista não se reordena sob a mão*:
 * com a rolagem no fim a caixa desce sozinha, que é como se lê um log vivo.
 * Rolando pra cima ela para, e as linhas que chegam não mexem no que se lê — a
 * peça de vidro diz quantas chegaram e leva ao fim.
 *
 * ── `Load older` não empurra o que se lê ────────────────────────────────────
 * As mais antigas entram no COMEÇO. Sem compensar, o conteúdo inteiro desceria
 * pela altura do que entrou, bem sob o olho de quem pediu. A rolagem é mantida
 * à mesma distância do FIM, que é a âncora que não se mexe.
 */
function Viewer({
  stream,
  level,
  isLoading,
  onShowAll,
}: {
  stream: Stream
  level: LogLevelFilter
  isLoading: boolean
  onShowAll: () => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const atEnd = useRef(true)
  const heightBefore = useRef(0)
  const firstBefore = useRef<number | undefined>(undefined)
  const [seen, setSeen] = useState(0)

  const { lines, newerCount } = stream
  const firstTime = lines[0]?.time

  /**
   * **UM efeito, e não dois — e a ordem entre eles era o defeito.** A primeira
   * versão tinha um efeito que acompanhava o fim e outro que compensava o
   * `Load older`. Efeitos rodam na ordem em que são declarados, então o
   * primeiro gravava a altura NOVA antes de o segundo medir quanto ela cresceu,
   * e a compensação dava zero: o conteúdo descia sob o olho de quem pediu as
   * linhas antigas. Nenhum teste pega isso — o jsdom não faz layout.
   *
   * Três casos, e só um mexe na rolagem sem ser pedido:
   * - **colado no fim**: acompanha, e o que chegou conta como visto
   * - **longe do fim e o COMEÇO mudou** (`Load older`): soma o que cresceu, e o
   *   que se lia fica à mesma distância do fim
   * - **longe do fim e só chegou linha no fim**: nada — conteúdo acrescentado
   *   embaixo não move o que está na tela
   *
   * `lines.length` entra nas dependências de propósito: é ele que muda quando a
   * página inicial chega, e é aí que a caixa precisa descer até o fim.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: `lines.length` dispara o primeiro fim, ver acima
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) {
      return
    }
    if (atEnd.current) {
      box.scrollTop = box.scrollHeight
      setSeen(newerCount)
    } else if (firstTime !== firstBefore.current) {
      box.scrollTop += box.scrollHeight - heightBefore.current
    }
    firstBefore.current = firstTime
    heightBefore.current = box.scrollHeight
  }, [lines.length, newerCount, firstTime])

  function onScroll() {
    const box = boxRef.current
    if (!box) {
      return
    }
    atEnd.current = isAtEnd(box)
    if (atEnd.current) {
      setSeen(newerCount)
    }
  }

  function jumpToEnd() {
    const box = boxRef.current
    if (box) {
      box.scrollTop = box.scrollHeight
    }
    atEnd.current = true
    setSeen(newerCount)
  }

  const unseen = atEnd.current ? 0 : newerCount - seen
  const items = useMemo(() => withDaySeparators(lines), [lines])
  const empty = !stream.isPending && lines.length === 0

  return (
    <div className="relative flex min-h-80 flex-1 flex-col overflow-hidden rounded-lg ring-1 ring-line">
      <div className="flex min-h-9 items-center justify-between gap-3 border-line border-b bg-card px-3 py-2">
        <p className="text-faint text-xs">
          {lines.length > 0 &&
            copy.showing(countOf(lines.length, copy.lineCount))}
        </p>
        {stream.hasOlder && (
          <button
            type="button"
            className="text-faint text-xs underline-offset-2 hover:text-ink hover:underline disabled:opacity-[var(--opacity-disabled)]"
            disabled={stream.loadingOlder}
            onClick={stream.loadOlder}
          >
            {stream.loadingOlder ? copy.loadingOlder : copy.loadOlder}
          </button>
        )}
      </div>
      {stream.olderFailed && (
        <p className="border-line border-b px-3 py-1 text-danger text-xs">
          {copy.olderFailed}
        </p>
      )}

      <div
        ref={boxRef}
        onScroll={onScroll}
        className="scrollbar-styled min-h-0 flex-1 overflow-y-auto py-2 font-mono text-xs leading-5"
      >
        {isLoading && <Skeleton />}

        {empty && level !== 'all' && (
          <EmptyState
            title={copy.emptyFiltered[level]}
            body={copy.emptyFiltered.body}
            action={
              <Button type="button" variant="outline" onClick={onShowAll}>
                {copy.emptyFiltered.action}
              </Button>
            }
          />
        )}
        {empty && level === 'all' && (
          <EmptyState title={copy.empty.title} body={copy.empty.body} />
        )}

        {items.map((item, index) =>
          item.kind === 'day' ? (
            <p
              key={`day-${item.day}`}
              className="px-3 pt-3 pb-1 font-sans text-faint text-xs first:pt-1"
            >
              {formatDay(item.day)}
            </p>
          ) : (
            <LogRow key={rowKey(item.line, index)} line={item.line} />
          ),
        )}
      </div>

      {unseen > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <button
            type="button"
            onClick={jumpToEnd}
            className="pointer-events-auto rounded-full bg-glass px-3 py-1.5 font-medium text-ink text-xs ring-1 ring-line backdrop-blur"
          >
            {countOf(unseen, copy.newLines)} ↓
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * A chave de uma linha é o que ela É, e não a posição: `Load older` põe linhas
 * no começo, e uma chave por índice faria a stack aberta pular de linha. O
 * índice só entra como desempate de duas linhas idênticas no mesmo milissegundo.
 */
function rowKey(line: LogLine, index: number): string {
  return `${line.time}:${line.level}:${line.msg}:${index}`
}

const TONE = {
  danger: 'text-danger',
  warning: 'text-warning',
  quiet: 'text-faint',
} as const

/**
 * Uma linha: hora e nível são COLUNAS DE VALOR, com largura fixa e sem quebra;
 * a mensagem é PROSA e quebra dentro da própria coluna, nunca com rolagem
 * horizontal (decisão do dono). O nível é peça: só o rótulo ganha cor, e a
 * mensagem fica em `ink` em todos.
 */
function LogRow({ line }: { line: LogLine }) {
  const [open, setOpen] = useState(false)
  const fields = flattenFields(line.fields)
  const detail = line.err?.stack ?? line.err?.message ?? null

  return (
    <div className="flex gap-3 px-3 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised">
      <time
        dateTime={new Date(line.time).toISOString()}
        className="w-16 shrink-0 text-faint tabular-nums"
      >
        {formatTime(line.time)}
      </time>
      <span
        className={`w-12 shrink-0 font-medium ${TONE[levelTone(line.level)]}`}
      >
        {levelLabel(line.level)}
      </span>
      <div className="min-w-0 flex-1 break-words">
        <p className="text-ink">{line.msg}</p>
        {fields.length > 0 && <p className="text-faint">{fields.join(' ')}</p>}
        {detail && (
          <>
            <button
              type="button"
              aria-expanded={open}
              className="mt-0.5 text-faint underline-offset-2 hover:text-ink hover:underline"
              onClick={() => setOpen((current) => !current)}
            >
              {open ? copy.hideDetails : copy.showDetails}
            </button>
            {open && (
              <pre className="mt-1 whitespace-pre-wrap break-words border-line border-l pl-3 text-muted">
                {detail}
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * O vazio DENTRO da caixa, sem anel próprio: a caixa já é o container, e anel
 * dentro de anel é o "card dentro de card" que Settings recusa — a primeira
 * captura do mockup mostrou os dois empilhados.
 */
function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center font-sans">
      <p className="font-medium text-base text-ink">{title}</p>
      <p className="max-w-sm text-muted text-sm">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

const SKELETON_WIDTHS = [
  'w-3/5',
  'w-1/2',
  'w-2/3',
  'w-1/3',
  'w-3/5',
  'w-2/5',
  'w-2/3',
  'w-1/3',
]

function Skeleton() {
  return (
    <>
      {SKELETON_WIDTHS.map((width, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: esqueleto estático, sem identidade
          key={index}
          className="flex gap-3 px-3 py-1"
        >
          <div className="h-3 w-16 shrink-0 animate-pulse rounded-sm bg-raised" />
          <div className="h-3 w-12 shrink-0 animate-pulse rounded-sm bg-raised" />
          <div className={`h-3 ${width} animate-pulse rounded-sm bg-raised`} />
        </div>
      ))}
    </>
  )
}

function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-20 text-center ring-1 ring-line">
      <p className="font-medium text-base">{copy.forbidden.title}</p>
      <p className="max-w-sm text-muted text-sm">{copy.forbidden.body}</p>
      <Button asChild variant="outline" className="mt-1">
        <Link to="/settings">{copy.forbidden.back}</Link>
      </Button>
    </div>
  )
}

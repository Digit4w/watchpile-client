import { Link } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { PileGlyph } from '@/components/piles/pile-art'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  isTruncated,
  orderedProblems,
  resultFacts,
  splitSources,
} from '@/domain/import-view'
import { useCancelImport } from '@/hooks/queries/import/use-cancel-import'
import { useImportStatus } from '@/hooks/queries/import/use-import-status'
import {
  useInvalidateAfterImport,
  useStartCsvImport,
  useStartProfileImport,
} from '@/hooks/queries/import/use-start-csv-import'
import { useClimbingNumber } from '@/hooks/use-climbing-number'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { formatNumber, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { importCopy, problemText, sourceName } from '@/routes/-import.copy'
import type {
  ImportJob,
  ImportMode,
  ImportSourceSlug,
  ImportSourceState,
} from '@/services/import'
import { SectionHeader } from './section-header'
import './import-motion.css'

const copy = importCopy

/**
 * `YOU / Import` (brief, 3.12; design system, seções 2, 5, 7 e 8).
 *
 * ── Uma caixa, e não a grade de marcas do mockup ────────────────────────────
 * O desenho de 06/09/2026 tem três fontes — AniList, MyAnimeList e o nosso CSV
 * —, com marca quadrada de 40px em cada, porque *marca de terceiro entra quando
 * o inventário é grande e a tarefa é RECONHECER* (design system, seção 5).
 *
 * **Duas delas não existem no servidor**, e não por decisão nossa: o AniList
 * desativou a própria API em 07/09/2026, e o MyAnimeList não pode ser escrito
 * nem verificado sem um Client ID. Desenhar as três caixas e deixar duas
 * falharem seria *affordance prometendo o que não existe* — a mesma régua que
 * segurou o ladrilho de `/piles` sem navegar até `/piles/:id` nascer.
 *
 * Então a tela mostra a que existe, na forma larga que o mockup já reservava
 * pra ela: o CSV é o nosso formato, não um serviço a reconhecer, e ocupava a
 * fileira inteira mesmo quando havia três. O vocabulário da grade fica no
 * design system, esperando a segunda fonte.
 *
 * ── A ordem em que os estados são testados é decisão de design ──────────────
 * Erro antes do esqueleto, porque quem já falhou não está mais esperando
 * (design system, seção 8). E o job rodando vem antes do formulário, porque
 * enquanto ele existe o formulário não tem o que oferecer.
 */
export function ImportSection() {
  const status = useImportStatus()
  const isLoading = useDelayedPending(status.isPending)
  const invalidate = useInvalidateAfterImport()

  const running = status.data?.running ?? null
  const mine = status.data?.mine ?? false
  const latest = status.data?.latest ?? null

  /**
   * Quando o job termina, a biblioteca e o sino mudaram — e quem repara nisso é
   * o poll, não a mutação: a rota responde 202 e nesse instante nada entrou.
   *
   * `ref` e não `state` porque o efeito não deve reagir ao próprio resultado;
   * ele só compara o id que estava rodando com o que está agora.
   */
  const wasRunning = useRef<number | null>(null)
  useEffect(() => {
    const before = wasRunning.current
    wasRunning.current = running?.id ?? null

    if (before !== null && running === null) {
      invalidate()
    }
  }, [running, invalidate])

  return (
    <>
      <SectionHeader title={copy.title} body={copy.body} Icon={Download} />

      {status.isError && (
        <Panel
          title={copy.error.title}
          body={copy.error.body}
          tone="danger"
          action={
            <Button variant="outline" onClick={() => status.refetch()}>
              {copy.error.retry}
            </Button>
          }
        />
      )}

      {!status.isError && isLoading && <ImportSkeleton />}

      {status.isSuccess && (
        <div className="flex flex-col gap-6">
          {running ? (
            <RunningCard job={running} mine={mine} />
          ) : (
            <StartForm sources={status.data?.sources ?? []} />
          )}
          {latest && !running && <ResultBlock job={latest} />}
        </div>
      )}
    </>
  )
}

/* ── O formulário ─────────────────────────────────────────────────────────── */

function StartForm({ sources }: { sources: ImportSourceState[] }) {
  const [mode, setMode] = useState<ImportMode>('skip')
  const { services, csv } = splitSources(sources)

  return (
    <div className="flex flex-col gap-6">
      <ModeChoice mode={mode} onChange={setMode} />

      {/*
        Uma caixa por fonte, **em grade de duas colunas com o CSV ocupando a
        fileira inteira** (design system, seção 5, 06/09/2026): três caixas numa
        grade de duas deixam uma órfã, e a terceira é a NOSSA — arquivo, não
        serviço. Ocupar a fileira toda diz isso sem uma palavra a mais.

        **O servidor diz QUAIS fontes existem; a tela diz como elas se arrumam.**
        Renderizar na ordem do array dele — que é a ordem em que ele as declara,
        não uma decisão de layout — empilhou as três em coluna única por dois
        dias, com o CSV em primeiro. Ler a decisão do servidor é o certo; herdar
        dele uma que ele não tomou, não.
      */}
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((source) => (
          <ProfileBox key={source.slug} source={source} mode={mode} />
        ))}
        {csv && <CsvBox key={csv.slug} mode={mode} />}
      </div>
    </div>
  )
}

/** A moldura de uma fonte: marca, nome, linha, e o que a fonte pede. */
function SourceBox({
  slug,
  dimmed,
  className,
  children,
}: {
  slug: ImportSourceSlug
  dimmed?: boolean
  className?: string
  children: ReactNode
}) {
  const name = copy.sources[slug].name

  return (
    <article
      /**
       * **`cn` e não template literal.** A primeira versão concatenava
       * `` `... ring-line${dimmed ? ' opacity-…' : ''}` ``, e o formatador
       * reflowou a interpolação para outra linha levando o espaço junto: a
       * classe saiu `ring-lineopacity-[var(--opacity-disabled)]`.
       *
       * Uma causa, dois sintomas — `ring-line` deixou de existir, então a caixa
       * pegou o anel CLARO padrão do Tailwind (parecendo destacada, o oposto de
       * indisponível), e não desbotou. Nada acusa: não é erro de tipo, não é
       * erro de lint, e o diff não mostra um espaço a menos dentro de uma
       * string.
       */
      className={cn(
        'flex flex-col gap-4 rounded-lg p-4 ring-1 ring-line',
        dimmed && 'opacity-[var(--opacity-disabled)]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <BrandTile slug={slug} />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink text-sm">{name}</p>
          <p className="truncate text-faint text-xs">
            {copy.sources[slug].line}
          </p>
        </div>
      </div>
      {children}
    </article>
  )
}

/**
 * A fileira da AÇÃO, no rodapé da caixa.
 *
 * ── Por que o botão não fica ao lado do controle ────────────────────────────
 * Ficava, e nasceu certo: com a caixa ocupando a largura toda, controle e botão
 * cabiam na mesma linha com folga. Na grade de duas colunas a caixa tem metade
 * disso, e a linha passou a ter um COLUNA de duas alturas do lado esquerdo — o
 * controle em cima, a dica embaixo. `items-center` então centra o botão contra
 * as DUAS linhas, e ele para no vão entre elas: alinhado com o controle, não;
 * com a dica, também não. **Peça alinhada ao centro de um bloco de duas alturas
 * não se alinha com nenhuma delas.**
 *
 * ── `mt-auto`, e é ele que faz as caixas vizinhas concordarem ───────────────
 * As duas caixas de serviço têm alturas de conteúdo diferentes (uma tem campo,
 * a outra tem uma frase de recusa), e numa grade elas esticam até a altura da
 * fileira. Sem `mt-auto` cada botão pararia logo abaixo do próprio conteúdo, em
 * alturas diferentes; com ele, os dois descem para a base e ficam na mesma
 * linha — que é o que o desenho mostrava.
 */
function ActionRow({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex justify-end">{children}</div>
}

function CsvBox({ mode }: { mode: ImportMode }) {
  const [file, setFile] = useState<File | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const start = useStartCsvImport()

  return (
    /*
      A fileira inteira, e o motivo é o que a caixa É: o CSV é o nosso formato,
      não um serviço a reconhecer. **A forma de uma peça vem do que ela é, não
      de quantas vizinhas ela tem hoje** (design system, seção 8, décima quinta
      leva) — foi por isso que ela ficou larga quando era a única, e é por isso
      que continua larga agora que tem duas ao lado.
    */
    <SourceBox slug="csv" className="sm:col-span-2">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            onClick={() => input.current?.click()}
            className="shrink-0"
          >
            {copy.csv.choose}
          </Button>
          <span
            className={
              file ? 'truncate text-muted text-xs' : 'text-faint text-xs'
            }
          >
            {file ? file.name : copy.csv.noFile}
          </span>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <p className="max-w-prose text-faint text-xs">{copy.csv.columns}</p>
      </div>

      <ActionRow>
        <Button
          disabled={!file || start.isPending}
          onClick={() => {
            if (file) {
              start.mutate({ file, mode })
            }
          }}
        >
          {copy.csv.start}
        </Button>
      </ActionRow>
    </SourceBox>
  )
}

/**
 * Uma fonte de serviço — nome de usuário, sem OAuth.
 *
 * **Indisponível vira caixa desbotada com o MOTIVO**, não caixa ausente: a
 * recusa se anuncia antes do clique e mora na peça que a causou (design system,
 * seção 5). E `opacity` fica na CAIXA ou na peça, nunca nas duas — 0,7 × 0,7 dá
 * 0,49, abaixo de tudo que a medição de 04/09 aprovou.
 */
function ProfileBox({
  source,
  mode,
}: {
  source: ImportSourceState
  mode: ImportMode
}) {
  const [username, setUsername] = useState('')
  const start = useStartProfileImport()
  const slug = source.slug as 'anilist' | 'mal'
  const name = copy.sources[slug].name

  if (!source.available) {
    const why = source.reason ? copy.unavailable[source.reason] : null
    return (
      <SourceBox slug={slug} dimmed>
        <p className="max-w-prose text-muted text-xs">{why?.body}</p>
        {/*
          A saída oferecida é PARTE da frase, e oferecer a errada custa mais
          que não oferecer nenhuma: `unverified` não tem o que configurar,
          então não ganha botão.
        */}
        {why?.action && (
          <ActionRow>
            <Button variant="outline" asChild>
              <Link to={why.action.to}>{why.action.label}</Link>
            </Button>
          </ActionRow>
        )}
      </SourceBox>
    )
  }

  return (
    <SourceBox slug={slug}>
      <div className="flex min-w-0 flex-col gap-2">
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={copy.profile.placeholder(name)}
          className="w-full"
        />
        <p className="text-faint text-xs">{copy.profile.hint}</p>
      </div>

      <ActionRow>
        <Button
          disabled={username.trim() === '' || start.isPending}
          onClick={() =>
            start.mutate({ source: slug, username: username.trim(), mode })
          }
        >
          {copy.profile.start}
        </Button>
      </ActionRow>
    </SourceBox>
  )
}

/**
 * A regra de colisão — **chip par, não toggle**.
 *
 * O toggle é liga/desliga (design system, seção 5); aqui nenhum dos dois lados
 * é "off", são duas regras nomeadas, e escolher entre valores é o que o chip
 * faz. A dica troca junto porque é ela que diz o que a escrita toca.
 */
function ModeChoice({
  mode,
  onChange,
}: {
  mode: ImportMode
  onChange: (mode: ImportMode) => void
}) {
  return (
    <div className="flex flex-col gap-2 border-line border-b pb-6">
      <p className="text-muted text-sm">{copy.mode.label}</p>
      {/*
        `aria-pressed`, como os chips de `/library`, e não `role="radio"`: o
        vocabulário do app pra "escolha entre valores" já é esse, e um radio de
        verdade traria comportamento de teclado que os outros chips não têm.
      */}
      <div className="flex flex-wrap gap-2">
        {(['skip', 'overwrite'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => onChange(value)}
            className={cn(
              'inline-flex h-8 items-center rounded-sm px-3 font-medium text-sm transition-colors duration-[var(--motion-micro)] ease-chrome',
              mode === value
                ? 'bg-ink text-surface'
                : 'text-muted ring-1 ring-line hover:bg-raised hover:text-ink',
            )}
          >
            {copy.mode[value]}
          </button>
        ))}
      </div>
      <p className="text-faint text-xs">{copy.mode.hint[mode]}</p>
    </div>
  )
}

/**
 * A marca da fonte — 40px, a mesma caixa da miniatura de linha de `/piles`
 * (design system, seção 5, 06/09/2026), com a mesma escada de identidade.
 *
 * O glifo é o `PileGlyph`, **reusado e não recopiado**: é o símbolo de quatro
 * peças da marca (design system, seção 10), o mesmo que a pilha vazia usa. Duas
 * contas da mesma coisa é como uma fica pra trás (seção 8) — e aqui o desenho
 * seria idêntico, byte a byte.
 *
 * Marca de terceiro entra quando a segunda fonte existir; o CSV é o nosso
 * formato, não um serviço a reconhecer.
 */
function BrandTile({ slug }: { slug: ImportSourceSlug }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-raised to-line font-medium text-faint text-sm"
      aria-hidden="true"
    >
      {/*
        **A escada de identidade, e o MyAnimeList para no degrau da inicial de
        propósito.** O contrato deles (seção 17) proíbe incluir as marcas em
        "Your Applications", com uma exceção só: atribuir a fonte, e o exemplo
        que eles dão é uma FRASE. É exatamente o caso que o design system
        previu — "um brand que não se possa empacotar simplesmente não tem
        logo, e a tela continua inteira".

        O CSV é o NOSSO formato, então ele usa o símbolo da marca.
      */}
      {slug === 'csv' ? <PileGlyph size={20} /> : copy.sources[slug].name[0]}
    </span>
  )
}

/* ── O job rodando ────────────────────────────────────────────────────────── */

function RunningCard({ job, mine }: { job: ImportJob; mine: boolean }) {
  const cancel = useCancelImport()
  const stopping = job.cancelRequestedAt !== null

  /**
   * O poll é de 2s e o executor escreve os contadores uma vez por lote de 200:
   * sem isto o número fica parado dois segundos e salta quatrocentos. Ele sobe
   * do valor ANTERIOR ao ATUAL, os dois confirmados pelo servidor — re-temporiza
   * números que já existiram, e nunca inventa os que ainda não.
   */
  const climbing = useClimbingNumber(job.processed)

  return (
    <div className="wp-import-in flex flex-col gap-3 rounded-lg p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandTile slug={job.source} />
          <div className="min-w-0">
            <p className="font-medium text-ink text-sm">
              {copy.running.title(sourceName(job.source))}
            </p>
            <p className="text-faint text-xs">
              {formatRelativeTime(job.startedAt)}
            </p>
          </div>
        </div>
        {/*
          **Progresso é NÚMERO, nunca barra** (design system, seção 2): o dado
          real é um inteiro discreto, e obras se contam uma a uma.
          `tabular-nums` porque o número não pode dançar enquanto sobe.

          Enquanto o total é nulo a fonte ainda está sendo LIDA, e ali não há
          denominador nenhum — nem barra, que desenharia uma fração desconhecida,
          nem `0 / 0`, que afirmaria um total. Uma frase com um pulso ao lado diz
          o que está acontecendo sem afirmar quanto falta.
        */}
        {job.total === null ? (
          <p className="flex items-center gap-2 text-muted text-sm">
            <span
              aria-hidden
              className="wp-import-pulse size-1.5 rounded-full bg-ink"
            />
            {copy.running.reading}
          </p>
        ) : (
          <p className="font-mono text-ink text-sm tabular-nums">
            {copy.running.counter(climbing, job.total)}
          </p>
        )}
      </div>

      <p className="max-w-prose text-muted text-sm">
        {mine ? copy.running.body : copy.running.someoneElse}
      </p>

      {mine && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={stopping || cancel.isPending}
            onClick={() => cancel.mutate(job.id)}
          >
            {stopping ? copy.running.stopping : copy.running.stop}
          </Button>
        </div>
      )}
    </div>
  )
}

/* ── O resultado ──────────────────────────────────────────────────────────── */

function ResultBlock({ job }: { job: ImportJob }) {
  /**
   * **Ordenada pela LINHA do arquivo, não pela ordem em que foram achados.**
   *
   * O servidor grava os problemas de LEITURA antes dos do aplicador, porque é
   * nessa ordem que ele os encontra — e a lista saía `6, 7, 9, 8`. Isso só
   * aparece com a tela rodando: quem lê esta lista está procurando qual linha
   * do próprio arquivo consertar, e uma lista que pula pra trás obriga a
   * varrê-la inteira pra ter certeza de não ter perdido nenhuma.
   *
   * Ordenar aqui e não no servidor porque a ordem de lá é DADO — ela diz em que
   * fase o problema apareceu, o que é verdade. O que a tela precisa é outra
   * leitura do mesmo conjunto.
   */
  const problems = orderedProblems(job.problems)
  const stored = problems.length
  const facts = resultFacts(job)

  return (
    /*
      O resultado entra com o mesmo movimento da caixa que rodava: ele aparece
      no lugar dela, e entrar é o que diz de onde a peça veio.
    */
    <section className="wp-import-in flex flex-col gap-4 border-line border-t pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium text-ink text-sm">
          {job.status === 'failed'
            ? copy.failed.title(sourceName(job.source))
            : copy.result.title}
        </h2>
        <p className="text-faint text-xs">
          {copy.result.when(
            sourceName(job.source),
            formatRelativeTime(job.finishedAt ?? job.startedAt),
          )}
        </p>
      </div>

      {/*
        **O MOTIVO fica aqui, e não só no sino.** A versão anterior deste bloco
        mostrava só "didn't run", com um comentário dizendo que a frase já viajava
        pela notificação — o que era verdade e mesmo assim errado: quem acabou de
        clicar `Import` está olhando ESTA tela, e o motivo ficava a um painel de
        distância, num sino que a pessoa pode nem ter aberto.

        A recusa mora na peça que a causou (design system, seção 5), e o job que
        falhou é a peça. A frase vem de `importCopy`, a mesma que o sino usa.
      */}
      {job.status === 'failed' && (
        <p className="max-w-prose text-muted text-sm">
          {copy.failed.why(job.errorKind ?? '')}
        </p>
      )}

      {/*
        Quais números aparecem é `domain/import-view.ts` quem diz — inclusive o
        "nenhum", que é o caso do job que não chegou a rodar.
      */}
      {facts.length > 0 && (
        <div className="flex flex-col">
          {facts.map((fact) => (
            <Fact
              key={fact}
              label={copy.result[fact]}
              value={job[fact]}
              body={
                fact === 'unmatched'
                  ? copy.result.unmatchedBody(job.source)
                  : fact === 'added'
                    ? undefined
                    : copy.result[`${fact}Body`]
              }
            />
          ))}
        </div>
      )}

      {job.problemCount > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-muted text-sm">
            {copy.result.problems(job.problemCount)}
          </p>
          {/*
            A lista ROLA dentro de si em vez de empurrar a página: ela não tem
            teto de conteúdo, e um CSV ruim produz um problema por linha.
          */}
          <ul className="scrollbar-styled max-h-64 overflow-y-auto rounded-md px-3 ring-1 ring-line">
            {problems.map((problem, index) => (
              <li
                // A lista é imutável e sem ordem própria — o índice é a única
                // identidade que estas linhas têm.
                key={`${problem.kind}-${problem.row ?? index}`}
                className="border-line border-b py-2 text-muted text-sm last:border-b-0"
              >
                {problemText(problem)}
              </li>
            ))}
          </ul>
          {/* A lista tem teto; a contagem não. A tela diz qual das duas está vendo. */}
          {isTruncated(stored, job.problemCount) && (
            <p className="text-faint text-xs">
              {copy.result.truncated(stored, job.problemCount)}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function Fact({
  label,
  value,
  body,
}: {
  label: string
  value: number
  body?: string
}) {
  return (
    <div className="flex flex-col gap-1 border-line border-b py-4 first:pt-0 last:border-b-0">
      <p className="text-faint text-xs uppercase tracking-wide">{label}</p>
      <p className="font-mono text-ink text-sm tabular-nums">
        {formatNumber(value)}
      </p>
      {body && <p className="max-w-prose text-muted text-sm">{body}</p>}
    </div>
  )
}

/* ── Estados ──────────────────────────────────────────────────────────────── */

function Panel({
  title,
  body,
  tone,
  action,
}: {
  title: string
  body: string
  tone?: 'danger'
  action?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-20 text-center ring-1',
        tone === 'danger' ? 'ring-danger/40' : 'ring-line',
      )}
    >
      <p className="font-medium text-base">{title}</p>
      <p className="max-w-sm text-muted text-sm">{body}</p>
      {action}
    </div>
  )
}

function ImportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 border-line border-b pb-6">
        <div className="h-3 w-48 animate-pulse rounded-sm bg-raised" />
        <div className="h-8 w-40 animate-pulse rounded-sm bg-raised" />
      </div>
      <div className="flex flex-col gap-4 rounded-lg p-4 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 animate-pulse rounded-md bg-raised" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-24 animate-pulse rounded-sm bg-raised" />
            <div className="h-2.5 w-40 animate-pulse rounded-sm bg-raised" />
          </div>
        </div>
        <div className="h-9 animate-pulse rounded-md bg-raised" />
      </div>
    </div>
  )
}

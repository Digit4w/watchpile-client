import { Link } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  isTruncated,
  orderedProblems,
  resultFacts,
  splitSources,
} from '@/domain/import-view'
import {
  useInvalidateAfterRefresh,
  useRefreshLibrary,
} from '@/hooks/mutations/entries/use-refresh-library'
import { useCancelImport } from '@/hooks/queries/import/use-cancel-import'
import {
  useClearHistory,
  useDismissJob,
  useFillMissing,
} from '@/hooks/queries/import/use-import-actions'
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
  const enriching = status.data?.enriching ?? null
  const runningSourced = sourced(running)
  const enrichingSourced = sourced(enriching)
  const latestSourced = sourced(status.data?.latest ?? null)
  const mine = status.data?.mine ?? false

  /**
   * Qual trabalho a peça mostra, e a ORDEM da escolha é a regra: o import ganha
   * do aquecimento porque é o que acabou de ser pedido. Sem trabalho nenhum ela
   * não existe, e o formulário fica com a tela inteira.
   */
  const work = runningSourced
    ? ({ job: runningSourced, phase: 'import', mine } as const)
    : enrichingSourced
      ? ({ job: enrichingSourced, phase: 'enrich', mine: true } as const)
      : null
  const refreshing = status.data?.refreshing ?? null
  const invalidateAfterRefresh = useInvalidateAfterRefresh()

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

  /**
   * O mesmo mecanismo para a varredura, e **ele precisa ser próprio**: o fim
   * dela muda a biblioteca (os totais) e o do import muda outra coisa. Um
   * efeito só, olhando os dois, invalidaria as chaves erradas na metade dos
   * casos.
   *
   * Aqui o gatilho é o `status` deixar de ser `running` — e não a linha sumir,
   * porque a varredura **fica na tela depois de terminar** para mostrar o
   * resultado.
   */
  const wasRefreshing = useRef(false)
  useEffect(() => {
    const before = wasRefreshing.current
    const now = refreshing?.status === 'running'
    wasRefreshing.current = now

    if (before && !now) {
      invalidateAfterRefresh()
    }
  }, [refreshing, invalidateAfterRefresh])

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
          {/**
           * **A peça de trabalho tem UM lugar, e as duas fases ocupam o mesmo.**
           *
           * Ela é a MESMA peça na segunda fase — não uma peça irmã —, e é isso
           * que faz o aquecimento nascer onde já estava em vez de aparecer do
           * nada embaixo de um resultado que disse que tudo acabou. A `key`
           * comum é o que diz isso ao React: sem ela as duas são elementos em
           * posições diferentes, o instante da troca desmonta uma e monta a
           * outra, e a moldura **reentra** em vez de mudar por dentro.
           *
           * **E ela vem ANTES do formulário nas duas fases.** Até 14/09 o card
           * de import substituía o formulário e o de aquecimento vinha DEPOIS
           * dele — então, no instante exato em que o passo 1 fechava, a peça
           * saltava do topo da tela para baixo de três caixas. *Peça que ancora
           * a atenção não muda de lugar quando um vizinho aparece* — a mesma
           * régua do sino recolhido e do seletor de pilhas, aqui na vertical.
           */}
          {work && (
            <WorkCard
              key="work"
              job={work.job}
              phase={work.phase}
              mine={work.mine}
            />
          )}

          {/**
           * As duas ao mesmo tempo: começar um import novo enquanto a arte do
           * anterior ainda chega é legítimo — o índice único do servidor é por
           * `kind`. Aí são dois trabalhos e duas peças, porque a de cima estaria
           * afirmando `Next` sobre um passo que já está rodando.
           */}
          {running && enrichingSourced && (
            <WorkCard
              key="work-enrich"
              job={enrichingSourced}
              phase="enrich"
              mine={true}
            />
          )}

          {/**
           * **O formulário FICA, mesmo com um import rodando — 14/09/2026.**
           *
           * Ele sumia inteiro durante a primeira fase e voltava na segunda, o
           * que é a régua de 09/09 do `/search` furada aqui: *controle cuja
           * existência depende do estado da tela é controle que não se
           * aprende*. A saída lá foi a mesma — **o que varia é o CONTEÚDO,
           * nunca a posição** —, e a recusa se anuncia antes do clique, porque
           * este app não tem toast.
           *
           * `running` e não `work`: o índice único do servidor é por `kind`, e
           * buscar arte não ocupa a vaga de importar.
           */}
          <StartForm
            sources={status.data?.sources ?? []}
            busy={
              running
                ? mine
                  ? copy.running.busy.mine
                  : copy.running.busy.theirs
                : null
            }
          />

          {latestSourced && !running && <ResultBlock job={latestSourced} />}

          {/*
            **A varredura é irmã do import, não uma caixa dentro dele.** As
            duas falam com provedores e rodam em segundo plano, e é por isso
            que moram na mesma seção (decisão do dono); o que elas fazem é
            oposto — uma TRAZ obras de fora, a outra relê o que já está dentro.
            A divisória diz isso sem precisar de um título de seção novo.
          */}
          <FillBox pending={status.data?.pending ?? 0} />

          <RefreshBox job={refreshing} />
        </div>
      )}
    </>
  )
}

/* ── O formulário ─────────────────────────────────────────────────────────── */

function StartForm({
  sources,
  busy,
}: {
  sources: ImportSourceState[]
  /** Por que não dá pra começar agora, ou `null` quando dá. */
  busy: string | null
}) {
  const [mode, setMode] = useState<ImportMode>('skip')
  const { services, csv } = splitSources(sources)

  return (
    /*
      **O formulário é um bloco só, e a divisória mora AQUI** — acima da regra e
      das caixas juntas, nunca entre elas. É o que faz a regra e o que ela
      governa lerem como uma coisa.
    */
    <div className="flex flex-col gap-6 border-line border-t pt-6">
      <ModeChoice mode={mode} onChange={setMode} />

      {/*
        **A recusa fica UMA vez, e não uma por caixa.** O que impede não é nada
        de nenhuma delas — é o servidor estar ocupado —, então repeti-la três
        vezes diria três vezes a mesma coisa e ainda sugeriria que cada fonte
        tem um motivo próprio. Mesma forma da regra logo acima, pelo mesmo
        argumento.
      */}
      {busy && <p className="max-w-prose text-muted text-sm">{busy}</p>}

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
          <ProfileBox
            key={source.slug}
            source={source}
            mode={mode}
            busy={busy !== null}
          />
        ))}
        {csv && <CsvBox key={csv.slug} mode={mode} busy={busy !== null} />}
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

function CsvBox({ mode, busy }: { mode: ImportMode; busy: boolean }) {
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
          disabled={busy || !file || start.isPending}
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
  busy,
}: {
  source: ImportSourceState
  mode: ImportMode
  /** Já há um import rodando neste servidor? O motivo fica acima, uma vez só. */
  busy: boolean
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
          disabled={busy || username.trim() === '' || start.isPending}
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
    /*
      **Sem divisória embaixo — ela subiu para o topo do formulário, 14/09/2026.**

      A `border-b` daqui lia certo enquanto a regra era a primeira coisa da
      tela: linha embaixo dela = "regra no topo, conteúdo abaixo". Com a peça de
      trabalho acima, a mesma linha passou a SEPARAR a regra das caixas que ela
      governa e a colá-la ao job em curso — que é justamente o que ela não
      controla, porque o modo é fixado quando o job começa.

      *A regra que governa a operação fica uma vez, ACIMA do que ela governa*
      (design system, 06/09/2026) — e "acima" é sobre o que está do mesmo lado
      da divisória, não sobre a ordem no DOM. **Ao mover uma peça de contexto,
      reler o motivo dela.**
    */
    <div className="flex flex-col gap-2">
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
 * ── O que mudou em 14/09/2026: o LOGO entrou ───────────────────────────────
 * As três caixas paravam na inicial, e o argumento de 07/09 era que marca de
 * terceiro só entra quando há o que reconhecer. Ele valia — e o que ele cobra
 * é justamente esta tela: *marca de terceiro entra quando o inventário é grande
 * e a tarefa é RECONHECER* (design system, seção 2, 01/09/2026), e a tarefa
 * aqui é achar a sua fonte no meio das outras.
 *
 * **O que muda é o MARK, nunca a caixa.** A moldura é nossa — mesmo tamanho,
 * mesmo raio, mesmo fundo nas três —, e o que entra dentro é o símbolo de cada
 * um. Dar a cada marca o seu próprio fundo deixaria a fileira esfarrapada, e o
 * fundo não é o que identifica: o símbolo é.
 */
function BrandTile({ slug }: { slug: ImportSourceSlug }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-raised to-line font-medium text-faint text-sm"
      aria-hidden="true"
    >
      <SourceMark slug={slug} />
    </span>
  )
}

/**
 * **A escada de identidade, e o MyAnimeList para no degrau da inicial de
 * propósito.** O contrato deles (seção 17) proíbe incluir as marcas em "Your
 * Applications", com uma exceção só: atribuir a fonte, e o exemplo que eles dão
 * é uma FRASE. É exatamente o caso que o design system previu — *um brand que
 * não se possa empacotar simplesmente não tem logo, e a tela continua inteira*.
 *
 * O AniList não tem essa cláusula: os termos da API deles não dizem nada sobre
 * logo, ícone ou trademark — só sobre o NOME do aplicativo, que não nos alcança
 * (`server/CLAUDE.md`, "A cláusula 5 do AniList").
 */
function SourceMark({ slug }: { slug: ImportSourceSlug }) {
  if (slug === 'csv') return <WatchpileMark />
  if (slug === 'anilist') return <AniListMark />
  return <>{copy.sources[slug].name[0]}</>
}

/**
 * O símbolo da marca (design system, seção 10), com a geometria de
 * `design/brand/icon.svg` — as rotações alternadas e a escada de opacidade.
 *
 * **Não é o `PileGlyph`, e a diferença é de assunto.** Aquele é a versão CHAPADA
 * do símbolo, que existe pra ser ícone de nav e ladrilho de pilha vazia — ali
 * ele é um glifo de interface e toma a cor do texto ao redor. Aqui ele é a
 * MARCA, ao lado de outra marca, e marca não se pinta com a cor do vizinho.
 *
 * É o uso de `accent` que a régua de 24/08 manda confirmar antes — e ele passa
 * porque o accent **é** a cor do símbolo por definição, não uma escolha
 * decorativa tomada aqui.
 */
function WatchpileMark() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 64 64"
      fill="var(--color-accent)"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="7"
        width="23"
        height="23"
        rx="6"
        opacity="0.5"
        transform="rotate(-3 18.5 18.5)"
      />
      <rect
        x="34"
        y="7"
        width="23"
        height="23"
        rx="6"
        opacity="0.75"
        transform="rotate(3 45.5 18.5)"
      />
      <rect
        x="7"
        y="34"
        width="23"
        height="23"
        rx="6"
        opacity="0.9"
        transform="rotate(3 18.5 45.5)"
      />
      <rect
        x="34"
        y="34"
        width="23"
        height="23"
        rx="6"
        transform="rotate(-3 45.5 45.5)"
      />
    </svg>
  )
}

/**
 * O símbolo do AniList, com as duas formas e as duas cores do asset oficial
 * deles (`anilist.co/img/icons/icon.svg`) — o `A` claro e a peça em `#02a9ff`.
 *
 * **As cores são LITERAIS e não saem de token**, o que fura a regra de cor crua
 * de propósito e pelo mesmo motivo que `design/brand/icon.svg` resolve os
 * nossos tokens pra sRGB: a cor de uma marca é dado do dono dela. Trocá-la por
 * um token do nosso sistema seria repintar o logo de um terceiro — e o dia em
 * que o nosso `accent` mudar, o azul do AniList não pode mudar junto.
 *
 * O asset deles nasce transparente, desenhado pra pousar em branco, e o `A` é
 * `#fefefe`. Sobre o nosso ladrilho escuro ele lê melhor do que leria no
 * original — nenhuma das duas formas precisou de ajuste.
 */
function AniListMark() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 172 172"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#02a9ff"
        fillRule="evenodd"
        d="M111.322,111.157 L111.322,41.029 C111.322,37.010 109.105,34.792 105.086,34.792 L91.365,34.792 C87.346,34.792 85.128,37.010 85.128,41.029 C85.128,41.029 85.128,56.337 85.128,74.333 C85.128,75.271 94.165,79.626 94.401,80.547 C101.286,107.449 95.897,128.980 89.370,129.985 C100.042,130.513 101.216,135.644 93.267,132.138 C94.483,117.784 99.228,117.812 112.869,131.610 C112.986,131.729 115.666,137.351 115.833,137.351 C131.170,137.351 148.050,137.351 148.050,137.351 C152.069,137.351 154.286,135.134 154.286,131.115 L154.286,117.394 C154.286,113.375 152.069,111.157 148.050,111.157 L111.322,111.157 Z"
      />
      <path
        fill="#fefefe"
        fillRule="evenodd"
        d="M54.365,34.792 L18.331,137.351 L46.327,137.351 L52.425,119.611 L82.915,119.611 L88.875,137.351 L116.732,137.351 L80.836,34.792 L54.365,34.792 ZM58.800,96.882 L67.531,68.470 L77.094,96.882 L58.800,96.882 Z"
      />
    </svg>
  )
}

/* ── O job rodando ────────────────────────────────────────────────────────── */

/**
 * **`SourcedJob` e não `ImportJob`** — 13/09/2026.
 *
 * `source` é nulável desde que a varredura entrou: ela relê vários provedores,
 * então não vem de fonte nenhuma. As peças que desenham a MARCA só servem os
 * trabalhos que têm uma, e dizer isso no tipo é melhor que um `??` que
 * escolheria uma marca errada para exibir.
 */
type SourcedJob = ImportJob & { source: ImportSourceSlug }

/**
 * O job quando ele tem fonte, e `null` quando não tem.
 *
 * Uma função em vez de um `as`: o cast afirmaria sem conferir, e o dia em que
 * um trabalho sem fonte caísse num destes ramos a tela desenharia a marca de um
 * serviço que ele não usou.
 */
function sourced(job: ImportJob | null): SourcedJob | null {
  return job?.source ? (job as SourcedJob) : null
}

/* ── A peça de trabalho: um trabalho, dois passos ─────────────────────────── */

/**
 * O visto de passo concluído e o alerta de passo parado.
 *
 * **Desenhados aqui e não vindos de `menu-icons.tsx`**: aqueles são glifos de
 * ITEM DE MENU, com a caixa e o traço daquele contexto. Estes vivem numa lista
 * de passos a 16px e o alerta ganha a cor do estado, que um ícone de menu não
 * carrega. Reusar aquele arquivo o faria responder por dois contextos com
 * exigências diferentes — que é como um traço acaba divergindo entre telas.
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 7.2v3.6" />
      <circle cx="10" cy="13.4" r=".9" fill="currentColor" stroke="none" />
      <path d="M8.7 3.9 2.6 14.8a1.5 1.5 0 0 0 1.3 2.3h12.2a1.5 1.5 0 0 0 1.3-2.3L11.3 3.9a1.5 1.5 0 0 0-2.6 0Z" />
    </svg>
  )
}

type EstadoPasso = 'agora' | 'feito' | 'depois' | 'parado'

/**
 * Um passo dentro da peça de trabalho — 14/09/2026.
 *
 * ── O marcador da esquerda É o estado ──────────────────────────────────────
 * Visto para o que fechou, ponto vivo para o que corre, ponto apagado para o
 * que vem, alerta para o que parou. **Sem texto repetindo o que o glifo já
 * diz**: a direita carrega o número, que é a informação que muda.
 *
 * ── Cada passo carrega o SEU número ────────────────────────────────────────
 * É o que permite o passo 1 dizer `Done` enquanto o 2 corre, e é o que mantém
 * intacta a decisão de 07/09: importar termina quando importou. Um contador só
 * para os dois passos somaria dois motivos, que é a régua do mesmo dia.
 */
function Step({
  label,
  state,
  right,
  first,
}: {
  label: string
  state: EstadoPasso
  right: ReactNode
  first?: boolean
}) {
  const mark =
    state === 'feito' ? (
      <CheckIcon className="wp-step-mark text-muted" />
    ) : state === 'parado' ? (
      <AlertIcon className="wp-step-mark text-warning" />
    ) : state === 'agora' ? (
      <span className="wp-import-pulse size-1.5 rounded-full bg-ink" />
    ) : (
      <span className="size-1.5 rounded-full bg-line" />
    )

  const tone =
    state === 'feito'
      ? 'text-muted'
      : state === 'depois'
        ? 'text-faint'
        : 'font-medium text-ink'

  return (
    <li
      className={cn(
        'flex items-center gap-3',
        !first && 'mt-3 border-line border-t pt-3',
        state === 'agora' && 'wp-step-active',
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {mark}
      </span>
      <span className={cn('min-w-0 flex-1 truncate text-sm', tone)}>
        {label}
      </span>
      {right}
    </li>
  )
}

/** O contador — número, nunca barra (design system, seção 2). */
function Counter({ done, total }: { done: number; total: number }) {
  const climbing = useClimbingNumber(done)
  return (
    <p className="font-mono text-ink text-sm tabular-nums">
      {copy.running.counter(climbing, total)}
    </p>
  )
}

/**
 * A peça de trabalho — **um trabalho, dois passos** (14/09/2026, variante A
 * escolhida pelo dono entre quatro desenhadas).
 *
 * ── O que ela conserta ─────────────────────────────────────────────────────
 * Antes eram duas peças desconexas: o import terminava, o resultado aparecia, e
 * **então** uma linha nova surgia embaixo dizendo que a arte estava vindo —
 * sem nomear de onde veio e depois de a primeira ter dito que acabou. O
 * intervalo não é pequeno: medido em 13/09 com 1.442 obras, o aquecimento leva
 * de 13 a 51 minutos.
 *
 * Aqui o passo 2 já está na moldura desde o começo, apagado, dizendo que vem
 * depois. Quando chega a vez dele, ele nasce onde já estava.
 *
 * ── O que ela NÃO desfaz ───────────────────────────────────────────────────
 * Os dois passos moram na mesma moldura **sem fundir os estados**. O contador
 * de importar chega ao fim e vira `Done`; o de aquecer começa do zero. É por
 * isso que a decisão de 07/09 continua de pé — segurar o `done` no aquecimento
 * faria o número parar em `1442/1442` por minutos e uma CDN fora do ar
 * reprovar um import que deu certo.
 *
 * ── Ela SOME quando não há trabalho ────────────────────────────────────────
 * É o que responde o risco que esta variante carregava: uma peça que vive uma
 * hora vira mobília. Ela só existe enquanto há o que mostrar.
 */
function WorkCard({
  job,
  phase,
  mine,
}: {
  job: SourcedJob
  phase: 'import' | 'enrich'
  mine: boolean
}) {
  const cancel = useCancelImport()
  const fill = useFillMissing()
  const dismiss = useDismissJob()

  const stopping = job.cancelRequestedAt !== null
  const stopped = job.status === 'failed'
  const reading = job.total === null

  /**
   * O passo 1 já fechou sempre que estamos na fase 2 — a peça só chega aqui
   * depois de o import ter terminado, porque `enriching` nasce do runner.
   */
  const importDone = phase === 'enrich'

  return (
    <div
      className={cn(
        'wp-import-in flex flex-col gap-3 rounded-lg p-4 ring-1',
        stopped ? 'ring-warning/40' : 'ring-line',
      )}
    >
      <div className="flex items-center gap-3">
        <BrandTile slug={job.source} />
        <div className="min-w-0">
          <p className="font-medium text-ink text-sm">
            {copy.work.title(sourceName(job.source))}
          </p>
          <p className="text-faint text-xs">
            {formatRelativeTime(job.startedAt)}
          </p>
        </div>
      </div>

      <ul className="flex flex-col">
        <Step
          first
          label={copy.work.reading}
          state={importDone ? 'feito' : 'agora'}
          right={
            importDone ? (
              <p className="text-faint text-sm">{copy.work.done}</p>
            ) : reading ? (
              <p className="text-muted text-sm">{copy.running.reading}</p>
            ) : (
              <Counter done={job.processed} total={job.total ?? 0} />
            )
          }
        />
        <Step
          label={copy.work.artwork}
          state={importDone ? (stopped ? 'parado' : 'agora') : 'depois'}
          right={
            !importDone ? (
              <p className="text-faint text-sm">{copy.work.next}</p>
            ) : stopped ? (
              <p className="text-sm text-warning">
                {copy.work.stoppedAt(job.processed, job.total ?? 0)}
              </p>
            ) : reading ? (
              <p className="text-muted text-sm">{copy.enriching.starting}</p>
            ) : (
              <Counter done={job.processed} total={job.total ?? 0} />
            )
          }
        />
      </ul>

      <p className="max-w-prose text-muted text-sm">
        {stopped
          ? copy.work.stoppedBody
          : mine
            ? copy.work.body
            : copy.running.someoneElse}
      </p>

      {mine && (
        <div className="flex flex-wrap justify-end gap-2">
          {stopped ? (
            <>
              <Button disabled={fill.isPending} onClick={() => fill.mutate()}>
                {fill.isPending ? copy.work.continuing : copy.work.continue}
              </Button>
              <Button
                variant="outline"
                disabled={dismiss.isPending}
                onClick={() => dismiss.mutate(job.id)}
              >
                {copy.work.dismiss}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              disabled={stopping || cancel.isPending}
              onClick={() => cancel.mutate(job.id)}
            >
              {stopping ? copy.running.stopping : copy.running.stop}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A varredura da biblioteca — item 11(c) da fila do dono, 13/09/2026.
 *
 * ── Três estados numa peça só, e a posição não muda ─────────────────────────
 * Parada (com o botão), rodando (com contador e `Stop`) e terminada (com o
 * resultado). **O que varia é o CONTEÚDO, nunca a posição** — a régua de 09/09
 * que tirou o seletor de fonte do ramo condicional de `/search`. Uma caixa que
 * aparecesse só depois de clicar seria um controle que não se aprende.
 *
 * ── Por que ela mostra o resultado, e o aquecimento não ─────────────────────
 * Porque ela tem um: quantas obras ganharam contagem nova é o que a pessoa
 * apertou o botão para saber. O aquecimento não tem o que dizer depois, porque
 * a arte que faltar cai no caminho sob demanda — e é por isso que aquela peça
 * some ao terminar e esta fica.
 */
function RefreshBox({ job }: { job: ImportJob | null }) {
  const start = useRefreshLibrary()
  const cancel = useCancelImport()
  const copy = importCopy.refresh

  const running = job?.status === 'running'
  const stopping = job?.cancelRequestedAt != null
  const climbing = useClimbingNumber(job?.processed ?? 0)

  /**
   * A recusa **antes do clique**: uma biblioteca sem nenhum vínculo não tem o
   * que reler. O servidor responde 422, e o app não tem toast para explicá-lo
   * depois.
   */
  const empty = start.error?.status === 422

  return (
    <div className="flex flex-col gap-3 border-line border-t pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink text-sm">{copy.title}</p>
          <p className="text-faint text-xs">{copy.line}</p>
        </div>

        {running ? (
          job.total === null ? (
            <p className="flex items-center gap-2 text-muted text-sm">
              <span
                aria-hidden
                className="wp-import-pulse size-1.5 rounded-full bg-ink"
              />
              {copy.starting}
            </p>
          ) : (
            <p className="font-mono text-ink text-sm tabular-nums">
              {copy.counter(climbing, job.total)}
            </p>
          )
        ) : (
          <Button
            variant="outline"
            disabled={start.isPending}
            onClick={() => start.mutate()}
          >
            {start.isPending ? copy.starting : copy.start}
          </Button>
        )}
      </div>

      <p className="max-w-prose text-muted text-sm">{copy.body}</p>
      {/* A única escrita que atravessa do provedor para a obra, e a direção
       * dela. Fica à vista porque é o que a pessoa precisa saber ANTES. */}
      <p className="max-w-prose text-faint text-xs">{copy.totalNote}</p>

      {empty && <p className="text-danger text-sm">{copy.empty}</p>}

      {running && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={stopping || cancel.isPending}
            onClick={() => cancel.mutate(job.id)}
          >
            {stopping ? copy.stopping : copy.stop}
          </Button>
        </div>
      )}

      {/* O resultado do último varrimento, e ele conta OBRAS — o número que se
       * confere olhando a biblioteca. */}
      {job && !running && job.status === 'done' && (
        <p className="text-muted text-sm">{copy.done(job.updated)}</p>
      )}
    </div>
  )
}

/**
 * Preencher o que falta — 14/09/2026, pedido do dono.
 *
 * **Irmã do `RefreshBox`, e vizinha dele de propósito.** A diferença entre as
 * duas é o que a tela tem de ensinar: esta pula o que já existe e custa só o
 * buraco; aquela relê tudo e custa a biblioteca inteira. Separá-las em lugares
 * distintos faria alguém escolher a cara achando que escolhia a barata.
 *
 * **É a mesma ação do `Continue`** do cartão parado — aquecer pula o que já
 * está guardado, então retomar é rodar de novo. Uma ação, duas situações.
 */
function FillBox({ pending }: { pending: number }) {
  const fill = useFillMissing()
  const copy_ = importCopy.fill
  const nada = pending === 0

  return (
    <div className="flex flex-col gap-1.5 border-line border-t pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-medium text-ink text-sm">{copy_.title}</p>
        <Button
          variant="outline"
          disabled={nada || fill.isPending}
          title={nada ? copy_.noneWhy : undefined}
          onClick={() => fill.mutate()}
        >
          {nada
            ? copy_.none
            : fill.isPending
              ? copy_.starting
              : copy_.start(pending)}
        </Button>
      </div>
      <p className="max-w-prose text-muted text-sm">{copy_.body}</p>
      <p className="max-w-prose text-faint text-xs">{copy_.note}</p>
    </div>
  )
}

/**
 * Limpar o histórico — 14/09/2026, pedido do dono.
 *
 * ── Por que ela mora DENTRO do resultado ──────────────────────────────────
 * Porque é o que ela apaga. Uma ação solta na seção teria de explicar sobre o
 * que age; encostada no bloco que some, ela não precisa — *o botão é o VERBO e
 * quem nomeia a coisa é o que está ao lado* (07/09).
 *
 * ── Discreta, e é decisão ─────────────────────────────────────────────────
 * Ela não compete com `Import`, que é a ação primária da tela. E **não pede
 * confirmação**: o que ela joga fora é o relato de trabalhos passados, não
 * conteúdo — as obras ficam, e a frase ao lado diz isso, porque "limpar
 * histórico de import" lê perto demais de "desfazer o import".
 */
function ClearHistory() {
  const clear = useClearHistory()
  const copy_ = importCopy.history

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <p className="text-faint text-xs">{copy_.kept}</p>
      <button
        type="button"
        disabled={clear.isPending}
        onClick={() => clear.mutate()}
        className="rounded-md px-2 py-1 font-medium text-faint text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:text-ink disabled:opacity-[var(--opacity-disabled)]"
      >
        {clear.isPending ? copy_.clearing : copy_.clear}
      </button>
    </div>
  )
}

/* ── O resultado ──────────────────────────────────────────────────────────── */

function ResultBlock({ job }: { job: SourcedJob }) {
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

      <ClearHistory />
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

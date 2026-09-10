import type { Entry } from '@/domain/media'
import { showsCounter } from '@/domain/shows-counter'
import { useAddProgress } from '@/hooks/mutations/entries/use-add-progress'
import { useCountsProgress } from '@/hooks/queries/media-types/use-counts-progress'
import { appCopy } from '@/lib/copy'
import { StatusButton } from './status-button'

/**
 * As três formas do contador, e os dois eixos que as separam: o TAMANHO do
 * alvo e a LARGURA do número.
 *
 * - `card` — carta de pôster: alvo de 28px e contador elástico, que toma a
 *   folga entre os dois botões. Ali a caixa tem largura fixa e o número pode
 *   dançar dentro dela.
 * - `row` — linha de lista: 44px no toque, 28 no ponteiro, contador de largura
 *   mínima.
 * - `row-dense` — linha da lista compacta: alvo de 28px sempre, contador de
 *   largura mínima.
 *
 * A largura mínima existe por causa da LISTA, não da carta: em duzentas linhas
 * "1 / 1" e "364 / ?" dariam larguras diferentes, e a coluna Progress deixaria
 * de ser uma coluna.
 */
type ProgressVariant = 'card' | 'row' | 'row-dense'

type EntryProgressProps = {
  entry: Entry
  variant?: ProgressVariant
  /**
   * A linha já mostra o status em outro lugar — a coluna `Status` das listas.
   *
   * **Quando ela mostra, esta peça não põe o status aqui: fica VAZIA.** Sem
   * isso a linha diz a mesma palavra duas vezes (decisão do dono, 07/09/2026,
   * olhando a tela), e a primeira tentativa de conserto foi apagar a coluna de
   * leitura — que é pior, porque some abaixo de `md` e porque a peça de status
   * ficava no lugar cujo cabeçalho diz `Progress`.
   *
   * **A régua: o status mora na coluna de status.** A carta e o widget de lista
   * não têm uma, e por isso continuam ganhando o CONTROLE aqui — é o único
   * status que aquela linha tem.
   */
  statusInRow?: boolean
}

/**
 * Contador + / −. Progresso é número, nunca barra (design system, seção 2), em
 * `tabular-nums` pro dígito não dançar ao incrementar.
 *
 * Desfazer é uma escrita como qualquer outra — delta negativo, evento novo no
 * log (brief, 3.11) —, então o botão `−` não é um "cancelar" local.
 *
 * Alvo de toque de 44px no celular e 28px no ponteiro: a seção 9 fixa ≥44px
 * como não negociável, mas isso é sobre toque; 44px numa linha de lista com
 * mouse destrói a densidade que a seção 1 chama de feature.
 *
 * **`card` fura essa regra, e isso está em aberto.** Na carta de pôster não
 * há como cumprir os 44px: a carta tem 133px de largura, e dois alvos de 44
 * mais o contador não cabem — "1094 / ?" já ocupa o resto sozinho. O mockup
 * desenhou 24px ali; aqui são 28, o mesmo do ponteiro. A saída de verdade
 * provavelmente não é encolher o botão e sim tirar o +/− da carta no toque,
 * mas isso é decisão da seção 9 do design system, não deste componente.
 *
 * `row-dense` fura a mesma regra pelo mesmo motivo e com menos desculpa: ali a
 * linha tem 44px de altura no celular e os botões têm 28. É o EM ABERTO #7 do
 * mockup de `/library`, e a decisão é da mesma seção 9.
 */
/**
 * `+` e `−` desenhados, não digitados — mas com a geometria do SF, medida.
 *
 * ── Por que não é texto ─────────────────────────────────────────────────────
 * Como texto, o centro da tinta caía 0,83px abaixo do centro do botão: a tinta
 * se alinha pelo eixo matemático da fonte, não pela caixa de linha, e nenhum
 * `items-center` conserta isso. E o desvio depende da fonte resolvida — a
 * família é `ui-sans-serif`, que muda em cada SO, e o design system ainda não
 * escolheu uma. Traço próprio fica centrado em qualquer máquina.
 *
 * ── Por que é ESTA geometria ────────────────────────────────────────────────
 * Medido no canvas a 100px, onde o hinting não distorce (`measureText`, tinta
 * real e não a caixa de linha):
 *
 *   +   0,4956em de largura   0,4834em de altura
 *   −   0,4834em de largura   0,0791em de espessura
 *
 * Só que a proporção tirada de 100px sai ~0,3px curta quando aplicada a 14px:
 * o hinting muda o desenho nos tamanhos pequenos. Como é em 14 e 16px que isto
 * aparece, os números abaixo vêm da medição NO TAMANHO REAL:
 *
 *   +   7,23 × 7,37px      −   7,05 × 1,11px      (a 14px)
 *
 * O viewBox é 1000 = 1em, então os números são a medida dividida pelos 14px e
 * multiplicada por mil; `size` é o tamanho da fonte que o glifo substituiu.
 *
 * **`strokeLinecap="butt"`, e é isto que estava errado na primeira versão.**
 * Com ponta arredondada a barra ganha meia espessura em cada extremidade e
 * engorda nas pontas; o SF desenha retângulos de canto reto, e a diferença de
 * leitura é grande num glifo de 7px.
 */
const BARRA = 79.3
const ARM_H = 516.4 / 2
const ARM_V = 526.4 / 2
const MINUS = 503.6 / 2

function Glyph({ sign, size }: { sign: 'plus' | 'minus'; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      stroke="currentColor"
      strokeWidth={BARRA}
      strokeLinecap="butt"
      aria-hidden="true"
    >
      {sign === 'plus' && <path d={`M500 ${500 - ARM_V}V${500 + ARM_V}`} />}
      <path
        d={
          sign === 'plus'
            ? `M${500 - ARM_H} 500H${500 + ARM_H}`
            : `M${500 - MINUS} 500H${500 + MINUS}`
        }
      />
    </svg>
  )
}

/**
 * O vão que sobra quando a obra não tem o que contar E a linha já mostra o
 * status. As larguras são as do CONTADOR que não foi desenhado — a mesma conta
 * de `status-button.tsx`: 44+4+80+4+44 no toque, 28+4+80+4+28 no ponteiro.
 */
const EMPTY: Record<ProgressVariant, string> = {
  card: 'block h-7 w-full',
  row: 'block h-11 w-44 shrink-0 sm:h-7 sm:w-36',
  // Desde 10/09/2026 a compacta tem o mesmo alvo de toque da outra lista, então
  // o vão dela acompanha: uma largura que não bate com o contador que não foi
  // desenhado faz a coluna vizinha andar exatamente na linha sem contador.
  'row-dense': 'block h-11 w-44 shrink-0 sm:h-7 sm:w-36',
}

const PEQUENO =
  'flex h-7 w-7 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]'

/**
 * O alvo da lista COMPACTA — 10/09/2026, decisão do dono, e é o resto que a #8
 * deixou.
 *
 * Ela fechou com *o alvo muda com o BREAKPOINT* e trocou o `⋯` das linhas por
 * `h-11 w-11 sm:size-8`; o `+`/`−` da lista compacta ficou em 28px, **ao lado
 * de um `⋯` de 44 na mesma linha**. Dois alvos vizinhos com tamanhos decididos
 * por critérios diferentes é exatamente o que aquela decisão veio tirar —
 * *critério de alvo se herda do VIZINHO, não do princípio*.
 *
 * `sm:size-7` e não `sm:size-8`: no ponteiro ele volta ao que era, porque é ali
 * que a densidade da lista compacta é a feature. O que muda é só o toque.
 */
const PEQUENO_TOQUE =
  'flex h-11 w-11 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)] sm:size-7'

/**
 * **Esta é a peça que decide, e é de propósito que sejam os cinco chamadores a
 * não saber** (07/09/2026, decisão do dono).
 *
 * `widget-content`, as duas listas de `/library`, `pile-entry-list` e
 * `entry-card` pedem "o acompanhamento desta obra"; qual forma ele tem é
 * pergunta do TIPO, e o tipo chega aqui pelo slug que a obra carrega. Pôr o
 * `if` nos cinco seria cinco cópias da mesma regra, e a sexta tela nasceria
 * errada.
 *
 * **São DUAS perguntas, e basta uma dizer que não** (`domain/shows-counter.ts`):
 * o TIPO não conta — filme —, ou a OBRA tem uma unidade só. Nos dois casos o
 * STATUS ocupa o lugar do contador: ele é o progresso ali, e um toque abre os
 * cinco. A variante casa com a do contador que ela substitui, e é assim que a
 * coluna `Progress` continua sendo uma coluna numa lista de tipo misto.
 */
export function EntryProgress({
  entry,
  variant = 'row',
  statusInRow = false,
}: EntryProgressProps) {
  const addProgress = useAddProgress(entry.id)
  const countsProgress = useCountsProgress()

  const typeCounts = countsProgress(entry.mediaType)
  if (typeCounts === null) {
    return null
  }
  if (!showsCounter({ typeCounts, total: entry.total })) {
    // A célula continua ocupando a mesma largura, senão as colunas de todas as
    // outras linhas andam — a régua da vigésima leva do design system.
    return statusInRow ? (
      <span className={EMPTY[variant]} aria-hidden="true" />
    ) : (
      <StatusButton entry={entry} variant={variant} />
    )
  }

  const atFloor = entry.progress <= 0
  const atCeiling = entry.total !== null && entry.progress >= entry.total

  const button =
    variant === 'row'
      ? 'flex h-11 w-11 items-center justify-center rounded-sm text-faint transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)] sm:h-7 sm:w-7'
      : variant === 'row-dense'
        ? PEQUENO_TOQUE
        : PEQUENO

  const glyph = variant === 'row' ? 16 : 14

  const counter =
    variant === 'card'
      ? 'flex-1 whitespace-nowrap text-center font-mono text-[11px] text-muted tabular-nums'
      : 'min-w-20 whitespace-nowrap text-center font-mono text-xs tabular-nums'

  return (
    <div
      className={`flex shrink-0 items-center ${variant === 'card' ? 'gap-0.5' : 'gap-1'}`}
    >
      <button
        type="button"
        aria-label={appCopy.progress.decrease}
        className={button}
        disabled={atFloor || addProgress.isPending}
        onClick={() => addProgress.mutate({ delta: -1 })}
      >
        <Glyph sign="minus" size={glyph} />
      </button>
      <p className={counter}>
        {entry.progress} / {entry.total ?? appCopy.progress.unknownTotal}
      </p>
      <button
        type="button"
        aria-label={appCopy.progress.increase}
        className={button}
        disabled={atCeiling || addProgress.isPending}
        onClick={() => addProgress.mutate({ delta: 1 })}
      >
        <Glyph sign="plus" size={glyph} />
      </button>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { EntryArt } from '@/components/media/entry-art'
import { EntryMenu } from '@/components/media/entry-menu'
import { EntryProgress } from '@/components/media/entry-progress'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import type { Entry } from '@/domain/media'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'
import { appCopy } from '@/lib/copy'
import { formatDate } from '@/lib/format'
import { libraryCopy } from '@/routes/-library.copy'

/**
 * O cabeçalho de colunas das duas listas.
 *
 * **São rótulos, não botões** (EM ABERTO #3 do mockup, resolvido assim):
 * clicar para ordenar seria um segundo caminho para o que o menu já faz, e dois
 * caminhos para a mesma coisa na mesma tela é onde a interface começa a mentir
 * sobre onde as coisas moram.
 *
 * As larguras casam com as das linhas: `w-20`, `w-24`, `w-12` e `w-36` aqui e
 * lá, e é essa repetição que faz a coluna ser uma coluna. `aria-hidden` porque
 * o leitor de tela lê a linha inteira em ordem — a associação visual coluna ↔
 * valor não se traduz em áudio, e repetir "Status" antes de cada valor seria
 * pior que não ter.
 */
function ColumnHeader({ compact }: { compact: boolean }) {
  return (
    <div
      className="flex h-8 items-center gap-3 border-line border-b px-2 text-[11px] text-faint uppercase tracking-wide"
      aria-hidden="true"
    >
      <span className="w-[18px] shrink-0" />
      {!compact && <span className="w-9 shrink-0" />}
      <span className="min-w-0 flex-1">{libraryCopy.columns.title}</span>
      <span className="hidden w-20 shrink-0 md:block">
        {libraryCopy.columns.status}
      </span>
      <span className="hidden w-24 shrink-0 lg:block">
        {libraryCopy.columns.added}
      </span>
      <span className="hidden w-12 shrink-0 sm:block">
        {libraryCopy.columns.rating}
      </span>
      <span className="w-36 shrink-0 text-center">
        {libraryCopy.columns.progress}
      </span>
      {/* A coluna do `⋯`, sem rótulo — ele não nomeia um valor, e a fileira de
       * rótulos é sobre o que a linha DIZ. Mas a largura tem que estar aqui:
       * a peça só aparece no hover, e sem o vão a coluna `Progress` andaria
       * 44px para a direita na linha apontada. Casa com `TRIGGER_ROW`. */}
      <span className="w-11 shrink-0 sm:w-8" />
    </div>
  )
}

function Star() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 1l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1L4.6 17l1.3-6L1.3 7.2l6.1-.6L10 1z" />
    </svg>
  )
}

/**
 * As colunas que somem por largura: status abaixo de `md`, data abaixo de `lg`,
 * nota abaixo de `sm`. A ordem em que caem é a ordem inversa da utilidade —
 * progresso e título nunca somem, porque são a linha.
 */
function Metadata({ entry, compact }: { entry: Entry; compact: boolean }) {
  return (
    <>
      {/* **O status mora AQUI, sempre e para todo mundo** (decisão do dono,
       * 07/09/2026, olhando a tela).
       *
       * Ela chegou a ficar vazia nas linhas cuja célula de `Progress` mostrava
       * o controle de status, pra a linha não dizer a mesma palavra duas vezes.
       * Era o conserto pelo lado errado: a coluna cujo cabeçalho diz `Status` é
       * o lugar do status, e a que diz `Progress` fica vazia quando não há o
       * que contar. Quem some abaixo de `md` é esta, e o valor sumir junto é o
       * comportamento que ela sempre teve.
       *
       * **E o defeito que isso corrigiu não era o desenho, era ter DUAS
       * CONTAS:** esta célula perguntava só ao TIPO, enquanto `EntryProgress`
       * perguntava ao tipo E à obra (`total === 1`). Uma obra de tipo que conta
       * com total 1 caía no meio das duas e aparecia nas duas. Agora só uma
       * peça decide. */}
      <span className="hidden w-20 shrink-0 text-faint text-xs md:block">
        {appCopy.statuses[entry.status]}
      </span>
      <span className="hidden w-24 shrink-0 text-faint text-xs tabular-nums lg:block">
        {formatDate(entry.createdAt)}
      </span>
      <span
        className={
          compact
            ? 'hidden w-12 shrink-0 text-muted text-xs tabular-nums sm:block'
            : 'hidden w-12 shrink-0 items-center gap-1 text-muted text-xs tabular-nums sm:flex'
        }
      >
        {entry.rating !== null && (
          <>
            {!compact && <Star />}
            <span className="sr-only">{appCopy.entry.rating}</span>
            {entry.rating.toFixed(1)}
          </>
        )}
      </span>
    </>
  )
}

/**
 * Modo 2 — lista: miniatura da arte mais os metadados.
 *
 * A linha tem 56px, e a altura é contígua de propósito: o passo de 72px é
 * propriedade da GRADE DA HOME, onde `altura + gap` precisa fechar uma linha de
 * widget (design system, seção 4, alcance corrigido em 29/08/2026). Aqui não há
 * widget nenhum para encaixar.
 */
export function LibraryList({ entries }: { entries: Entry[] }) {
  const typeName = useMediaTypeName()

  return (
    <div>
      <ColumnHeader compact={false} />
      <ul className="mt-1 flex flex-col">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className="group/row flex h-14 items-center gap-3 rounded-md px-2 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-card">
              <span
                className="shrink-0 text-faint"
                title={typeName(entry.mediaType)}
              >
                <MediaTypeIcon
                  type={entry.mediaType}
                  size={18}
                  strokeWidth={1.6}
                  labelled
                />
              </span>
              <EntryArt
                entry={entry}
                className="aspect-poster w-9 shrink-0 rounded-sm text-xs"
              />
              {/* Nas listas o título é link porque ali não há camada de hover
               * cobrindo a linha — os atalhos são irmãos, não sobreposição. */}
              <Link
                to="/library/$entryId"
                params={{ entryId: String(entry.id) }}
                className="min-w-0 flex-1 truncate text-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ink/50"
              >
                {entry.title}
              </Link>
              <Metadata entry={entry} compact={false} />
              <EntryProgress entry={entry} variant="row" statusInRow />
              <EntryMenu entry={entry} variant="row" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Modo 1 — lista compacta: sem arte nenhuma, 36px no ponteiro e 44 no toque.
 *
 * É o modo mais denso dos quatro, e a densidade é o produto: a seção 1 do
 * design system chama densidade de feature, não de risco. Quem tem quinhentos
 * títulos quer ver quantos couberem.
 */
export function LibraryCompactList({ entries }: { entries: Entry[] }) {
  const typeName = useMediaTypeName()

  return (
    <div>
      <ColumnHeader compact={true} />
      <ul className="mt-1 flex flex-col">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className="group/row flex h-11 items-center gap-3 rounded-sm px-2 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-card md:h-9">
              <span
                className="shrink-0 text-faint"
                title={typeName(entry.mediaType)}
              >
                <MediaTypeIcon
                  type={entry.mediaType}
                  size={18}
                  strokeWidth={1.6}
                  labelled
                />
              </span>
              {/* Nas listas o título é link porque ali não há camada de hover
               * cobrindo a linha — os atalhos são irmãos, não sobreposição. */}
              <Link
                to="/library/$entryId"
                params={{ entryId: String(entry.id) }}
                className="min-w-0 flex-1 truncate text-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ink/50"
              >
                {entry.title}
              </Link>
              <Metadata entry={entry} compact={true} />
              <EntryProgress entry={entry} variant="row-dense" statusInRow />
              <EntryMenu entry={entry} variant="row" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

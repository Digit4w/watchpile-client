import { RemoteArt } from '@/components/media/remote-art'
import { titleDetailCopy } from '@/routes/-title-detail.copy'
import type { TitleDetails, TitleUnit } from '@/services/titles'

type Group = TitleDetails['unitGroups'][number]

function Check() {
  return (
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
  )
}

function Plus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  )
}

/**
 * A grade de GRUPOS — temporadas, volumes.
 *
 * ── Substituiu a faixa presa, e o motivo é de página ────────────────────────
 * A primeira versão punha os grupos numa faixa de vidro presa, de ponta a
 * ponta. Ela **partia a página em duas metades sem relação** — foi o que o
 * dono viu. Aqui eles são uma seção dentro da coluna de conteúdo, como
 * qualquer outra.
 *
 * ── Cara de objeto, sem ser objeto ──────────────────────────────────────────
 * O cartão mostra `7 / 7`, e esse número é **derivado**: o contador absoluto
 * menos o offset dos grupos anteriores (`domain/unit-offset.ts`). Não há linha
 * nova no banco, e a temporada segue sendo apresentação do contador.
 *
 * **Sem barra de progresso**, ao contrário da referência: progresso aparece
 * como número, nunca barra ou anel (design system, seção 2). O número diz o
 * mesmo e ainda diz quanto falta.
 */
export function UnitGroupGrid({
  groups,
  active,
  onGroup,
  progress,
  offsetDe,
}: {
  groups: Group[]
  active: number | null
  onGroup: (numero: number) => void
  /** O contador da obra. Nulo quando ela não é sua — aí não há o que contar. */
  progress: number | null
  offsetDe: (numero: number) => number | null
}) {
  if (groups.length === 0) {
    return null
  }

  return (
    // `-m-1 p-1` nos QUATRO lados, e não só embaixo: `overflow-x-auto` obriga
    // o eixo Y a recortar junto, então o anel de 2px do cartão ativo saía
    // cortado em cima e embaixo. Visto na tela rodando.
    <ul className="scrollbar-none -m-1 flex gap-3 overflow-x-auto p-1">
      {groups.map((group) => {
        const offset = offsetDe(group.number)
        const total = group.count ?? 0
        /**
         * Sem offset não há como situar o grupo no contador — grupo zero, ou
         * um anterior sem contagem. Aí o cartão não mostra número nenhum, em
         * vez de mostrar um errado.
         */
        const seen =
          progress === null || offset === null
            ? null
            : Math.max(0, Math.min(total, progress - offset))
        const complete = seen !== null && total > 0 && seen >= total

        return (
          <li key={group.number} className="w-card-poster-sm-max shrink-0">
            <button
              type="button"
              onClick={() => onGroup(group.number)}
              aria-pressed={active === group.number}
              // `cursor-pointer` porque o cartão NAVEGA e nada dizia isso —
              // ele não parece botão, e o dono apontou o silêncio. O anel
              // engrossa no hover em vez de nascer: aparecer do nada mexe na
              // caixa e faz a fileira inteira tremer.
              className={`group relative block w-full cursor-pointer overflow-hidden rounded-md text-left outline-none transition-shadow duration-[var(--motion-micro)] ease-chrome focus-visible:ring-[3px] focus-visible:ring-ink/50 ${
                active === group.number
                  ? 'ring-2 ring-ink'
                  : 'ring-1 ring-line hover:ring-2 hover:ring-muted'
              }`}
            >
              {/* A arte do group é EMPRESTADA sempre: o cache em disco é por
               * obra (provedor, id externo), e uma temporada não é uma obra.
               * O hover mexe nela, e não só no anel — num cartão que é quase
               * todo imagem, 1px de anel é resposta pequena demais. */}
              <RemoteArt
                src={group.art}
                title={group.name}
                className="aspect-poster w-full text-lg transition-opacity duration-[var(--motion-micro)] ease-chrome group-hover:opacity-90"
              />
              {complete && (
                <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ink text-surface">
                  <Check />
                </span>
              )}
              {seen !== null && total > 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-glass px-1.5 py-0.5 font-medium text-[11px] text-ink tabular-nums backdrop-blur-md">
                  {seen} / {total}
                </span>
              )}
            </button>
            <p className="mt-1.5 truncate text-ink text-xs">{group.name}</p>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Uma unidade — um episódio, um capítulo.
 *
 * **Lista vertical, não fileira horizontal**, e isso é decisão contra a
 * referência trazida (Trakt). Carrossel está recusado desde 23/08/2026 (seção
 * 1), e o print mostrava o preço: thumbs quase idênticas com a descrição
 * cortada fora. Descrição precisa de largura, e largura só existe empilhando.
 *
 * **O texto fica AO LADO da thumb, nunca sobre ela** (seção 4): a thumb de um
 * episódio não identifica o episódio — todas as de uma série se parecem —,
 * então quem identifica é o número e o título.
 */
function UnitRow({
  unit,
  seen,
  onMark,
}: {
  unit: TitleUnit
  /** Nulo quando a obra não é sua: sem progresso, não há visto nem não-visto. */
  seen: boolean | null
  onMark?: () => void
}) {
  const meta = [
    `${titleDetailCopy.units.number(unit.number)}`,
    unit.runtime ? titleDetailCopy.units.runtime(unit.runtime) : null,
    unit.date,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised">
      <RemoteArt
        src={unit.art}
        title={unit.title ?? String(unit.number)}
        className={`aspect-banner w-32 shrink-0 rounded-sm text-sm sm:w-40 ${
          seen === false ? 'opacity-60' : ''
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-faint text-xs tabular-nums">{meta}</p>
        <p className="mt-0.5 truncate font-medium text-ink text-sm">
          {unit.title ?? titleDetailCopy.units.untitled(unit.number)}
        </p>
        {unit.synopsis ? (
          <p className="mt-1 line-clamp-2 text-faint text-xs leading-relaxed">
            {unit.synopsis}
          </p>
        ) : (
          <p className="mt-1 text-faint text-xs italic">
            {titleDetailCopy.units.noSynopsis}
          </p>
        )}
      </div>

      {/* **Sem estado de usuário, sem alvo.** Numa entry que não é sua não há
       * progresso pra mover, e um botão que não faz nada é o que "affordance
       * descreve o que existe" proíbe. */}
      {seen !== null && (
        <button
          type="button"
          onClick={onMark}
          aria-pressed={seen}
          aria-label={titleDetailCopy.units.mark(unit.number)}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full sm:size-8 ${
            seen
              ? 'bg-ink text-surface'
              : 'border border-line text-faint transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
          }`}
        >
          {seen ? <Check /> : <Plus />}
        </button>
      )}
    </li>
  )
}

/**
 * A lista de unidades.
 *
 * **Não há tabela de episódio, e não vai haver**: a lista é apresentação do
 * contador (brief, 3.11). Uma unidade está vista quando o contador chegou nela,
 * e marcá-la é mover o contador até ali — inclusive pra trás, que o log
 * append-only registra como delta negativo.
 */
export function UnitList({
  units,
  progress,
  offset = 0,
  onIrPara,
}: {
  units: TitleUnit[]
  /** O contador da obra. Nulo quando ela não é sua. */
  progress: number | null
  /**
   * Quantas unidades vêm ANTES deste grupo.
   *
   * O contador é absoluto — "22 / 36" atravessa as temporadas —, então o
   * episódio 3 da segunda temporada é a unidade `offset + 3`. Quem sabe o
   * offset é quem conhece os grupos anteriores.
   */
  offset?: number
  onIrPara?: (absolute: number) => void
}) {
  return (
    <ul className="-mx-2 flex max-w-4xl flex-col">
      {units.map((unit) => {
        const absolute = offset + unit.number
        return (
          <UnitRow
            key={unit.number}
            unit={unit}
            seen={progress === null ? null : progress >= absolute}
            onMark={() => onIrPara?.(absolute)}
          />
        )
      })}
    </ul>
  )
}

export function UnitListSkeleton() {
  return (
    <ul className="-mx-2 flex max-w-4xl flex-col" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-start gap-3 px-2 py-2">
          <div className="aspect-banner w-32 shrink-0 animate-pulse rounded-sm bg-raised sm:w-40" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-3 w-32 animate-pulse rounded-sm bg-raised" />
            <div className="h-4 w-48 animate-pulse rounded-sm bg-raised" />
            <div className="h-3 w-full max-w-md animate-pulse rounded-sm bg-raised" />
          </div>
        </li>
      ))}
    </ul>
  )
}

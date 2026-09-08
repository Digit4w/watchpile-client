import { useEffect, useRef, useState } from 'react'
import { RailBox } from '@/components/media/title-rail'
import { type PickedPile, PilePicker } from '@/components/piles/pile-picker'
import type { Entry } from '@/domain/media'
import { useAddProgress } from '@/hooks/mutations/entries/use-add-progress'
import { useSetEntryPile } from '@/hooks/mutations/entries/use-set-entry-pile'
import { useUpdateEntry } from '@/hooks/mutations/entries/use-update-entry'
import { useEntryPiles } from '@/hooks/queries/entries/use-entry-piles'
import { useDebounced } from '@/hooks/use-debounced'
import { titleDetailCopy } from '@/routes/-title-detail.copy'

function Glyph({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

/**
 * O contador, **com rótulo**.
 *
 * "8 / ?" solto não dizia de quê — o dono chamou de "progresso solto sem
 * informação". A unidade vem do tipo de mídia (`progress_unit`), então em
 * mangá isto lê "chapters" sem uma linha de código nova.
 */
export function ProgressBox({
  entry,
  total,
  unit,
}: {
  entry: Entry
  /**
   * O teto efetivo — o da obra, ou o que o provedor sabe.
   *
   * `entries.total` é o que a pessoa escreveu ao adicionar, e fica nulo em
   * quase toda obra vinda da busca. Cair no do provedor é o que troca "8 / ?"
   * por "8 / 62", e ele também vira o teto do `+`, que é o certo: não dá pra
   * ver mais episódios do que a série tem.
   */
  total: number | null
  unit: string
}) {
  const advance = useAddProgress(entry.id)
  const atFloor = entry.progress <= 0
  const atCeiling = total !== null && entry.progress >= total
  const step =
    'flex size-8 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]'

  return (
    <RailBox label={titleDetailCopy.rail.progressOf(unit)}>
      <div className="flex items-center justify-between gap-1 px-2 pb-2">
        <button
          type="button"
          className={step}
          disabled={atFloor}
          onClick={() => advance.mutate({ delta: -1 })}
        >
          <Glyph d="M5 10h10" />
        </button>
        <span className="font-medium text-base text-ink tabular-nums">
          {entry.progress} <span className="text-faint">/ {total ?? '?'}</span>
        </span>
        <button
          type="button"
          className={step}
          disabled={atCeiling}
          onClick={() => advance.mutate({ delta: 1 })}
        >
          <Glyph d="M10 5v10M5 10h10" />
        </button>
      </div>
    </RailBox>
  )
}

/** As pilhas, com escrita imediata — a tela de detalhe não tem botão de salvar. */
export function PilesBox({ entry }: { entry: Entry }) {
  const piles = useEntryPiles(entry.id)
  const set = useSetEntryPile(entry.id)

  const current: PickedPile[] = (piles.data ?? []).map(({ id, name }) => ({
    id,
    name,
  }))

  return (
    <RailBox label={titleDetailCopy.piles}>
      <div className="px-3 pb-2.5">
        <PilePicker
          hideLabel
          selected={current}
          onChange={(next) => {
            const before = new Set(current.map(({ id }) => id))
            const after = new Set(next.map(({ id }) => id))
            for (const { id } of next) {
              if (!before.has(id)) {
                set.mutate({ pileId: id, member: true })
              }
            }
            for (const { id } of current) {
              if (!after.has(id)) {
                set.mutate({ pileId: id, member: false })
              }
            }
          }}
        />
      </div>
    </RailBox>
  )
}

/**
 * As notas, **fechadas quando vazias**.
 *
 * Na primeira versão a textarea vazia era o elemento mais alto da tela — para
 * um campo que quase sempre está vazio. Fechada, ela é uma linha; aberta,
 * cresce. O estado de gravação continua na própria peça, porque o app não tem
 * toast e um campo que grava calado é o pior dos dois mundos.
 */
export function NotesBox({ entry }: { entry: Entry }) {
  const update = useUpdateEntry(entry.id)
  const [open, setOpen] = useState(Boolean(entry.notes))
  const [text, setText] = useState(entry.notes ?? '')
  const behind = useDebounced(text, 600)
  const saved = useRef(entry.notes ?? '')

  useEffect(() => {
    if (behind === saved.current) {
      return
    }
    saved.current = behind
    update.mutate({ notes: behind || null })
  }, [behind, update])

  const dirty = text !== saved.current
  const mark = update.isError
    ? titleDetailCopy.notes.failed
    : dirty || update.isPending
      ? titleDetailCopy.notes.saving
      : titleDetailCopy.notes.saved

  if (!open) {
    return (
      <RailBox label={titleDetailCopy.notes.label}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full px-3 pb-2.5 text-left text-faint text-xs hover:text-ink"
        >
          {titleDetailCopy.rail.addNote}
        </button>
      </RailBox>
    )
  }

  return (
    <RailBox
      label={titleDetailCopy.notes.label}
      extra={
        text === '' && saved.current === '' ? null : (
          <span
            className={`text-[0.6875rem] ${update.isError ? 'text-danger' : 'text-faint'}`}
          >
            {mark}
          </span>
        )
      }
    >
      <div className="px-3 pb-2.5">
        <textarea
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={titleDetailCopy.notes.placeholder}
          className="w-full resize-y rounded-sm bg-card px-2 py-1.5 text-ink text-xs outline-none ring-1 ring-line placeholder:text-faint focus-visible:ring-[3px] focus-visible:ring-ink/50"
        />
      </div>
    </RailBox>
  )
}

/**
 * A nota do usuário — o primeiro editor de `rating` do app.
 *
 * **Campo de número, não estrelas.** A escala é 0–10 com uma casa decimal
 * (brief, 6), e nenhum widget de estrela expressa 8,3 — o mesmo raciocínio que
 * fez progresso ser número e nunca barra.
 */
export function YourScore({ entry }: { entry: Entry }) {
  const update = useUpdateEntry(entry.id)
  const [text, setText] = useState(
    entry.rating === null ? '' : entry.rating.toFixed(1),
  )

  /** Grava no BLUR: `8` a caminho de `8.4` é válido e viraria uma escrita. */
  function save() {
    const cleared = text.trim().replace(',', '.')
    if (cleared === '') {
      if (entry.rating !== null) {
        update.mutate({ rating: null })
      }
      return
    }

    const value = Number.parseFloat(cleared)
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      setText(entry.rating === null ? '' : entry.rating.toFixed(1))
      return
    }

    const rounded = Math.round(value * 10) / 10
    setText(rounded.toFixed(1))
    if (rounded !== entry.rating) {
      update.mutate({ rating: rounded })
    }
  }

  return (
    <div className="flex min-w-32 flex-1 flex-col gap-0.5 rounded-md px-3 py-2 ring-1 ring-line">
      <span className="text-[0.6875rem] text-faint uppercase tracking-wide">
        {titleDetailCopy.yourScore}
      </span>
      <span className="flex items-baseline gap-1">
        <input
          value={text}
          onChange={(event) =>
            setText(event.target.value.replace(/[^\d.,]/g, ''))
          }
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          inputMode="decimal"
          placeholder={titleDetailCopy.scoreEmpty}
          aria-label={titleDetailCopy.yourScore}
          className="w-12 bg-transparent font-medium text-ink text-xl tabular-nums outline-none placeholder:text-faint focus-visible:ring-[3px] focus-visible:ring-ink/50"
        />
        <span className="text-faint text-xs">/10</span>
      </span>
      <span className="text-faint text-xs">
        {entry.rating === null
          ? titleDetailCopy.scoreHint
          : titleDetailCopy.clearScore}
      </span>
    </div>
  )
}

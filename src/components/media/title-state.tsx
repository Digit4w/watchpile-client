import { useEffect, useRef, useState } from 'react'
import { RailBox } from '@/components/media/title-rail'
import { type PickedPile, PilePicker } from '@/components/piles/pile-picker'
import type { Entry } from '@/domain/media'
import { progressDelta } from '@/domain/progress-target'
import { minutesFrom, splitMinutes } from '@/domain/time-spent'
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

  /**
   * O NÚMERO é o campo — 10/09/2026, passo 2 do item 20.
   *
   * O `+`/`−` anda de um em um, que é o gesto do dia a dia. Voltar de um mangá
   * no capítulo 364 para o 12 são 352 cliques, e ninguém faz isso: o atalho
   * existia desde 28/08, mas **só no hover da CARTA** — a tela de detalhe, que é
   * a visão mais completa da obra, só tinha os dois botões.
   *
   * **Grava no BLUR, como a nota**, e pelo mesmo motivo: `1` a caminho de `12` é
   * um número válido e viraria uma escrita. Enter tira o foco em vez de
   * submeter, porque não há formulário aqui — a tela de detalhe não tem botão
   * de salvar.
   *
   * **Continua sendo evento de progresso e não reescrita do contador** (brief,
   * 3.11): o campo pede um alvo, e o que sai é o delta que leva até ele —
   * `domain/progress-target.ts`, com specs, e é a MESMA regra que o popover da
   * carta usa desde que ela saiu de lá.
   */
  const [typed, setTyped] = useState(String(entry.progress))
  /**
   * **O `+`/`−` também move o contador**, e sem isto o campo ficaria parado no
   * valor de antes — dois números para a mesma coisa, na mesma peça.
   *
   * Ajustar durante o render em vez de num efeito é o padrão que o React
   * documenta pra estado derivado: o efeito pintaria o valor velho por um
   * quadro, e este é o número que a pessoa está olhando enquanto clica.
   */
  const [seen, setSeen] = useState(entry.progress)
  if (seen !== entry.progress) {
    setSeen(entry.progress)
    setTyped(String(entry.progress))
  }

  function save() {
    const delta = progressDelta({ typed, progress: entry.progress, total })
    if (delta === null) {
      // Recusa devolve o campo ao que vale, em vez de deixar um número que não
      // é o contador parado na tela.
      setTyped(String(entry.progress))
      return
    }
    advance.mutate({ delta })
  }

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
        <span className="flex items-baseline gap-1 font-medium text-base text-ink tabular-nums">
          <input
            value={typed}
            onChange={(event) =>
              setTyped(event.target.value.replace(/[^\d]/g, ''))
            }
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
            inputMode="numeric"
            aria-label={titleDetailCopy.rail.progressOf(unit)}
            /* A largura acompanha o número: um campo fixo ficaria largo demais
             * num `8` e curto num `1094`, e esta caixa tem 200px. */
            size={Math.max(String(entry.progress).length, 1)}
            className="min-w-4 bg-transparent text-center tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50"
          />
          <span className="text-faint">/ {total ?? '?'}</span>
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

/**
 * O tempo investido — 10/09/2026, e ele **não é progresso**.
 *
 * ── Por que ele existe ao lado do contador, e não no lugar ─────────────────
 * *Quanto do acervo você percorreu* tem unidade, denominador e fim; *quanto
 * tempo você investiu* não tem nenhum dos três. Jogo é o caso que separou as
 * duas: ele **não conta** (`0044`) e ainda assim alguém quer registrar quarenta
 * horas. Quem decide se a caixa existe é o TIPO (`tracksTime`), como decide o
 * contador — e num tipo que faz as duas, as duas aparecem.
 *
 * ── DUAS caixas, e a razão é aritmética ────────────────────────────────────
 * Uma caixa de horas obrigaria a aceitar `38,5`, e aí a fração volta — agora na
 * tela em vez do schema, com um round-trip que perde: `2h05` são 2,083 horas, e
 * devolver `2,1` seria a tela mentindo sobre o que está gravado. Duas caixas não
 * arredondam nada, e a regra é pura (`domain/time-spent.ts`).
 *
 * ── Grava no BLUR, como a nota ─────────────────────────────────────────────
 * `3` a caminho de `38` é um número válido e viraria uma escrita. E as duas
 * caixas vazias LIMPAM, que é o "nunca registrou" da coluna — diferente de
 * zero, que é "registrei, e é zero".
 */
export function TimeBox({ entry }: { entry: Entry }) {
  const update = useUpdateEntry(entry.id)
  const [fields, setFields] = useState(() => splitMinutes(entry.timeSpent))

  /** O servidor é a verdade: escrita de outra aba, ou a nossa voltando atrás. */
  const [seen, setSeen] = useState(entry.timeSpent)
  if (seen !== entry.timeSpent) {
    setSeen(entry.timeSpent)
    setFields(splitMinutes(entry.timeSpent))
  }

  function save() {
    const minutes = minutesFrom(fields)
    if (minutes === null && (fields.hours.trim() || fields.minutes.trim())) {
      // Recusa devolve o campo ao que vale: um número inválido parado na tela
      // se lê como gravado.
      setFields(splitMinutes(entry.timeSpent))
      return
    }
    if (minutes !== entry.timeSpent) {
      update.mutate({ timeSpent: minutes })
    }
  }

  const box =
    'w-10 bg-transparent text-right tabular-nums outline-none placeholder:text-faint focus-visible:ring-[3px] focus-visible:ring-ink/50'

  return (
    <RailBox label={titleDetailCopy.rail.timeSpent}>
      {/**
       * **O blur é do GRUPO, não de cada caixa** — descoberto escrevendo o
       * teste. Com `onBlur` em cada `input`, digitar `38` e tabular para os
       * minutos gravava `38h00`, e sair dos minutos gravava `38h30`: **duas
       * escritas para uma edição**, e a primeira delas um valor que a pessoa
       * nunca quis. O `relatedTarget` diz se o foco ficou dentro do par.
       */}
      <fieldset
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            save()
          }
        }}
        className="flex min-w-0 items-baseline justify-center gap-1 px-2 pb-2 font-medium text-base text-ink"
      >
        {/* O nome do grupo já está no rótulo da caixa, e repeti-lo faria o
         * leitor de tela dizer "Time spent" duas vezes antes de cada campo. */}
        <legend className="sr-only">{titleDetailCopy.rail.timeSpent}</legend>
        <input
          value={fields.hours}
          onChange={(event) =>
            setFields((current) => ({
              ...current,
              hours: event.target.value.replace(/[^\d]/g, ''),
            }))
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          inputMode="numeric"
          placeholder="0"
          aria-label={titleDetailCopy.timeHours}
          className={box}
        />
        <span className="text-faint text-xs">
          {titleDetailCopy.timeHourUnit}
        </span>
        <input
          value={fields.minutes}
          onChange={(event) =>
            setFields((current) => ({
              ...current,
              minutes: event.target.value.replace(/[^\d]/g, ''),
            }))
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          inputMode="numeric"
          placeholder="0"
          aria-label={titleDetailCopy.timeMinutes}
          className={box}
        />
        <span className="text-faint text-xs">
          {titleDetailCopy.timeMinuteUnit}
        </span>
      </fieldset>
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

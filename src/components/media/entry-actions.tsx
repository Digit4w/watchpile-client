import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Entry, EntryStatus } from '@/domain/media'
import { ENTRY_STATUSES } from '@/domain/media'
import { useAddProgress } from '@/hooks/mutations/entries/use-add-progress'
import { useUpdateEntry } from '@/hooks/mutations/entries/use-update-entry'
import { appCopy } from '@/lib/copy'
import { homeCopy } from '@/routes/-home.copy'
import { CARD_SHORTCUT, EntryMenu } from './entry-menu'

const chip =
  'rounded-sm border px-2 py-1 text-xs transition-colors duration-[var(--motion-micro)] ease-chrome disabled:opacity-[var(--opacity-disabled)]'
const chipOn = `${chip} border-ink bg-ink text-surface`
const chipOff = `${chip} border-line text-muted hover:bg-raised`

/**
 * Edição rápida da obra: número exato de progresso e status.
 *
 * O `+/−` da base da carta anda de um em um, que é o gesto do dia a dia. Isto
 * aqui é a outra metade: voltar de um mangá no capítulo 364 para o 12 são 352
 * cliques, e ninguém faz isso.
 *
 * Continua sendo **evento de progresso, não reescrita do contador** (brief,
 * 3.11): o campo pede um alvo, e o que sai daqui é o delta que leva o contador
 * até ele. Corrigir para trás é um delta negativo, exatamente como o `−`.
 */
function EditTracking({ entry }: { entry: Entry }) {
  const addProgress = useAddProgress(entry.id)
  const update = useUpdateEntry(entry.id)
  const [target, setTarget] = useState(String(entry.progress))

  const number = Number(target)
  const valid = target.trim() !== '' && Number.isInteger(number) && number >= 0
  const delta = number - entry.progress
  const busy = addProgress.isPending || update.isPending

  return (
    <form
      className="flex flex-col gap-4 text-xs"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid && delta !== 0) {
          addProgress.mutate({ delta })
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <label className="text-muted" htmlFor={`progress-${entry.id}`}>
          {appCopy.entry.progressLabel}
        </label>
        <div className="flex items-center gap-2">
          <Input
            compact
            id={`progress-${entry.id}`}
            type="number"
            min={0}
            max={entry.total ?? undefined}
            value={target}
            disabled={busy}
            onChange={(event) => setTarget(event.target.value)}
            className="w-20 tabular-nums"
          />
          <span className="text-faint">
            {appCopy.entry.ofTotal}{' '}
            {entry.total ?? appCopy.progress.unknownTotal}
          </span>
          <button
            type="submit"
            disabled={busy || !valid || delta === 0}
            className="ml-auto rounded-sm bg-ink px-2.5 py-1.5 font-medium text-surface text-xs disabled:opacity-[var(--opacity-disabled)]"
          >
            {appCopy.entry.save}
          </button>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-muted">{homeCopy.widget.status}</legend>
        <div className="flex flex-wrap gap-1">
          {ENTRY_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              aria-pressed={entry.status === status}
              className={entry.status === status ? chipOn : chipOff}
              onClick={() => update.mutate({ status: status as EntryStatus })}
            >
              {appCopy.statuses[status]}
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  )
}

/**
 * A camada de hover da carta (`design/mockups/home.html`): a arte escurece e
 * dois atalhos redondos de vidro aparecem no centro.
 *
 * `opacity` e não montagem condicional — o conteúdo precisa existir pro
 * `transition` ter o que animar, e um popover aberto não pode sumir porque o
 * mouse saiu da carta pra ir até ele.
 *
 * **No toque não há hover**, então `home-motion.css` (`@media (hover: none)`)
 * troca a camada de véu por dois botões sempre visíveis no alto à direita — o
 * canto onde o mockup já punha o bookmark. Véu permanente sobre toda carta
 * deixaria a grade ilegível, e a arte é o conteúdo.
 *
 * O que segue em aberto ali é o alvo de toque: 32px, contra os ≥44px que a
 * seção 9 exige. Na carta de 133px não cabem dois alvos de 44, e é o mesmo
 * impasse já registrado no `+/−` compacto (`entry-progress.tsx`) — decisão da
 * seção 9, não deste componente.
 */
export function EntryActions({
  entry,
  pileId,
}: {
  entry: Entry
  /**
   * A pilha em que esta carta está sendo mostrada, quando há uma. É o que
   * acrescenta `Remove from pile` ao menu — e a ausência dele é o que mantém
   * o item fora da Home e de `/library`, onde não há pilha de onde tirar.
   */
  pileId?: number
}) {
  return (
    /**
     * `pointer-events-none` SEMPRE, e não só enquanto invisível — 07/09/2026.
     *
     * Ela cobre a carta inteira, e ligar `pointer-events` no hover era o que
     * bloqueava um link esticado por baixo: a camada absorvia o clique
     * exatamente no momento em que alguém clica. Agora quem captura são os dois
     * botões (`CARD_SHORTCUT`), que juntos ocupam ~76×32 no centro — o resto da
     * carta passa direto pro link.
     *
     * O `opacity` FICA aqui, e o item 12 do handoff propunha tirá-lo: o
     * problema nunca foi o contexto de empilhamento que ele cria, porque a
     * camada vem DEPOIS do link no DOM e os dois estão em `z-index` automático,
     * então os botões dela já pintam por cima. Era o `pointer-events`.
     *
     * O teclado não passa por `pointer-events`, então `focus-within` continua
     * acendendo a camada.
     */
    <div className="wp-card-actions pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-surface/0 opacity-0 transition-[opacity,background-color] duration-[var(--motion-chrome)] ease-chrome focus-within:bg-surface/40 focus-within:opacity-100 group-hover:bg-surface/40 group-hover:opacity-100">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={CARD_SHORTCUT}
            aria-label={appCopy.entry.editTracking}
            title={appCopy.entry.editTracking}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13 3l4 4L7 17H3v-4L13 3z" />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={8} className="w-64 p-3">
          <PopoverTitle className="mb-3 truncate text-faint text-xs uppercase tracking-wide">
            {entry.title}
          </PopoverTitle>
          <EditTracking entry={entry} />
        </PopoverContent>
      </Popover>

      {/* `EntryMenu` traz o próprio popover, ao contrário do de progresso
       * aqui em cima. Envolvê-lo num segundo daria popover dentro de popover
       * — e o de fora abria mostrando o GATILHO do de dentro, que foi
       * exatamente o que apareceu na tela ao trocar o menu pela peça
       * compartilhada. */}
      <EntryMenu entry={entry} pileId={pileId} />
    </div>
  )
}

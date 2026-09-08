import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { WidgetType } from '@/domain/home-widget'
import { SELECTABLE_WIDGET_TYPES } from '@/domain/home-widget'
import { homeCopy } from '@/routes/-home.copy'
import './home-motion.css'

/**
 * Miniatura animada de um tipo de widget. Não é ícone: é o formato do widget em
 * pequeno, se comportando como ele. A coreografia mora em
 * `widget-miniature.css`; aqui só a forma.
 */
function Miniature({ type }: { type: WidgetType }) {
  const frame =
    'wp-mini flex h-14 w-20 shrink-0 rounded-sm border border-line bg-surface'

  if (type === 'grid') {
    return (
      <span
        className={`${frame} grid grid-cols-3 content-center gap-1 p-2`}
        aria-hidden="true"
      >
        <span className="wp-mini-cell aspect-poster rounded-[2px] bg-gradient-to-br from-muted/60 to-line" />
        <span className="wp-mini-cell aspect-poster rounded-[2px] bg-gradient-to-tr from-line to-muted/50" />
        <span className="wp-mini-cell aspect-poster rounded-[2px] bg-gradient-to-b from-muted/40 to-line" />
        <span className="wp-mini-cell aspect-poster rounded-[2px] bg-gradient-to-bl from-line to-muted/60" />
        <span className="wp-mini-cell aspect-poster rounded-[2px] bg-gradient-to-br from-muted/50 to-line" />
        <span className="wp-mini-cell aspect-poster rounded-[2px] bg-gradient-to-tr from-line to-muted/40" />
      </span>
    )
  }

  if (type === 'scroll') {
    // A fita é duplicada porque o loop translada -50%: sem a cópia, o fim da
    // fita apareceria antes de o ciclo reiniciar.
    const covers = Array.from({ length: 8 }, (_, index) => index)
    return (
      <span className={`${frame} wp-mini-fade items-center`} aria-hidden="true">
        <span className="wp-mini-track flex gap-1.5 px-1.5">
          {covers.map((index) => (
            <span
              key={index}
              className={
                index % 2 === 0
                  ? 'h-10 w-5 shrink-0 rounded-[2px] bg-gradient-to-br from-muted/55 to-line'
                  : 'h-10 w-5 shrink-0 rounded-[2px] bg-gradient-to-br from-line to-muted/45'
              }
            />
          ))}
        </span>
      </span>
    )
  }

  return (
    <span
      className={`${frame} flex-col justify-center gap-1.5 px-2`}
      aria-hidden="true"
    >
      {[0, 1, 2].map((index) => (
        <span key={index} className="wp-mini-row flex items-center gap-1.5">
          <span className="h-3 w-2 shrink-0 rounded-[2px] bg-muted/70" />
          <span className="h-1 flex-1 rounded-full bg-muted/50" />
        </span>
      ))}
    </span>
  )
}

type WidgetPickerProps = {
  open: boolean
  onClose: () => void
  /** Clicar adiciona na primeira linha livre. */
  onPick: (type: WidgetType) => void
  /** Começo do arrasto: quem recebe é a grade, via `dropConfig`. */
  onDragType: (type: WidgetType) => void
  busy: boolean
}

/**
 * Painel de adicionar widget — folha lateral pela direita.
 *
 * **Sobrepõe a Home, e não é modal.** São duas coisas distintas, e as duas
 * importam:
 *
 * - **Sobrepõe** em vez de encolher a grade. Encolher não desarruma o layout
 *   (a grade é de 12 colunas da largura do container, então `x/w` não mudam),
 *   mas espreme cada widget — e em tela pequena isso é brutal. Sobrepondo, a
 *   disposição fica exatamente onde estava.
 * - **Não é modal.** Sem scrim e sem trava de foco, porque o gesto principal é
 *   arrastar daqui pra dentro da grade, e um overlay tornaria isso impossível.
 *   Por isso também não fecha ao clicar fora: soltar um arrasto sobre a grade
 *   é um `pointerdown` fora da folha, e fechar ali mataria o gesto no meio.
 *
 * Arrastar **e** clicar: arrastar escolhe o lugar, clicar joga na primeira linha
 * livre. Só arrastar puniria quem está no celular ou no teclado; só clicar
 * jogaria fora o motivo de o painel existir.
 */
export function WidgetPicker({
  open,
  onClose,
  onPick,
  onDragType,
  busy,
}: WidgetPickerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-label={homeCopy.picker.title}
        className="gap-0"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex items-start justify-between gap-2 border-line border-b p-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-sm">{homeCopy.picker.title}</h2>
            <p className="mt-1 text-faint text-xs leading-relaxed max-sm:hidden">
              {homeCopy.picker.hint}
            </p>
            <p className="mt-1 text-faint text-xs leading-relaxed sm:hidden">
              {homeCopy.picker.hintTouch}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={homeCopy.picker.close}
            className="-m-1 shrink-0 rounded-sm p-1 text-faint transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="scrollbar-styled flex-1 space-y-2 overflow-y-auto p-3">
          {SELECTABLE_WIDGET_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              draggable
              disabled={busy}
              onDragStart={(event) => {
                // O `react-grid-layout` só precisa de QUE algo está sendo
                // arrastado; o tipo viaja por fora, no callback, porque o
                // `dataTransfer` não é legível no `dragover`.
                event.dataTransfer.setData('text/plain', type)
                onDragType(type)
              }}
              onClick={() => onPick(type)}
              className="wp-picker-item flex w-full cursor-grab items-center gap-3 rounded-md border border-line p-2 text-left transition-colors duration-[var(--motion-micro)] ease-chrome hover:border-muted hover:bg-raised active:cursor-grabbing disabled:opacity-[var(--opacity-disabled)]"
            >
              <Miniature type={type} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">
                  {homeCopy.types[type]}
                </span>
                <span className="block text-faint text-xs leading-snug">
                  {homeCopy.typeHints[type]}
                </span>
              </span>
            </button>
          ))}

          <p className="px-2 pt-2 text-faint text-xs leading-relaxed">
            {homeCopy.picker.sourceNote}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

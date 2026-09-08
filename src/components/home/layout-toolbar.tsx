import { homeCopy } from '@/routes/-home.copy'

type LayoutToolbarProps = {
  editing: boolean
  pickerOpen: boolean
  onToggleEditing: () => void
  onTogglePicker: () => void
}

/**
 * Os controles de layout, numa barra flutuante de vidro embaixo e centralizada
 * (design/mockups/home-chrome.html).
 *
 * Três motivos pra não estarem no cabeçalho: o controle fica **onde a mão
 * está**, sobre a grade que se edita; o topo da tela fica só com o título; e é
 * o primeiro uso concreto do vidro fosco, decidido no design system (seção 2)
 * em 23/08/2026 sem nenhuma tela usando até agora.
 *
 * Parada é uma pílula; em edição a mesma barra cresce. Um lugar só pro assunto
 * "layout", em vez de botões espalhados.
 */
export function LayoutToolbar({
  editing,
  pickerOpen,
  onToggleEditing,
  onTogglePicker,
}: LayoutToolbarProps) {
  /**
   * Com o painel aberto a barra sai da frente dele. No celular o painel ocupa a
   * largura toda, então a barra some — o painel tem o próprio botão de fechar.
   */
  const bar = pickerOpen
    ? 'pointer-events-none sticky bottom-6 mt-auto flex justify-center pt-6 transition-[padding] duration-[var(--motion-chrome)] ease-chrome max-sm:hidden sm:pr-72'
    : 'pointer-events-none sticky bottom-6 mt-auto flex justify-center pt-6 transition-[padding] duration-[var(--motion-chrome)] ease-chrome'

  const shell =
    'pointer-events-auto flex items-center rounded-lg border border-line bg-glass shadow-lg backdrop-blur transition-all duration-[var(--motion-chrome)] ease-chrome'

  if (!editing) {
    return (
      <div className={bar}>
        <button
          type="button"
          onClick={onToggleEditing}
          className={`${shell} gap-2 px-4 py-2 font-medium text-ink text-sm hover:bg-raised`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="6" height="6" rx="1.5" />
            <rect x="11" y="3" width="6" height="6" rx="1.5" />
            <rect x="3" y="11" width="6" height="6" rx="1.5" />
            <path d="M14 11v6M11 14h6" />
          </svg>
          {homeCopy.editLayout}
        </button>
      </div>
    )
  }

  return (
    <div className={bar}>
      <div className={`${shell} gap-1 p-1`}>
        <button
          type="button"
          onClick={onTogglePicker}
          aria-expanded={pickerOpen}
          className={
            pickerOpen
              ? 'flex items-center gap-2 rounded-md bg-ink px-3 py-2 font-medium text-sm text-surface'
              : 'flex items-center gap-2 rounded-md px-3 py-2 font-medium text-ink text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised'
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M10 4v12M4 10h12" />
          </svg>
          {homeCopy.addWidget}
        </button>

        <span className="mx-1 h-5 w-px bg-line/60" />

        <button
          type="button"
          onClick={onToggleEditing}
          className="rounded-md px-3 py-2 text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
        >
          {homeCopy.doneEditing}
        </button>
      </div>
    </div>
  )
}

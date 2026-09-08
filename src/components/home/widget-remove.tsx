import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { homeCopy } from '@/routes/-home.copy'

type WidgetRemoveProps = {
  /** Dispara a saída do widget; quem anima e apaga é o `WidgetFrame`. */
  onConfirm: () => void
  disabled: boolean
  className: string
}

/**
 * A lixeira e a confirmação que sai dela (29/08/2026).
 *
 * Remover widget **não é destrutivo de verdade** — a pile e as obras
 * continuam lá —, então a confirmação existe por outro motivo: a lixeira mora
 * a seis pixels da engrenagem, num card que se arrasta, e o clique errado não
 * tinha volta nenhuma. O passo a mais custa um clique e devolve a chance de
 * desistir.
 *
 * É popover, não diálogo modal: a pergunta é sobre ESTE widget e sai de dentro
 * do botão que a provocou, sem escurecer a tela nem tirar a grade de vista.
 * Modal seria peso de decisão que esta não tem — e traria uma segunda camada
 * de chrome flutuante numa tela que já tem barra, folha lateral e popover.
 *
 * A alternativa considerada era toast com "undo", que dispensaria a
 * confirmação. Fica pra quando o design system tiver seção de feedback
 * transiente: hoje ele não tem, e adotar biblioteca de toast por causa de um
 * botão decidiria esse padrão pelo caminho errado.
 */
export function WidgetRemove({
  onConfirm,
  disabled,
  className,
}: WidgetRemoveProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${className} hover:text-danger data-[state=open]:text-danger`}
          aria-label={homeCopy.widget.remove}
          disabled={disabled}
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            {/* A tampa se solta e gira um tico quando o painel abre: o mesmo
             * "isto vai acontecer" que o resto do chrome dá, no glifo em vez
             * de numa cor. Coreografia em `home-motion.css`. */}
            <path className="wp-trash-lid" d="M4 6h12M8 6V4.5h4V6" />
            <path d="M6 6l.5 9.5h7L14 6" />
          </svg>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-64 p-3">
        <PopoverHeader>
          <PopoverTitle>{homeCopy.widget.removeTitle}</PopoverTitle>
          <PopoverDescription className="text-xs">
            {homeCopy.widget.removeBody}
          </PopoverDescription>
        </PopoverHeader>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-sm px-2.5 py-1.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
          >
            {homeCopy.widget.removeCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
            // Danger como TEXTO sobre um véu da própria cor, não como
            // preenchimento sólido: `tokens.css` registra que não existe
            // `--color-*-ink`, e um botão vermelho cheio precisaria decidir na
            // hora qual cor de texto vai por cima. O tratamento de texto já
            // vive nesta tela (a lixeira em `hover:text-danger`), então isto
            // não abre padrão novo — só o usa mais forte.
            className="rounded-sm bg-danger/10 px-2.5 py-1.5 font-medium text-danger text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-danger/20"
          >
            {homeCopy.widget.removeConfirm}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

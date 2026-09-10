import { useState } from 'react'
import { CheckIcon, ChevronIcon } from '@/components/menu/menu-icons'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/**
 * Escolher UM de N, como popover — a peça que substituiu o `<select>` nativo.
 *
 * ── Por que o nativo saiu ───────────────────────────────────────────────────
 * Ele era **o único controle do app desenhado pelo sistema operacional**, com a
 * estética dele: a lista aberta não é DOM, então nem o token nem o
 * `color-scheme` a alcançam por inteiro, e o app resolve escolha com popover em
 * todo lugar menos ali. Quatro sítios sobreviviam assim — o `Source` de
 * `/search`, o provedor da folha de vincular e os dois do widget da Home —, e
 * eles não tinham sido decididos: cada um copiou o anterior.
 *
 * **Isto não desfaz o `color-scheme: dark`**, e os dois não se substituem: o
 * botão de escolher arquivo, o `spinner` do campo de número e a barra de
 * rolagem continuam sendo desenhados pelo navegador, e é a declaração que os
 * conserta.
 *
 * ── O que é da peça e o que fica de fora ────────────────────────────────────
 * A peça é o painel e a linha; **o que cada chamador decide é o que fazer com
 * UMA opção só** — `/search` mostra o nome como texto (o rótulo `Source` ao
 * lado já diz o que aquilo é), e a folha de vincular esconde tudo (ali não há
 * rótulo, e uma palavra solta no meio do formulário não se explica). É a mesma
 * divisão que `action-menu.tsx` fixou: padroniza-se o painel, nunca o gatilho.
 */
export function ChoicePicker<Value extends string>({
  options,
  value,
  onSelect,
  ariaLabel,
  disabled,
  width = 'w-48',
  align = 'end',
}: {
  options: readonly { value: Value; label: string }[]
  value: Value
  onSelect: (value: Value) => void
  ariaLabel: string
  disabled?: boolean
  /** A largura do painel. O gatilho segue o conteúdo dele. */
  width?: string
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const label = options.find((option) => option.value === value)?.label ?? ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className="flex h-9 min-w-0 cursor-pointer items-center gap-1 rounded-md px-2 text-ink text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised focus-visible:ring-[3px] focus-visible:ring-ink/50 disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]"
        >
          <span className="min-w-0 truncate">{label}</span>
          <ChevronIcon size={12} open={open} />
        </button>
      </PopoverTrigger>

      <PopoverContent align={align} sideOffset={4} className={`${width} p-1`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            // `menuitemradio` e não `option`: escolha única, e quem lê tela
            // precisa ouvir qual está marcada sem depender do visto.
            role="menuitemradio"
            aria-checked={option.value === value}
            onClick={() => {
              onSelect(option.value)
              setOpen(false)
            }}
            className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm ${
              option.value === value
                ? 'text-ink'
                : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.value === value && <CheckIcon />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

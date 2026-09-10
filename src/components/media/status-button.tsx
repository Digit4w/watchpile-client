import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { STATUS_ORDER } from '@/domain/library-view'
import type { Entry, EntryStatus } from '@/domain/media'
import { useUpdateEntry } from '@/hooks/mutations/entries/use-update-entry'
import { appCopy } from '@/lib/copy'

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
 * As quatro formas do controle de status, e a razão de serem quatro é a mesma
 * de `EntryProgress` ter três: o TAMANHO do alvo e a LARGURA da peça.
 *
 * - `rail` — a coluna do detalhe: botão primário de largura toda. É a forma
 *   original, de 01/09/2026, e a única que não substitui um contador.
 * - `card` — a base da carta de pôster, no lugar do `+`/`−`.
 * - `row` / `row-dense` — a célula de progresso das duas listas.
 *
 * **As três últimas têm a largura do contador que substituem**, e isso não é
 * capricho: numa lista de tipo misto — um filme e uma série lado a lado — uma
 * célula estreita e outra larga desalinhariam o título de todas as linhas, e a
 * coluna `Progress` deixaria de ser uma coluna. O número sai da geometria do
 * contador (`entry-progress.tsx`): 44+4+80+4+44 no toque, 28+4+80+4+28 no
 * ponteiro.
 */
type StatusVariant = 'rail' | 'card' | 'row' | 'row-dense' | 'cell'

const SHELL: Record<StatusVariant, string> = {
  /**
   * A coluna `Status` das listas — 10/09/2026, decisão do dono.
   *
   * Ela era rótulo de LEITURA, e desde o conserto de 07/09 um filme ou jogo em
   * modo lista **não tinha como mudar de status sem abrir a obra**. Agora a
   * coluna inteira é o controle, em TODAS as linhas: duas coisas diferentes na
   * mesma coluna é exatamente a confusão que aquele conserto tirou.
   *
   * `w-20` porque é a largura que a coluna já tinha — a peça entra no ritmo da
   * linha, não o contrário (design system, seção 8, quarta leva).
   */
  cell: 'h-7 w-20 justify-start gap-1 rounded-sm text-faint text-xs hover:bg-raised hover:text-ink',
  rail: 'h-11 w-full justify-center gap-2 rounded-md bg-ink font-medium text-sm text-surface hover:opacity-90',
  card: 'h-7 w-full justify-center gap-1 rounded-sm text-[11px] text-muted hover:bg-raised hover:text-ink',
  row: 'h-11 w-44 justify-center gap-1 rounded-sm text-faint text-xs hover:bg-raised hover:text-ink sm:h-7 sm:w-36',
  /**
   * A compacta ganhou o alvo de toque em 10/09/2026, junto com o `+`/`−` que
   * ela substitui — as duas peças ocupam a mesma célula, e uma largura
   * diferente faria a coluna `Progress` deixar de ser coluna numa lista de
   * tipo misto.
   */
  'row-dense':
    'h-11 w-44 justify-center gap-1 rounded-sm text-faint text-xs hover:bg-raised hover:text-ink sm:h-7 sm:w-36',
}

/**
 * O status — **a peça que edita, não a que informa**.
 *
 * ── Por que ela existe na coluna do detalhe ────────────────────────────────
 * A primeira versão empilhava os cinco como linhas de menu: cabia, mas gastava
 * 130px pra dizer uma palavra, e o dono pediu mais destaque perto da foto. O
 * status é **a coisa que muda mais** numa obra em andamento e a primeira que se
 * olha; virar o botão primário da coluna é o que reflete isso.
 *
 * O tratamento primário do sistema é `bg-ink text-surface` — branco sobre
 * escuro, não uma cor. O chrome é neutro (design system, seção 2), e o roxo da
 * referência é justamente o que não temos.
 *
 * As cinco opções vão pra um popover: elas são cinco, exclusivas, e nenhuma
 * precisa estar visível enquanto não se troca.
 *
 * ── Por que ela saiu do detalhe e virou peça de `components/media` ─────────
 * Em 07/09/2026 o tipo que não conta progresso passou a mostrar o STATUS no
 * lugar do contador (decisão do dono), nos três lugares onde o contador mora.
 * "A mesma peça nos três lugares" é a leitura direta do pedido — o que muda de
 * um pro outro é a VARIANTE, não a peça.
 */
export function StatusButton({
  entry,
  variant = 'rail',
}: {
  entry: Entry
  variant?: StatusVariant
}) {
  const update = useUpdateEntry(entry.id)
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex shrink-0 cursor-pointer items-center outline-none transition-[opacity,background-color,color] duration-[var(--motion-micro)] ease-chrome focus-visible:ring-[3px] focus-visible:ring-ink/50 ${SHELL[variant]}`}
        >
          <span className="truncate">{appCopy.statuses[entry.status]}</span>
          <Glyph
            d="M6 8.5 10 12.5 14 8.5"
            size={variant === 'rail' ? 14 : 12}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-52 p-1">
        {STATUS_ORDER.map((value: EntryStatus) => (
          <button
            key={value}
            type="button"
            role="menuitemradio"
            aria-checked={entry.status === value}
            onClick={() => {
              update.mutate({ status: value })
              setOpen(false)
            }}
            className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm ${
              entry.status === value
                ? 'text-ink'
                : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
            }`}
          >
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              {entry.status === value && (
                <Glyph d="M4.5 10.5 8 14 15.5 6" size={13} />
              )}
            </span>
            {appCopy.statuses[value]}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

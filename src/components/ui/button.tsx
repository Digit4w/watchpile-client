import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-ink/50 disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)] aria-invalid:border-danger aria-invalid:ring-danger/20 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-ink text-surface hover:bg-ink/90',
        /**
         * **`destructive` NÃO desbota ao ser desabilitado** — 10/09/2026,
         * decisão do dono (design system, decisão em aberto 14, fechada).
         *
         * Medido em 04/09: com `--opacity-disabled` o par cai a **3,97:1**,
         * abaixo do mínimo da seção 9, e nenhuma opacidade que ainda leia como
         * inerte o salva — `danger` está a 6,96 da cor da página contra os 16,93
         * do `ink`, então a desbotada o consome.
         *
         * A saída **não foi isentar**: foi tirar o `destructive` do vocabulário
         * de RECUSA. Ele só fica desabilitado enquanto a escrita está no ar, e
         * **isso é ESPERA, não recusa** — espera se diz trocando o rótulo, não
         * apagando a peça. Com o preenchimento cheio, o contraste nunca sai de
         * onde foi medido.
         *
         * **Consequência que vale antes do próximo uso:** se um dia um botão
         * `destructive` precisar ficar desabilitado por RECUSA, ele não é a peça
         * certa — a recusa se anuncia com a peça inerte e o motivo ao lado
         * (design system, seção 5), e não com um vermelho apagado.
         */
        destructive:
          'bg-danger text-danger-ink hover:bg-danger/90 focus-visible:ring-danger/20 disabled:opacity-100',
        outline:
          'border border-line bg-surface shadow-xs hover:bg-raised hover:text-ink',
        secondary: 'bg-raised text-ink hover:bg-raised/80',
        ghost: 'hover:bg-raised hover:text-ink',
        link: 'text-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Gerado por `npx shadcn add sheet` e adaptado (client/CLAUDE.md: editar
 * arquivo do shadcn é permitido, em commit próprio).
 *
 * Três mudanças, e as duas primeiras são de produto, não de estilo:
 *
 * 1. **O scrim saiu.** O `SheetContent` original renderiza um `SheetOverlay`
 *    escuro por cima da tela. No Watchpile a folha existe pra se arrastar de
 *    dentro dela pra fora — um overlay tornaria isso impossível.
 * 2. **`Sheet` é não-modal por padrão** (`modal={false}`): sem trava de foco e
 *    sem bloquear ponteiro fora dela. `Esc` continua fechando, e o Radix
 *    continua segurando a desmontagem até a animação de saída terminar — mas
 *    **quem anima é `styles/motion.css`**, não ele. A versão anterior deste
 *    comentário dizia que a animação "vinha do Radix", e foi por acreditar
 *    nisso que ninguém reparou que as classes `animate-in`/`slide-in-*` do
 *    shadcn não existiam neste projeto: elas são do `tw-animate-css`, que
 *    nunca foi instalado, e toda folha aparecia num quadro só (30/08/2026).
 * 3. Tokens do Watchpile no lugar de `bg-background`/`ring-ring`, e as durações
 *    da seção 11 do design system no lugar de `duration-300`/`duration-500`.
 *
 * Quem usa ainda precisa impedir que clicar fora feche: soltar um arrasto sobre
 * a grade é um `pointerdown` fora da folha.
 */

function Sheet({
  modal = false,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" modal={modal} {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetPrimitive.Content
        data-slot="sheet-content"
        // O `data-side` é escrito aqui à mão porque a primitiva por baixo é o
        // Dialog, que não tem noção de lado — só o Popover emite isto sozinho.
        // É o que `styles/motion.css` lê pra saber de que borda a folha entra.
        data-side={side}
        className={cn(
          // Só posição e superfície. O movimento é de `styles/motion.css`, por
          // `data-slot` + `data-side` — as classes de animação que o shadcn
          // punha aqui pertenciam a um plugin que este projeto não usa.
          'fixed z-50 flex flex-col gap-4 bg-card shadow-2xl',
          side === 'right' &&
            'inset-y-0 right-0 h-full w-full border-line border-l sm:w-72',
          side === 'left' &&
            'inset-y-0 left-0 h-full w-full border-line border-r sm:w-72',
          side === 'top' && 'inset-x-0 top-0 h-auto border-line border-b',
          side === 'bottom' && 'inset-x-0 bottom-0 h-auto border-line border-t',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-sm p-1 text-faint transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50 disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}

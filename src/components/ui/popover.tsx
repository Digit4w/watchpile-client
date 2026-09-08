import { Popover as PopoverPrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Gerado por `npx shadcn add popover` e adaptado aos tokens do Watchpile
 * (client/CLAUDE.md: editar arquivo do shadcn é permitido, em commit próprio).
 *
 * O que mudou em relação ao original: `bg-popover`/`text-popover-foreground`
 * não existem no nosso tema. Popover é chrome flutuante, então vale a decisão
 * de vidro fosco do design system (seção 2) — `bg-glass` + `backdrop-blur` —,
 * com `rounded-lg`, que é o raio de popover/modal (seção 4).
 *
 * **O movimento saiu daqui e foi pra `styles/motion.css`** (30/08/2026). As
 * classes `animate-in`/`fade-in-0`/`zoom-in-95` que estavam neste arquivo são
 * do plugin `tw-animate-css`, que nunca foi instalado: o CSS gerado não tinha
 * nenhuma delas e todo popover do app aparecia num quadro só. A escala do
 * `zoom-in-95` não voltou — ver o porquê em `motion.css`.
 */

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // `origin-(--radix-popover-content-transform-origin)` saiu junto com
          // a escala: sem `zoom`, não há o que originar de canto nenhum.
          'z-50 w-72 rounded-lg border border-line bg-glass p-4 text-ink shadow-2xl outline-hidden backdrop-blur',
          // **O teto é do ESPAÇO, não do conteúdo** (07/09/2026). O Radix já
          // vira o painel pro lado que cabe melhor, mas nada nele impede o
          // conteúdo de passar da tela: o menu de `/piles/:id` empilha três
          // seções — tipo, ordenação e exibição — e com seis tipos de mídia as
          // últimas linhas ficavam fora da janela, sem rolagem e sem alcance.
          //
          // Vale na PRIMITIVA e não na tela que doeu primeiro, porque o defeito
          // é da peça: `/library` e `/search` têm o mesmo menu e só não
          // estouraram ainda. Consertar no consumidor deixaria o próximo errado
          // — que é o mesmo argumento do tingimento de `raised` sobre vidro.
          //
          // Os três painéis que já limitam a própria lista (`pile-picker`,
          // `icon-picker`, `entry-piles`) continuam mandando: o teto de dentro
          // é menor, então nada muda pra eles.
          'scrollbar-styled max-h-(--radix-popover-content-available-height) overflow-y-auto',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-1 text-sm', className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <div
      data-slot="popover-title"
      className={cn('font-medium', className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-muted', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}

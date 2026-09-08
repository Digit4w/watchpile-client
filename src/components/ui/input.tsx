import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Gerado por `npx shadcn add input` e adaptado aos tokens do Watchpile.
 *
 * `compact` é acréscimo nosso (29/08/2026): os campos dentro de popover —
 * nome do widget, busca de pilha, progresso exato — precisam de uma altura
 * bem menor que os 36px do formulário de login, e estavam sendo escritos à
 * mão em cada lugar. O que se perdia junto era o **anel de foco**: sem ele o
 * navegador desenhava o próprio, azul, contra a decisão da seção 9 do design
 * system (anel neutro `ink`, 3px, sem offset). Uma vez aqui, seis campos
 * param de poder divergir.
 */
type InputProps = React.ComponentProps<'input'> & {
  /** Versão de popover: menor, sobre `card` em vez de `raised`. */
  compact?: boolean
}

const focus =
  'outline-none focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-ink/50'

/**
 * **`type="search"` não chega ao DOM — 07/09/2026.**
 *
 * Cada motor desenha o próprio botão de limpar, com o próprio desenho e a
 * própria regra de quando aparecer: o Chrome mostra no hover, o Firefox mostra
 * um `×` com estilo dele. Os seis campos de busca do app ficavam diferentes uns
 * dos outros dependendo de onde eram abertos.
 *
 * **E não dá pra esconder o do Firefox por CSS.** O
 * `::-webkit-search-cancel-button` só existe em WebKit e Blink; do lado do
 * Firefox não há pseudo-elemento — nem padrão nem `-moz-` —, e a proposta de
 * expor um segue aberta no CSSWG. Então a única saída que vale nos dois é o
 * campo **não ser** um `search`.
 *
 * `role="searchbox"` fica no lugar, porque o que `type="search"` dá de útil é
 * semântica de leitor de tela, e essa não se perde. O que se perde é o limpar
 * nativo — e a peça que o substitui é decisão do design system, não deste
 * arquivo: hoje o app não tem nenhuma, e os seis campos limpam apagando o
 * texto, como sempre limparam no Firefox.
 */
function Input({ className, type, compact, ...props }: InputProps) {
  const isSearch = type === 'search'

  return (
    <input
      type={isSearch ? 'text' : type}
      role={isSearch ? 'searchbox' : undefined}
      data-slot="input"
      className={cn(
        'w-full min-w-0 border border-line transition-[color,box-shadow] selection:bg-ink selection:text-surface placeholder:text-faint disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]',
        compact
          ? 'rounded-sm bg-card px-2 py-1 text-ink text-xs'
          : 'h-9 rounded-md bg-raised px-3 py-1 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-ink file:text-sm md:text-sm',
        focus,
        'aria-invalid:border-danger aria-invalid:ring-danger/20',
        className,
      )}
      {...props}
    />
  )
}

/**
 * O `<select>` nativo com o mesmo tratamento. Não é componente do shadcn —
 * eles usam `Select` do Radix, que é outro peso —, mas o anel de foco é do
 * sistema e não pode depender de qual elemento se usou.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'rounded-sm border border-line bg-card px-2 py-1 text-ink text-xs transition-[color,box-shadow]',
        focus,
        className,
      )}
      {...props}
    />
  )
}

export { Input, NativeSelect }

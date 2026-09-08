import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { appCopy } from '@/lib/copy'

/**
 * O menu de `⋯` do app — **um só**.
 *
 * ── Por que ele existe ─────────────────────────────────────────────────────
 * Ele nasceu tarde: quando o dono apontou que o menu da tela de detalhe não
 * parecia o da Home, havia **cinco** menus escritos à mão, e os cinco tinham
 * derivado. A carta usava `w-64 p-2` com texto de 12px e ícone de 14; a pilha
 * usava `w-56 p-1` com texto de 14px e ícone de 16; um deles não tinha ícone
 * nenhum; a divisória era `h-px bg-line/60` em dois arquivos e
 * `border-t border-line` em outros dois; e o item destrutivo ficava vermelho
 * só no hover em três deles.
 *
 * Nenhuma dessas diferenças foi decidida — todas são o sexto arquivo copiando
 * o quinto sem olhar o primeiro. **A régua: peça que aparece em três telas
 * para de ser markup e vira componente**, senão a próxima tela escolhe de novo,
 * e escolhe diferente.
 *
 * ── O que ficou como padrão, e de onde veio ────────────────────────────────
 * - **Largura `w-64`**, da carta: é onde o painel de pilhas já cabia, e cortar
 *   pra `w-56` encolheria a lista sem ganhar nada
 * - **Texto `text-sm` e ícone de 16px**, da pilha: 12px é tamanho de rótulo
 *   auxiliar, não de ação primária — e um menu é uma lista de ações primárias
 * - **`p-1` no painel**, com `px-2` na linha: 12px do texto até a borda. Vista
 *   que não é lista (confirmação, painel de pilhas) entra num `ActionMenuPanel`
 * - **Destrutivo é vermelho SEMPRE**, não só no hover: cor de aviso que só
 *   aparece quando o ponteiro já está em cima chega tarde demais pra avisar
 * - **`cursor-pointer` mora aqui.** A decisão em aberto #7 (cursor no app
 *   inteiro) segue aberta; o que este arquivo resolve é a divergência ENTRE os
 *   menus, que é outra coisa
 */

/** O `⋯`. Havia três desenhos dele, com raios e tamanhos diferentes. */
export function MoreIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="4.5" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="15.5" cy="10" r="1.5" />
    </svg>
  )
}

const ITEM =
  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors duration-[var(--motion-micro)] ease-chrome disabled:cursor-default disabled:opacity-[var(--opacity-disabled)]'

const TONE = {
  default: 'text-muted hover:bg-raised hover:text-ink',
  /**
   * Vermelho já em repouso. Nos menus antigos ele era `text-muted` com
   * `hover:text-danger`, o que só avisa quem já está apontando pra ação — e
   * quem já apontou não precisa mais do aviso.
   */
  danger: 'text-danger hover:bg-danger/10',
} as const

export function ActionMenuItem({
  icon,
  tone = 'default',
  submenu = false,
  children,
  ...props
}: {
  /** O glifo à esquerda, 16px. Todo item tem um — linha sem ícone numa lista
   * com ícone lê como item de outra categoria. */
  icon: ReactNode
  tone?: keyof typeof TONE
  /** Item que ABRE outra vista em vez de agir: ganha a seta à direita. */
  submenu?: boolean
  children: ReactNode
} & React.ComponentProps<'button'>) {
  return (
    <button type="button" className={`${ITEM} ${TONE[tone]}`} {...props}>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
      {submenu && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto shrink-0"
          aria-hidden="true"
        >
          <path d="M8 4l6 6-6 6" />
        </svg>
      )}
    </button>
  )
}

/**
 * O item que NAVEGA, e por isso é `<a>` e não `<button>`.
 *
 * Um destino escrito como botão perde o que um link tem de graça — abrir em
 * outra aba, copiar o endereço, o cursor que diz que ali se vai a algum lugar.
 * O desenho é o mesmo do `ActionMenuItem`: o que muda é o elemento, e é o
 * elemento que carrega o significado.
 */
export function ActionMenuLink({
  icon,
  children,
  ...props
}: {
  icon: ReactNode
  children: ReactNode
} & Omit<LinkProps, 'children'>) {
  return (
    <Link className={`${ITEM} ${TONE.default}`} {...props}>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  )
}

export function ActionMenuSeparator() {
  return <span className="my-1 block h-px bg-line/60" aria-hidden="true" />
}

/**
 * Uma vista que não é lista — a confirmação, o painel de pilhas.
 *
 * Ela precisa do padding que a linha carrega no próprio `px-2`, senão o
 * conteúdo encosta na borda do painel.
 */
export function ActionMenuPanel({ children }: { children: ReactNode }) {
  return <div className="p-1">{children}</div>
}

/** A saída de uma sub-vista, no canto onde o polegar já está. */
export function ActionMenuBack({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-1 flex cursor-pointer items-center gap-1 self-start rounded-sm px-1 py-0.5 text-faint text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 4l-6 6 6 6" />
      </svg>
      {appCopy.entry.back}
    </button>
  )
}

/**
 * A confirmação de uma ação irreversível, DENTRO do menu que a provocou.
 *
 * Segundo popover empilhado por cima seria dois níveis de foco preso; diálogo
 * modal tiraria a pergunta de perto do item sobre o qual ela é. Isto estava
 * escrito quatro vezes, com a mesma forma e três larguras de botão.
 *
 * O botão destrutivo é **texto vermelho sobre véu da própria cor**, não
 * preenchimento sólido. O motivo escrito aqui era a falta de
 * `--color-danger-ink`, e ele **caiu em 04/09/2026**, quando o token nasceu; o
 * véu fica pelo motivo que sobrou, e que é melhor: isto vive dentro de um
 * popover de VIDRO, e preenchimento opaco sobre superfície translúcida anula a
 * translúcida (a régua de 01/09). Quem tem fundo opaco por baixo — a confirmação
 * de `Unlink`, sobre `surface` — usa o sólido.
 */
export function ActionMenuConfirm({
  title,
  body,
  confirmLabel,
  pending = false,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ActionMenuPanel>
      <PopoverHeader>
        <PopoverTitle>{title}</PopoverTitle>
        <PopoverDescription className="text-xs">{body}</PopoverDescription>
      </PopoverHeader>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-sm px-2.5 py-1.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
        >
          {appCopy.entry.cancel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="cursor-pointer rounded-sm bg-danger/10 px-2.5 py-1.5 font-medium text-danger text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-danger/20 disabled:cursor-default disabled:opacity-[var(--opacity-disabled)]"
        >
          {confirmLabel}
        </button>
      </div>
    </ActionMenuPanel>
  )
}

/**
 * O menu inteiro. `trigger` é o botão — cada chamador desenha o seu, porque o
 * `⋯` da carta é redondo e de vidro, o da linha aparece no hover e o do título
 * tem 44px. **O que se padroniza é o painel, não o gatilho.**
 */
export function ActionMenu({
  open,
  onOpenChange,
  trigger,
  align = 'end',
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  align?: 'start' | 'center' | 'end'
  children: ReactNode
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} sideOffset={8} className="w-64 p-1">
        {children}
      </PopoverContent>
    </Popover>
  )
}

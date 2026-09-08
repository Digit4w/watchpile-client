import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * O cabeçalho de uma seção de Settings.
 *
 * **Não é o cabeçalho de duas faixas de `/library` e `/piles`** (design system,
 * seção 5), e a diferença é semântica, não visual: a faixa de baixo daquele é
 * sobre RECORTE, e seção não tem recorte — seção é destino, e destino mora na
 * coluna e na URL.
 *
 * O título some no celular (`max-md:hidden`) porque a barra de cima já o diz, e
 * dois títulos empilhados gastariam 72 dos ~800px que a tela tem — a mesma
 * conta que tirou o título de `/library` do telefone.
 */
export function SectionHeader({
  title,
  body,
  Icon,
  action,
}: {
  title: string
  body: string
  Icon: LucideIcon
  /** A ação primária da seção, quando ela tem uma. */
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-semibold text-ink text-lg max-md:hidden">
          <Icon
            className="shrink-0 text-muted"
            size={18}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          <span>{title}</span>
        </h1>
        <p className="mt-1 max-w-prose text-muted text-sm">{body}</p>
      </div>
      {action}
    </header>
  )
}

/**
 * Um par rótulo/valor de uma seção que só LÊ.
 *
 * **Divisória entre as linhas, nunca caixa** (design system, seção 5): o painel
 * já é um container, e agrupar com uma caixa dentro dele é o "card dentro de
 * card" que `research/yamtrack/settings-shell.md` recusou. Settings é onde essa
 * tentação bate mais forte.
 */
export function SettingsFact({
  label,
  value,
  body,
}: {
  label: string
  value: string
  body?: string
}) {
  return (
    <div className="flex flex-col gap-1 border-line border-b py-4 first:pt-0 last:border-b-0">
      <p className="text-faint text-xs uppercase tracking-wide">{label}</p>
      <p className="text-ink text-sm">{value}</p>
      {body && <p className="max-w-prose text-muted text-sm">{body}</p>}
    </div>
  )
}

import { Switch } from '@/components/ui/switch'
import type { MediaTypeInfo } from '@/domain/media-type'
import { iconFor } from './icon-set'

/**
 * A linha de um tipo de mídia com um liga/desliga no fim.
 *
 * É a linha de `/settings/media-types` com o CHEVRON trocado pelo TOGGLE —
 * mesmos 56px, mesma ordem de campos, mesmo `-mx-3` no invólucro (design
 * system, seção 5). Não é economia de markup, é **reconhecimento**: quem
 * desligou "Book" no wizard vai procurá-lo em Preferences depois, e encontrar a
 * MESMA linha é o que diz que é a mesma coisa.
 *
 * **Ela nasceu dentro de `/setup` e saiu de lá ao ganhar o segundo uso** — a
 * régua dos dois usos do inventário —, e mora em `components/media/` e não numa
 * pasta de domínio porque a coisa é de todo mundo: o wizard e o Settings não
 * são donos um do outro.
 *
 * Sai a contagem de obras. No wizard não existe obra; em Preferences a
 * contagem que o servidor tem é a de TODOS os usuários, e esta tela é de uma
 * pessoa só.
 *
 * `disabled` com `reason` é a recusa anunciada antes do clique (design system,
 * seção 5): quem desabilita diz por quê, e o motivo é lido junto do rótulo.
 */
export function MediaTypeToggleRow({
  type,
  on,
  onToggle,
  noUnitLabel,
  toggleLabel,
  disabled,
  reason,
}: {
  type: MediaTypeInfo
  on: boolean
  onToggle: (next: boolean) => void
  /** Vazio se lê como "não carregou", não como "este tipo não conta nada". */
  noUnitLabel: string
  toggleLabel: (name: string) => string
  disabled?: boolean
  reason?: string
}) {
  const Icon = iconFor(type.icon)
  const labelId = `media-type-${type.slug}`

  return (
    <li className="flex h-14 items-center gap-3 rounded-md px-3">
      <Icon
        className="shrink-0 text-muted"
        size={18}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span id={labelId} className="min-w-0 flex-1 truncate text-ink text-sm">
        {type.name}
      </span>
      <span className="shrink-0 text-faint text-sm">
        {type.progressUnit ?? noUnitLabel}
      </span>
      <Switch
        checked={on}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={disabled && reason ? `${labelId}-reason` : undefined}
      />
      <span className="sr-only">{toggleLabel(type.name)}</span>
      {disabled && reason && (
        <span id={`${labelId}-reason`} className="sr-only">
          {reason}
        </span>
      )}
    </li>
  )
}

export function MediaTypeToggleSkeleton() {
  return (
    <ul className="-mx-3 mt-2 flex flex-col">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <li key={row} className="flex h-14 items-center gap-3 px-3">
          <span className="size-[18px] shrink-0 animate-pulse rounded-sm bg-raised" />
          <span className="h-4 w-28 animate-pulse rounded-sm bg-raised" />
          <span className="ml-auto h-4 w-16 animate-pulse rounded-sm bg-raised" />
          <span className="h-5 w-9 shrink-0 animate-pulse rounded-full bg-raised" />
        </li>
      ))}
    </ul>
  )
}

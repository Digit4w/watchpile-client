import { CheckIcon } from '@/components/menu/menu-icons'
import type { EntryStatus } from '@/domain/media'
import { appCopy } from '@/lib/copy'

/**
 * O selo de `completed` — 14/11/2026, decisão do dono.
 *
 * ── Por que selo, e não o ✓ no contador ─────────────────────────────────────
 * A primeira versão pôs o ✓ antes do número, na linha do contador, e o "/
 * total" saía quando a obra concluía no fim (`✓ 62`). Foi construída com
 * mockup e mergeada, e o dono a derrubou olhando as capturas: *"muito feio"*.
 * O selo é o vocabulário que a carta já tinha pra dizer o que a obra É ou
 * TEM — tipo e nota, os dois em vidro sobre a arte (design system, seção 2) —,
 * e o contador volta a ser só o contador.
 *
 * **Quem decide é o STATUS, nunca o número.** `completed` em `12 / 24` é
 * legítimo, `24 / 24` em `watching` também (brief, 3.16), e por isso esta peça
 * recebe o status e não a obra: ela não tem como olhar o progresso.
 *
 * **O lugar é de quem chama, e depende de quem ocupa os cantos.** Na carta
 * cheia ele fica no canto superior ESQUERDO, ao lado da nota quando há nota.
 * Na compacta esse canto é do `⋯`, e ele desce pra baixo do selo de TIPO, no
 * direito. A altura casa com a dos dois vizinhos (`p-1` + glifo de 10px). Sem `pointer-events`: com a carta inteira clicável, selo que
 * não faz nada não pode virar um buraco morto no canto.
 */
export function CompletedBadge({
  status,
  className = '',
}: {
  status: EntryStatus
  className?: string
}) {
  if (status !== 'completed') {
    return null
  }

  return (
    <span
      className={`pointer-events-none flex items-center justify-center rounded-sm bg-glass p-1 text-ink backdrop-blur-md ${className}`}
    >
      <CheckIcon size={10} strokeWidth={2.4} />
      <span className="sr-only">{appCopy.statuses.completed}</span>
    </span>
  )
}

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { QueryKey } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

/**
 * O reordenar otimista de uma lista de obras — 10/09/2026.
 *
 * ── Por que ele virou um hook ─────────────────────────────────────────────
 * Ele estava escrito **duas vezes**, linha a linha, no widget da Home e na
 * lista de `/piles/:id`, e a grade da pilha seria a terceira. *Duas contas da
 * mesma coisa é como uma fica pra trás* — e o que fica pra trás aqui não é um
 * rótulo: é a escrita otimista, o `after` que o servidor espera, e a distância
 * de ativação que decide se um clique vira arrasto.
 *
 * O que difere entre os três é **a chave do cache e a mutação**, que são
 * parâmetros. O resto era cópia.
 *
 * ── As três coisas que ele guarda ─────────────────────────────────────────
 * **A distância de ativação de 6px**: sem ela o `pointerdown` de um clique já
 * conta como arrasto. Curto o bastante pra não parecer travado, longo o
 * bastante pra sobreviver ao tremor do dedo.
 *
 * **A escrita otimista**: esperar a rede pra mover o item desfaria a sensação
 * de que ele ficou onde foi solto. A resposta do servidor devolve a lista
 * inteira e sobrescreve; se falhar, o cache volta à verdade dele.
 *
 * **O `after`**, que é quem fica ATRÁS na ordem nova — nulo quando o item vai
 * pro topo. O cliente nunca vê nem manda `position`: quem escolhe o número é o
 * servidor (brief, 3.14).
 */
export function useReorderable<Item extends { id: number }>({
  items,
  queryKey,
  move,
}: {
  items: Item[]
  queryKey: QueryKey
  move: (input: { entryId: number; after: number | null }) => void
}) {
  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const from = items.findIndex(({ id }) => id === active.id)
    const to = items.findIndex(({ id }) => id === over.id)
    if (from === -1 || to === -1) {
      return
    }

    const reordered = arrayMove(items, from, to)
    queryClient.setQueryData(queryKey, reordered)

    const previous = to === 0 ? null : (reordered[to - 1]?.id ?? null)
    move({ entryId: Number(active.id), after: previous })
  }

  return { sensors, onDragEnd }
}

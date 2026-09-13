import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'

/**
 * Reler o provedor para uma obra — item 11(d) da fila do dono.
 *
 * ── O que ela invalida, e por que o `total` é o que decide ──────────────────
 * O servidor reescreve o snapshot (o que o provedor diz) e pode subir
 * `entries.total` — **só para cima**, ver `titles.propagate.ts`. Duas coisas
 * na tela dependem disso: o contexto do provedor (`titleKeys`, que carrega
 * sinopse, nota e arte) e a própria obra (`entryKeys`, de onde sai o
 * denominador do contador).
 *
 * **A lista também**, e não é zelo: o total aparece na carta e nas duas listas
 * de `/library`, então deixar `entryKeys.lists()` de fora faria o número novo
 * existir na tela de detalhe e não na grade — que é a assimetria que este
 * ciclo veio tirar.
 */
export function useRefreshEntry(entryId: number) {
  const queryClient = useQueryClient()

  return useMutation<{ updated: number }, HttpError, void>({
    mutationFn: () => entriesService.refresh(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(entryId) })
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: titleKeys.all })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'

/**
 * Desvincular. **Não apaga a obra** — progresso, nota e log sobrevivem, e a
 * copy da confirmação diz isso: `Unlink` não é o `Delete title` do vizinho
 * (design system, seção 5).
 *
 * As mesmas três frentes de `useLinkEntry`, pelo mesmo motivo — tirar o último
 * vínculo devolve a obra ao ladrilho da inicial, e tirar a fonte EFETIVA faz o
 * contexto voltar a vir do que sobrou.
 */
export function useUnlinkEntry(entryId: number) {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, string>({
    mutationFn: (provider) => entriesService.unlink(entryId, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.links(entryId) })
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(entryId) })
      queryClient.invalidateQueries({ queryKey: titleKeys.ofEntry(entryId) })
    },
  })
}

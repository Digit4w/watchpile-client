import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { searchKeys } from '@/hooks/queries/search/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'

/**
 * Desvincular. **Não apaga a obra** — progresso, nota e log sobrevivem, e a
 * copy da confirmação diz isso: `Unlink` não é o `Delete title` do vizinho
 * (design system, seção 5).
 *
 * As mesmas frentes de `useLinkEntry`, pelo mesmo motivo — tirar o último
 * vínculo devolve a obra ao ladrilho da inicial, e tirar a fonte EFETIVA faz o
 * contexto voltar a vir do que sobrou.
 *
 * A de fora inclusive: apagar a linha de `external_ids` desfaz o `owned`
 * daquele par, e o resultado volta a ser adicionável. **Aqui a chave do
 * provedor não dá pra estreitar** — a mutação recebe o slug e nunca o id
 * externo —, então vale `titleKeys.all`.
 */
export function useUnlinkEntry(entryId: number) {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, string>({
    mutationFn: (provider) => entriesService.unlink(entryId, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.links(entryId) })
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(entryId) })
      queryClient.invalidateQueries({ queryKey: titleKeys.all })
      queryClient.invalidateQueries({ queryKey: searchKeys.all })
    },
  })
}

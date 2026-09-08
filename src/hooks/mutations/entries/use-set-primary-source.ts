import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { type EntryLink, entriesService } from '@/services/entries'

/**
 * Escolher de qual vínculo a obra fala (brief, 3.10).
 *
 * **É o único jeito de a fonte efetiva mudar.** Desde 02/09/2026 vincular não
 * promove — o vínculo mais antigo continua falando —, então sinopse, ano e arte
 * só trocam quando alguém pede, com o preview na frente.
 *
 * Invalida as mesmas três frentes de vincular, e pelo mesmo motivo: os vínculos
 * mudaram de marca, `art` da obra é derivado do vínculo efetivo, e o contexto
 * inteiro passa a vir de outro catálogo.
 */
export function useSetPrimarySource(entryId: number) {
  const queryClient = useQueryClient()

  return useMutation<EntryLink[], HttpError, string>({
    mutationFn: (provider) => entriesService.setPrimary(entryId, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.links(entryId) })
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(entryId) })
      queryClient.invalidateQueries({ queryKey: titleKeys.ofEntry(entryId) })
    },
  })
}

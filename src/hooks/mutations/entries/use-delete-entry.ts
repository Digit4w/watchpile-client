import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import { pileKeys } from '@/hooks/queries/piles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'

export function useDeleteEntry() {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, number>({
    mutationFn: entriesService.remove,
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: entryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: entryKeys.all })
      // o que um widget resolve depende das entries; a chave dele mora à parte
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
      // apagar a obra derruba a associação com qualquer pile (cascade no
      // servidor), então nenhuma listagem de pile continua válida
      queryClient.invalidateQueries({ queryKey: pileKeys.all })
    },
  })
}

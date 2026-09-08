import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { type EntryPatch, entriesService } from '@/services/entries'

export function useUpdateEntry(id: number) {
  const queryClient = useQueryClient()

  return useMutation<Entry, HttpError, EntryPatch>({
    mutationFn: (input) => entriesService.update(id, input),
    onSuccess: (entry) => {
      queryClient.setQueryData(entryKeys.detail(id), entry)
      queryClient.invalidateQueries({ queryKey: entryKeys.all })
      // o que um widget resolve depende das entries; a chave dele mora à parte
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
    },
  })
}

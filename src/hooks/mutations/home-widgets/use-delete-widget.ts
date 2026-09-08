import { useMutation, useQueryClient } from '@tanstack/react-query'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { homeWidgetsService } from '@/services/home-widgets'

export function useDeleteWidget() {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, number>({
    mutationFn: homeWidgetsService.remove,
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: homeWidgetKeys.entries(id) })
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
    },
  })
}

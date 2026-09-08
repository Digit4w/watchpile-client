import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { HomeWidget } from '@/domain/home-widget'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { homeWidgetsService, type WidgetInput } from '@/services/home-widgets'

export function useCreateWidget() {
  const queryClient = useQueryClient()

  return useMutation<HomeWidget, HttpError, WidgetInput>({
    mutationFn: homeWidgetsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
    },
  })
}

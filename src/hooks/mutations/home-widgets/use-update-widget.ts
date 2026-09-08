import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { HomeWidget } from '@/domain/home-widget'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { homeWidgetsService, type WidgetPatch } from '@/services/home-widgets'

export function useUpdateWidget(id: number) {
  const queryClient = useQueryClient()

  return useMutation<HomeWidget, HttpError, WidgetPatch>({
    mutationFn: (input) => homeWidgetsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
      // fonte ou filtro mudou: o conteúdo resolvido não vale mais
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.entries(id) })
    },
  })
}

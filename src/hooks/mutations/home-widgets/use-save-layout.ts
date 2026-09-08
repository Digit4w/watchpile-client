import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { HomeWidget } from '@/domain/home-widget'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { homeWidgetsService, type LayoutEntry } from '@/services/home-widgets'

/**
 * Um request por gesto, não por widget. O servidor devolve o layout salvo
 * inteiro, então dá pra escrever direto no cache sem refetch.
 */
export function useSaveLayout() {
  const queryClient = useQueryClient()

  return useMutation<HomeWidget[], HttpError, LayoutEntry[]>({
    mutationFn: homeWidgetsService.saveLayout,
    onSuccess: (widgets) => {
      queryClient.setQueryData(homeWidgetKeys.all, widgets)
    },
  })
}

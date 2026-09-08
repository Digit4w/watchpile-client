import { useQuery } from '@tanstack/react-query'
import { homeWidgetsService } from '@/services/home-widgets'
import { homeWidgetKeys } from './keys'

export function useWidgetEntries(id: number) {
  return useQuery({
    queryKey: homeWidgetKeys.entries(id),
    queryFn: () => homeWidgetsService.listEntries(id),
  })
}

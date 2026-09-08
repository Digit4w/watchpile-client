import { useQuery } from '@tanstack/react-query'
import { homeWidgetsService } from '@/services/home-widgets'
import { homeWidgetKeys } from './keys'

export function useHomeWidgets() {
  return useQuery({
    queryKey: homeWidgetKeys.all,
    queryFn: homeWidgetsService.list,
  })
}

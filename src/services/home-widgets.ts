import type { HomeWidget, WidgetLayout } from '@/domain/home-widget'
import type { Entry } from '@/domain/media'
import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

export type WidgetInput = NonNullable<
  paths['/api/home-widgets']['post']['requestBody']
>['content']['application/json']

export type WidgetPatch = NonNullable<
  paths['/api/home-widgets/{id}']['patch']['requestBody']
>['content']['application/json']

export type LayoutEntry = WidgetLayout & { id: number }

export const homeWidgetsService = {
  list: () => httpClient.get<HomeWidget[]>('/api/home-widgets'),
  create: (input: WidgetInput) =>
    httpClient.post<HomeWidget>('/api/home-widgets', input),
  update: (id: number, input: WidgetPatch) =>
    httpClient.patch<HomeWidget>(`/api/home-widgets/${id}`, input),
  remove: (id: number) => httpClient.delete<void>(`/api/home-widgets/${id}`),
  /**
   * Todas as posições numa requisição só: o `react-grid-layout` emite o layout
   * inteiro a cada arrasto, e um PATCH por widget seria uma rajada por gesto.
   */
  saveLayout: (widgets: LayoutEntry[]) =>
    httpClient.patch<HomeWidget[]>('/api/home-widgets/layout', { widgets }),
  listEntries: (id: number) =>
    httpClient.get<Entry[]>(`/api/home-widgets/${id}/entries`),
  /**
   * `after` é o id da obra atrás da qual esta vai; `null` manda pro topo. Como
   * no reorder de pile, o servidor é quem escolhe o número da posição (brief,
   * 3.14) — e é ele também que congela a ordem visível no primeiro arrasto.
   */
  moveEntry: (id: number, entryId: number, after: number | null) =>
    httpClient.patch<Entry[]>(`/api/home-widgets/${id}/entries/${entryId}`, {
      after,
    }),
}

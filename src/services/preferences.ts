import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * Os tipos que ESTE usuário escondeu.
 *
 * **A lista é a dos escondidos, não a dos visíveis** (brief, 3.12): o padrão é
 * ver tudo, e um tipo criado depois nasce visível sem que ninguém precise
 * reescrever a preferência de quem já existia.
 */
export type MediaTypeVisibility =
  paths['/api/preferences/media-types']['get']['responses'][200]['content']['application/json']

export const preferencesService = {
  mediaTypes: () =>
    httpClient.get<MediaTypeVisibility>('/api/preferences/media-types'),
  /**
   * Manda o conjunto INTEIRO, porque o servidor substitui — e a tela mostra a
   * lista toda, que é o que autoriza uma escrita assim (design system, seção 5).
   */
  setMediaTypes: (hidden: string[]) =>
    httpClient.put<MediaTypeVisibility>('/api/preferences/media-types', {
      hidden,
    }),
}

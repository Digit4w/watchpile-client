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

/**
 * A fonte que ESTE usuário prefere para buscar cada tipo.
 *
 * **Um mapa, e a ausência de uma chave é o padrão da instância** — não há
 * entrada nula: quem nunca escolheu não aparece, e a busca cai no que o admin
 * definiu. O que volta já está validado contra a associação tipo↔provedor, e é
 * por isso que a tela não precisa conferir de novo.
 */
export type SearchSources =
  paths['/api/preferences/search-sources']['get']['responses'][200]['content']['application/json']

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
  searchSources: () =>
    httpClient.get<SearchSources>('/api/preferences/search-sources'),
  /**
   * A escrita é de UM tipo, ao contrário da de visibilidade: *substituir o
   * conjunto inteiro exige mostrar o conjunto inteiro*, e `/search` mostra um
   * tipo por vez. `null` desfaz a escolha em vez de gravar "nenhuma" — não ter
   * fonte preferida já tem representação, que é a linha não existir.
   */
  setSearchSource: (mediaType: string, provider: string | null) =>
    httpClient.put<SearchSources>(
      `/api/preferences/search-sources/${encodeURIComponent(mediaType)}`,
      { provider },
    ),
}

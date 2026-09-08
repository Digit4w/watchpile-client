import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * O que a busca devolve — e **um resultado de provedor NÃO é uma obra**.
 *
 * Sem id nosso, sem status, sem progresso, sem dono: nada do que `entries`
 * guarda existe até alguém adicionar. É por isso que o servidor não devolve
 * algo com cara de `Entry` e `id: null`, e por isso o "já tenho esta" vem num
 * mapa ao lado (`owned`) em vez de um campo dentro do resultado.
 */
export type SearchResponse =
  paths['/api/search']['get']['responses'][200]['content']['application/json']

export type SearchResult = SearchResponse['results'][number]
export type SearchSource = SearchResponse['sources'][number]

export type SearchParams = {
  type: string
  q: string
  /**
   * A troca de fonte. Ausente, responde o efetivo — **uma busca = um tipo =
   * um provedor** (brief, 3.10), e quem escolhe quando ninguém definiu padrão é o
   * servidor, que diz na resposta quem respondeu.
   */
  provider?: string | null
}

export const searchService = {
  search: ({ type, q, provider }: SearchParams) => {
    const params = new URLSearchParams({ type, q })
    if (provider) {
      params.set('provider', provider)
    }
    return httpClient.get<SearchResponse>(`/api/search?${params.toString()}`)
  },
}

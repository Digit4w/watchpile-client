import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * O que este servidor guardou porque podia buscar de novo (brief, 3.9 e 3.10).
 *
 * **Do admin, leitura inclusive** — como `network` e ao contrário dos tipos de
 * mídia: não há nada nisto que sirva a quem não pode limpar. Quanto o cache
 * ocupa é fato sobre a MÁQUINA de quem hospeda.
 */
export type StorageUsage =
  paths['/api/storage']['get']['responses'][200]['content']['application/json']

export type ProviderCacheUsage = StorageUsage['providerCache']
export type ArtCacheUsage = StorageUsage['artCache']

export const storageService = {
  get: () => httpClient.get<StorageUsage>('/api/storage'),
  /**
   * As duas limpezas são rotas separadas porque são caches separados: uma
   * apaga as RESPOSTAS de provedor, a outra os ARQUIVOS de pôster. Cada uma
   * devolve o que havia — que é o número que a tela mostra depois do clique, e
   * que só existe antes da escrita.
   */
  clearProviderCache: () =>
    httpClient.delete<{ cleared: ProviderCacheUsage }>(
      '/api/storage/provider-cache',
    ),
  clearArtCache: () =>
    httpClient.delete<{ cleared: ArtCacheUsage }>('/api/storage/art-cache'),
}

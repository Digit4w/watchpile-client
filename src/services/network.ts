import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * Em qual interface o servidor escuta, e quem decidiu isso.
 *
 * **Infraestrutura da instalação, então é do admin** (brief, 3.9) — e aqui a
 * LEITURA também é, ao contrário dos tipos de mídia: não há nada nisto que sirva
 * a quem não pode mudar.
 */
export type NetworkSettings =
  paths['/api/network']['get']['responses'][200]['content']['application/json']

export const networkService = {
  get: () => httpClient.get<NetworkSettings>('/api/network'),
  /**
   * A escrita **não vale na hora**: o listener já está aberto, e religá-lo
   * derrubaria a requisição que pediu a troca. A resposta já volta com
   * `restartPending`.
   */
  setAllowRemote: (allowRemote: boolean) =>
    httpClient.put<NetworkSettings>('/api/network', { allowRemote }),
}

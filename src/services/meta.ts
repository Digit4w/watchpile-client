import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * Fatos sobre o servidor que está respondendo.
 *
 * **A versão é a do SERVIDOR, e é a única que a tela mostra.** Numa instalação
 * self-hosted é ele que define o que a instalação é, e o cliente pode ser
 * qualquer um (brief, 3.7) — mostrar a versão do cliente responderia à pergunta
 * errada com um número que parece a resposta certa.
 */
export type ServerMeta =
  paths['/api/meta']['get']['responses'][200]['content']['application/json']

export const metaService = {
  get: () => httpClient.get<ServerMeta>('/api/meta'),
}

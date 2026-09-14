import type { LogLevelFilter } from '@/domain/log-view'
import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * O log de diagnóstico desta instalação (14/09/2026). **Do admin, caminho
 * inteiro**, como `storage`: quem não é admin recebe 403.
 */
export type LogPage =
  paths['/api/logs']['get']['responses'][200]['content']['application/json']

export type LogUsage = LogPage['usage']

/** Onde o navegador baixa todos os arquivos — um endereço, não um `fetch`. */
export const LOG_DOWNLOAD_URL = '/api/logs/download'

export const logsService = {
  read: ({
    level,
    before,
    after,
  }: {
    level: LogLevelFilter
    before?: number
    after?: number
  }) => {
    const query = new URLSearchParams({ level })
    if (before !== undefined) {
      query.set('before', String(before))
    }
    if (after !== undefined) {
      query.set('after', String(after))
    }
    return httpClient.get<LogPage>(`/api/logs?${query}`)
  },
}

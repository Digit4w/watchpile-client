import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * O que esta instalação sabe sobre versões mais novas.
 *
 * **`updateAvailable` e `canInstall` vêm PRONTOS do servidor**, e a tela não
 * refaz nenhuma das duas contas: comparar versão é conhecimento de quem emite
 * o formato, e saber se dá pra instalar daqui exigiria detectar o ambiente —
 * que é exatamente o que o cliente não pode fazer (brief, 3.4).
 */
export type UpdateState =
  paths['/api/updates']['get']['responses'][200]['content']['application/json']

export const updatesService = {
  get: () => httpClient.get<UpdateState>('/api/updates'),
  setCheck: (enabled: boolean) =>
    httpClient.put<UpdateState>('/api/updates/check', { enabled }),
  checkNow: () => httpClient.post<UpdateState>('/api/updates/check', undefined),
  download: () =>
    httpClient.post<UpdateState>('/api/updates/download', undefined),
  install: () =>
    httpClient.post<{ message: string }>('/api/updates/install', undefined),
}

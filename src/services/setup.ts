import type { AuthUser } from '@/domain/auth'
import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * O wizard de primeiro uso — o par de `features/setup/` no servidor.
 *
 * **`getStatus` e `createAdmin` moraram em `services/auth.ts`** enquanto o
 * wizard era só criar o admin. Com o passo de instância entrando, os três
 * andam juntos e `auth` volta a ser sessão: login, quem sou eu, logout.
 */

export type Credentials = NonNullable<
  paths['/api/setup/account']['post']['requestBody']
>['content']['application/json']

/**
 * O que ainda falta antes de a instalação servir pra alguma coisa.
 *
 * `pending` é `'account' | 'instance' | null`, e não um booleano: com dois
 * passos, um booleano obrigaria a tela a adivinhar em qual deles ela está.
 */
export type SetupStatus =
  paths['/api/setup/status']['get']['responses'][200]['content']['application/json']

export type InstanceSetup = NonNullable<
  paths['/api/setup/instance']['post']['requestBody']
>['content']['application/json']

export const setupService = {
  getStatus: () => httpClient.get<SetupStatus>('/api/setup/status'),
  createAdmin: (credentials: Credentials) =>
    httpClient.post<AuthUser>('/api/setup/account', credentials),
  configureInstance: (input: InstanceSetup) =>
    httpClient.post<void>('/api/setup/instance', input),
}

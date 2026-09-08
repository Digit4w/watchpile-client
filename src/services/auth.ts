import type { AuthUser } from '@/domain/auth'
import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * `auth` é SESSÃO, e só — desde 03/09/2026.
 *
 * O status do primeiro uso e a criação do admin foram pra `services/setup.ts`,
 * acompanhando a mudança do mesmo dia no servidor: com o wizard ganhando o
 * passo de instância, "auth" passaria a decidir quais tipos de mídia a
 * instalação tem, que não é assunto dele.
 */

export type Credentials = NonNullable<
  paths['/api/auth/login']['post']['requestBody']
>['content']['application/json']

export const authService = {
  login: (credentials: Credentials) =>
    httpClient.post<AuthUser>('/api/auth/login', credentials),
  getMe: () => httpClient.get<AuthUser>('/api/auth/me'),
  logout: () => httpClient.post<void>('/api/auth/logout'),
}

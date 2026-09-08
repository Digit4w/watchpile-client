import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * A forma pública de um provedor, como o servidor a devolve.
 *
 * **O segredo não está aqui, e não é omissão do tipo — é do contrato**: o `GET`
 * devolve `configured` e, no máximo, os últimos quatro caracteres (brief, 3.10).
 * Não há criptografia em repouso, e o que protege é a credencial ser write-only
 * na API.
 */
export type Provider =
  paths['/api/providers']['get']['responses'][200]['content']['application/json'][number]

export type CredentialState = Provider['credentials'][number]
export type ProviderOption = Provider['options'][number]

export type ProviderPatch = NonNullable<
  paths['/api/providers/{slug}']['patch']['requestBody']
>['content']['application/json']

export type ProviderTestResult =
  paths['/api/providers/{slug}/test']['post']['responses'][200]['content']['application/json']

export const providersService = {
  list: () => httpClient.get<Provider[]>('/api/providers'),
  /**
   * **Mescla, não substitui** — e string vazia é o que APAGA uma credencial.
   *
   * A assimetria com o `PATCH` de tipo de mídia (que substitui o mapa de nomes)
   * é deliberada: lá substituir é o que torna apagar uma tradução possível; aqui
   * obrigaria a tela a reenviar segredos que ela nunca recebeu.
   */
  update: (slug: string, patch: ProviderPatch) =>
    httpClient.patch<Provider>(`/api/providers/${slug}`, patch),
  /**
   * Bate no endpoint mais barato do provedor. **Responde 200 mesmo quando a
   * chave é recusada** — a requisição nossa deu certo, e `ok` diz o resto.
   *
   * `credentials` é o que está DIGITADO no formulário, e ele vence o guardado
   * pela duração da tentativa. Sem isso, provar uma chave exigia salvá-la
   * antes — e uma chave errada ficava valendo até alguém voltar pra consertar,
   * que é o oposto de "validar no salvamento" (brief, 3.10).
   */
  test: (slug: string, credentials?: Record<string, string>) =>
    httpClient.post<ProviderTestResult>(
      `/api/providers/${slug}/test`,
      credentials ? { credentials } : undefined,
    ),
}

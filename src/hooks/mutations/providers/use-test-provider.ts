import { useMutation } from '@tanstack/react-query'
import type { HttpError } from '@/infra/lib/http-client'
import { type ProviderTestResult, providersService } from '@/services/providers'

/**
 * Testar a conexão com o provedor.
 *
 * **Não invalida nada, e não deveria:** testar não escreve. O resultado é um
 * fato sobre o instante, não sobre a configuração — e é por isso que ele mora no
 * estado da mutação (`data`) em vez de virar campo do provedor.
 *
 * O servidor responde **200 mesmo quando a chave é recusada**: a requisição
 * nossa deu certo, e `ok` diz o resto. Então `isError` aqui é falha de rede
 * NOSSA, não recusa do terceiro — e a tela precisa distinguir as duas.
 */
export function useTestProvider(slug: string) {
  return useMutation<
    ProviderTestResult,
    HttpError,
    Record<string, string> | undefined
  >({
    mutationFn: (credentials) => providersService.test(slug, credentials),
  })
}

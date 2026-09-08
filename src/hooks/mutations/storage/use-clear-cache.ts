import { useMutation, useQueryClient } from '@tanstack/react-query'
import { storageKeys } from '@/hooks/queries/storage/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { storageService } from '@/services/storage'

export type CacheKind = 'provider' | 'art'

/**
 * Esvazia um dos dois caches.
 *
 * **Uma mutação parametrizada, e não duas.** O que muda entre elas é a rota; o
 * que acontece depois é idêntico — a mesma consulta se refaz, a mesma seção
 * redesenha. Duas cópias divergiriam no dia em que uma delas passasse a
 * invalidar outra coisa.
 *
 * **Invalida em vez de escrever a resposta no cache**, ao contrário do toggle
 * de rede: a resposta aqui é o que o cache TINHA, não o estado novo. Escrevê-la
 * deixaria a tela mostrando os números que acabaram de ser apagados.
 *
 * Ela invalida a arte junto quando o cache de arte é o esvaziado: as cartas na
 * tela apontam para uma rota que agora vai buscar de novo no provedor, e não
 * há nada a fazer sobre as `<img>` já carregadas — mas a próxima navegação não
 * pode servir do cache do TanStack uma obra que perdeu o arquivo.
 */
export function useClearCache() {
  const queryClient = useQueryClient()

  return useMutation<{ cleared: unknown }, HttpError, CacheKind>({
    mutationFn: (kind) =>
      kind === 'provider'
        ? storageService.clearProviderCache()
        : storageService.clearArtCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.all })
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { networkService } from '@/services/network'
import { networkKeys } from './keys'

/**
 * **`retry: false`, e o motivo é o 403.**
 *
 * Esta rota é de admin no caminho inteiro, então quem não é admin recebe 403 —
 * uma resposta definitiva, que repetir não muda. A política geral já não repete
 * `4xx` (`domain/request-failure`); aqui é explícito porque o consumidor decide
 * se MOSTRA a seção a partir desta consulta, e uma seção que aparece depois de
 * duas tentativas apareceria tarde.
 */
export function useNetwork() {
  return useQuery({
    queryKey: networkKeys.all,
    queryFn: networkService.get,
    retry: false,
  })
}

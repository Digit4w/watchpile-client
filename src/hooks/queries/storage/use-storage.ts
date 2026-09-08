import { useQuery } from '@tanstack/react-query'
import { storageService } from '@/services/storage'
import { storageKeys } from './keys'

/**
 * **`retry: false`, pelo mesmo motivo de `useNetwork`:** a rota é de admin no
 * caminho inteiro, então quem não é admin recebe 403 — resposta definitiva,
 * que repetir não muda.
 */
export function useStorage() {
  return useQuery({
    queryKey: storageKeys.all,
    queryFn: storageService.get,
    retry: false,
  })
}

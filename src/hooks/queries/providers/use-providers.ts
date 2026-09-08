import { useQuery } from '@tanstack/react-query'
import { providersService } from '@/services/providers'
import { providerKeys } from './keys'

/**
 * Os provedores desta instalação.
 *
 * **A leitura é de todo mundo, não só do admin** (brief, 3.10): a **atribuição**
 * do TMDB é condição de uso e precisa renderizar pra quem olha a tela, e saber
 * que um tipo não tem provedor é o que deixa a busca dizer isso em voz alta. O
 * que é do admin é escrever.
 *
 * `staleTime` alto pelo mesmo motivo do vocabulário de tipos: configuração de
 * instância muda quando um admin mexe em Settings, e quem mexe é esta tela, que
 * invalida a chave ao salvar.
 */
export function useProviders() {
  return useQuery({
    queryKey: providerKeys.list(),
    queryFn: providersService.list,
    staleTime: 1000 * 60 * 30,
  })
}

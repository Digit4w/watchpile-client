import { useQuery } from '@tanstack/react-query'
import { preferencesService } from '@/services/preferences'
import { preferenceKeys } from './keys'

/**
 * Quais tipos ESTE usuário escondeu (brief, 3.12).
 *
 * **Chave própria, e não um campo do tipo.** `useMediaTypes` devolve o
 * vocabulário da INSTÂNCIA, que é o mesmo pra todo mundo e tem `staleTime` de
 * meia hora; isto aqui é de uma pessoa só. Juntar os dois numa consulta faria
 * salvar a preferência invalidar o vocabulário inteiro.
 *
 * `staleTime` alto pelo mesmo motivo do outro: quem muda esta lista é a própria
 * tela de Preferences, que escreve no cache ao salvar.
 */
export function useMediaTypeVisibility() {
  return useQuery({
    queryKey: preferenceKeys.mediaTypes(),
    queryFn: () => preferencesService.mediaTypes(),
    staleTime: 1000 * 60 * 30,
  })
}

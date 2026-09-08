import { useQuery } from '@tanstack/react-query'
import { mediaTypesService } from '@/services/media-types'
import { mediaTypeKeys } from './keys'

/**
 * O vocabulário da instalação.
 *
 * **Ele é de todo mundo, não só do admin** — a carta desenha o selo, `/library`
 * desenha os chips e a folha de obra desenha o seletor. Só escrever é do admin
 * (brief, 3.9).
 *
 * `staleTime` alto de propósito: vocabulário de instância muda quando um admin
 * mexe em Settings, o que acontece uma vez a cada muitos meses. Revalidar a
 * cada foco de janela gastaria requisição num dado que não se move — e quem
 * muda é a própria tela de Settings, que invalida a chave ao salvar.
 */
export function useMediaTypes(locale?: string) {
  return useQuery({
    queryKey: mediaTypeKeys.list(locale),
    queryFn: () => mediaTypesService.list(locale),
    staleTime: 1000 * 60 * 30,
  })
}

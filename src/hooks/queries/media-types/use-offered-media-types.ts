import { useMemo } from 'react'
import type { MediaTypeInfo } from '@/domain/media-type'
import { offeredTypes } from '@/domain/media-visibility'
import { useMediaTypeVisibility } from '../preferences/use-media-type-visibility'
import { useMediaTypes } from './use-media-types'

/**
 * O vocabulário JÁ RECORTADO pela preferência de quem está lendo (brief, 3.12).
 *
 * **`useMediaTypes` continua sendo o vocabulário inteiro**, e é ele que
 * Settings usa: o admin define o que a instalação tem, e não pode perder de
 * vista um tipo por tê-lo escondido pra si. Este aqui é o que todo CONTROLE que
 * oferece tipo como escolha consome.
 *
 * **Quem já está escolhido entra mesmo escondido** — `keep`. A regra mora em
 * `domain/media-visibility.ts` com spec, porque ela é a que impede um recorte
 * ligado de virar invisível.
 */
export function useOfferedMediaTypes(
  keep?: string | string[] | null,
): MediaTypeInfo[] {
  const types = useMediaTypes()
  const visibility = useMediaTypeVisibility()

  const list = types.data
  const hidden = visibility.data?.hidden

  return useMemo(
    /**
     * **Enquanto a preferência não chegou, a oferta é vazia, não é tudo.**
     * Devolver a lista inteira faria o chip de um tipo escondido aparecer por
     * um quadro e sumir — e sumir sozinho se lê como defeito. As duas consultas
     * têm `staleTime` de meia hora, então isso acontece uma vez por sessão.
     */
    () => (list && hidden ? offeredTypes(list, hidden, keep) : []),
    [list, hidden, keep],
  )
}

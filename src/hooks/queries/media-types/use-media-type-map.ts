import { useMemo } from 'react'
import type { MediaTypeInfo } from '@/domain/media-type'
import { useMediaTypes } from './use-media-types'

/**
 * O vocabulário indexado por slug, para quem precisa perguntar "o que é este
 * tipo?" a partir de uma obra.
 *
 * Existe porque `entries` guarda o slug, não o tipo inteiro — e toda tela que
 * desenha uma obra precisa do nome e do ícone dele. Um `Map` em vez de `find`
 * porque `/library` faz essa pergunta uma vez por carta, e uma biblioteca
 * grande tem milhares.
 *
 * **Devolve `undefined` para slug desconhecido, e quem chama trata.** Isso
 * acontece de verdade: um admin pode apagar um tipo enquanto outra aba está
 * aberta com a lista antiga em cache.
 */
export function useMediaTypeMap(locale?: string) {
  const query = useMediaTypes(locale)

  const map = useMemo(() => {
    const entries = new Map<string, MediaTypeInfo>()
    for (const type of query.data ?? []) {
      entries.set(type.slug, type)
    }
    return entries
  }, [query.data])

  return { map, isPending: query.isPending }
}

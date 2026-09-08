import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { MediaTypeInfo } from '@/domain/media-type'

/** Só as listas de tipo: `['media-types', { locale }]`. */
function isMediaTypeListKey(key: QueryKey): boolean {
  return key[0] === 'media-types' && key[1] !== 'templates'
}

/**
 * Escreve o tipo editado em todo cache que o contém, **sem refazer busca
 * nenhuma** — irmão de `patch-pile.ts` e `patch-entry.ts`, e pela mesma régua:
 * escrita que muda o CONTEÚDO de um item troca o item no lugar; só criar e
 * apagar refazem a lista (design system, seção 8, 30/08/2026).
 *
 * Aqui ela vale ainda mais que nas outras duas, porque a lista de tipos é lida
 * pelo app inteiro: invalidar por causa de um rename trocaria o selo de toda
 * carta da Home e os chips de `/library` por um esqueleto, em telas que nem
 * estão à vista.
 *
 * **A resposta do `PATCH` resolve o nome sem `locale`**, então ela vem no
 * idioma da instância e não no de quem lê. Hoje isso não diverge — a leitura
 * também é feita sem `locale` enquanto a preferência de idioma não existe
 * (brief, 3.8) —, e quando divergir o remendo passa a mentir num campo. Por
 * isso ele reescreve só as chaves de lista que existem, e não inventa uma.
 */
export function patchMediaTypeInCaches(
  queryClient: QueryClient,
  type: MediaTypeInfo,
) {
  queryClient.setQueriesData<MediaTypeInfo[]>(
    { predicate: (query) => isMediaTypeListKey(query.queryKey) },
    (list) => {
      if (!list) {
        return list
      }
      // A mesma referência de volta quando o tipo não está nesta lista:
      // devolver um array novo faria toda lista em cache renderizar por nada.
      return list.some((item) => item.slug === type.slug)
        ? list.map((item) => (item.slug === type.slug ? type : item))
        : list
    },
  )
}

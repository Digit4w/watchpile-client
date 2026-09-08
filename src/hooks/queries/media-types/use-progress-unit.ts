import { useCallback } from 'react'
import { useMediaTypeMap } from './use-media-type-map'

/**
 * Como se chama a unidade de progresso de um tipo — "Episodes", "Capítulos".
 *
 * Ela **já chega plural e no idioma de quem lê**: o servidor resolve o mapa por
 * idioma antes de responder (brief, 3.12), e os templates a semeiam plural.
 * Pluralizar aqui seria concatenar "s" numa palavra que o usuário escreveu, que
 * é o erro de i18n que o guia do cliente proíbe por nome.
 *
 * **Nula é resposta**, não lacuna: filme e jogo não têm unidade, por motivos
 * diferentes, e quem chama decide o que fazer com isso.
 */
export function useProgressUnit(locale?: string) {
  const { map } = useMediaTypeMap(locale)

  return useCallback(
    (slug: string) => map.get(slug)?.progressUnit ?? null,
    [map],
  )
}

import { useCallback } from 'react'
import { useMediaTypeMap } from './use-media-type-map'

/**
 * O nome de um tipo, resolvido no idioma de quem lê.
 *
 * Substitui `appCopy.mediaTypes[slug]`, que era um catálogo de seis chaves fixas
 * — a forma que deixou de valer quando o tipo virou dado da instância (brief,
 * 3.12). O catálogo não some do projeto: ele continua sendo onde mora a copy de
 * TELA. O que sai dele é o rótulo de um dado do usuário, que nunca foi copy.
 *
 * **Cai no slug quando o tipo é desconhecido**, e isso é escolha: mostrar
 * `podcast` é feio, mas é informação; mostrar vazio é a carta parecer quebrada.
 */
export function useMediaTypeName(locale?: string) {
  const { map } = useMediaTypeMap(locale)

  return useCallback((slug: string) => map.get(slug)?.name ?? slug, [map])
}

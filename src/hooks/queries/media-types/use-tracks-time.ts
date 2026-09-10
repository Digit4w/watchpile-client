import { useCallback } from 'react'
import { useMediaTypeMap } from './use-media-type-map'

/**
 * O tipo desta obra registra TEMPO investido? — 10/09/2026 (brief, 3.12).
 *
 * Irmão de `useCountsProgress`, e **as duas perguntas convivem**: o contador
 * responde *quanto do acervo você percorreu*, este responde *quanto você
 * investiu*. Jogo é o caso que as separou — ele não conta e registra tempo.
 *
 * **Enquanto o vocabulário não chegou, a resposta é `false` e a caixa não
 * aparece.** É a régua de 04/09 (*no intervalo entre duas consultas a oferta é
 * vazia, não é tudo*), e aqui ela é mais simples que no contador: uma caixa de
 * ESCRITA que aparece e some por um quadro se lê como defeito, e o contador
 * tinha o agravante de um clique poder gravar no intervalo — este não tem
 * botão, só campo, e campo vazio não escreve sozinho.
 *
 * **Slug desconhecido depois de carregado NÃO registra**, ao contrário do
 * contador, que conta: o padrão da coluna é `false`, e desenhar um campo de
 * escrita para um tipo que a tela não conhece prometeria mais do que se sabe.
 */
export function useTracksTime(locale?: string) {
  const { map, isPending } = useMediaTypeMap(locale)

  return useCallback(
    (slug: string): boolean =>
      isPending ? false : (map.get(slug)?.tracksTime ?? false),
    [map, isPending],
  )
}

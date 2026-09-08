import { useCallback } from 'react'
import { useMediaTypeMap } from './use-media-type-map'

/**
 * O tipo desta obra conta progresso? (07/09/2026, decisão do dono.)
 *
 * Decide se a peça de acompanhamento desenha o contador `+`/`−` ou o controle
 * de status. O dado é `media_types.counts_progress`, e vem da mesma consulta de
 * vocabulário que a carta já faz pro ícone e pro nome — nenhuma requisição
 * nova.
 *
 * **Enquanto o vocabulário não chegou, a resposta é `null`, e quem chama não
 * desenha nada.** É a régua de 04/09/2026 — *no intervalo entre duas consultas
 * a oferta é vazia, não é tudo* — com um agravante próprio: o contador é um
 * controle de ESCRITA, e desenhá-lo por um quadro num tipo que não conta deixa
 * um clique gravar progresso que o modelo diz não existir. Um quadro em branco
 * não faz isso.
 *
 * **Slug desconhecido depois de carregado CONTA**, que é o default da coluna e
 * o mesmo espírito de `useMediaTypeName` cair no slug: o tipo apagado noutra
 * aba deixa a linha usável em vez de deixá-la vazia pra sempre.
 */
export function useCountsProgress(locale?: string) {
  const { map, isPending } = useMediaTypeMap(locale)

  return useCallback(
    (slug: string): boolean | null =>
      isPending ? null : (map.get(slug)?.countsProgress ?? true),
    [map, isPending],
  )
}

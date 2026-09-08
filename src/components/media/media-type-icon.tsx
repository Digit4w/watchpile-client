import { useMediaTypeMap } from '@/hooks/queries/media-types/use-media-type-map'
import { iconFor } from './icon-set'

/**
 * O selo de tipo de mídia (design system, seção 2).
 *
 * **Ele resolve o glifo a partir do DADO desde 31/08/2026.** Até aqui os seis
 * desenhos viviam num `Record<MediaType, ReactNode>` neste arquivo, o que
 * deixou de funcionar quando o tipo virou vocabulário da instância (brief,
 * 3.12): um tipo criado pelo admin caía em `undefined` e a carta renderizava
 * **sem ícone nenhum, sem erro no console**.
 *
 * A regra de silhueta de 29/08 não se perdeu — ela virou o critério de
 * curadoria do acervo (`icon-set.ts`), e os seis embutidos continuam com
 * glifos escolhidos por ela.
 *
 * **A assinatura não mudou de propósito.** São nove pontos de chamada, e
 * resolver por dentro conserta todos de uma vez em vez de espalhar a consulta.
 * O custo é um componente-folha que lê uma query — aceitável porque o React
 * Query deduplica e o vocabulário fica 30 minutos fresco.
 */
export function MediaTypeIcon({
  type,
  size = 12,
  strokeWidth = 1.8,
  labelled = false,
  className,
}: {
  type: string
  size?: number
  strokeWidth?: number
  /**
   * Quem conta o tipo ao leitor de tela. Sozinho — na linha da lista, onde o
   * glifo é a única marca — o ícone precisa dizer o próprio nome. Dentro de um
   * selo ou chip que já traz o rótulo ao lado, dizer de novo faz o leitor
   * ouvir "Anime Anime".
   */
  labelled?: boolean
  className?: string
}) {
  const { map } = useMediaTypeMap()
  const info = map.get(type)
  const Icon = iconFor(info?.icon ?? '')

  return (
    <>
      <Icon
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={className}
        aria-hidden="true"
      />
      {labelled && <span className="sr-only">{info?.name ?? type}</span>}
    </>
  )
}

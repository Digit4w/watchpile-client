import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * O detalhe de uma obra, **uma forma só em dois endereços** (brief, 3.10).
 *
 * `/api/search/:provider/:id` responde sobre a obra que ainda não é de
 * ninguém; `/api/entries/:id/details` sobre a que já é sua. São telas
 * diferentes — uma lê ao vivo, a outra lê do que se guardou — e o que elas
 * mostram é a mesma coisa, então o tipo é um só.
 */
export type TitleDetails =
  paths['/api/search/{provider}/{externalId}']['get']['responses']['200']['content']['application/json']

/** `?group=` só entra quando o provedor agrupa. Nem todos agrupam. */
function groupParam(n: number | null): string {
  return n === null ? '' : `&group=${n}`
}

export const titlesService = {
  /** O contexto do provedor pra obra que já é sua. 404 quando ela não tem vínculo. */
  ofEntry: (id: number) =>
    httpClient.get<TitleDetails>(`/api/entries/${id}/details`),
  /**
   * A obra do provedor, ao vivo.
   *
   * **O tipo é obrigatório**: no TMDB o id `1396` é uma série e pode ser outro
   * filme, então o par (tipo, id) é que identifica a obra.
   */
  ofProvider: (provider: string, externalId: string, type: string) =>
    httpClient.get<TitleDetails>(
      `/api/search/${encodeURIComponent(provider)}/${encodeURIComponent(externalId)}?type=${encodeURIComponent(type)}`,
    ),
  unitsOfEntry: (id: number, group: number | null) =>
    httpClient.get<TitleUnits>(
      `/api/entries/${id}/units?${groupParam(group).slice(1)}`,
    ),
  unitsOfProvider: (
    provider: string,
    externalId: string,
    type: string,
    group: number | null,
  ) =>
    httpClient.get<TitleUnits>(
      `/api/search/${encodeURIComponent(provider)}/${encodeURIComponent(externalId)}/units?type=${encodeURIComponent(type)}${groupParam(group)}`,
    ),
}

export type TitleUnits =
  paths['/api/search/{provider}/{externalId}/units']['get']['responses']['200']['content']['application/json']

export type TitleUnit = TitleUnits['units'][number]

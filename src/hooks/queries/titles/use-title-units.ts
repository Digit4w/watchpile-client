import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { HttpError } from '@/infra/lib/http-client'
import { type TitleUnits, titlesService } from '@/services/titles'
import { unitKeys } from './keys'

/**
 * `placeholderData` porque trocar de grupo troca a CHAVE, e sem isso a lista
 * inteira desmonta a cada temporada escolhida — a mesma razão de `/library`.
 * Com ela a lista anterior fica na tela até a nova chegar.
 *
 * `retry: 0` porque as falhas desta rota não mudam tentando: 404 é par sem
 * unidades, 503 traz motivo. Repetir gasta a cota que o 503 protege.
 */
const OPTIONS = { placeholderData: keepPreviousData, retry: 0 } as const

export function useEntryUnits(
  id: number,
  group: number | null,
  enabled: boolean,
) {
  return useQuery<TitleUnits, HttpError>({
    queryKey: unitKeys.ofEntry(id, group),
    queryFn: () => titlesService.unitsOfEntry(id, group),
    enabled,
    ...OPTIONS,
  })
}

export function useProviderUnits(
  provider: string,
  externalId: string,
  type: string,
  group: number | null,
  enabled: boolean,
) {
  return useQuery<TitleUnits, HttpError>({
    queryKey: unitKeys.ofProvider(provider, externalId, group),
    queryFn: () =>
      titlesService.unitsOfProvider(provider, externalId, type, group),
    enabled,
    ...OPTIONS,
  })
}

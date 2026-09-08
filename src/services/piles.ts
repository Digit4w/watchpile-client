import type { Entry, Pile } from '@/domain/media'
import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

export type PileInput = NonNullable<
  paths['/api/piles']['post']['requestBody']
>['content']['application/json']

/**
 * O PATCH é parcial de verdade — renomear sem mandar a descrição junto é
 * pedido legítimo, e reenviar um texto que não mudou sobrescreveria o que
 * outra aba tivesse escrito no meio.
 */
export type PilePatch = NonNullable<
  paths['/api/piles/{id}']['patch']['requestBody']
>['content']['application/json']

export type PileFilters = paths['/api/piles']['get']['parameters']['query']

function toQuery(filters: PileFilters): string {
  const params = new URLSearchParams()
  if (filters?.q) {
    params.set('q', filters.q)
  }
  // `sort` só entra quando o chamador pede: omitido, o servidor aplica o padrão
  // dele (`updated`). Mandar o padrão explicitamente daria uma chave de cache
  // diferente pra exatamente a mesma resposta.
  if (filters?.sort) {
    params.set('sort', filters.sort)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

type MoveInput = NonNullable<
  paths['/api/piles/{id}/entries/{entryId}']['patch']['requestBody']
>['content']['application/json']

export const pilesService = {
  list: (filters: PileFilters = undefined) =>
    httpClient.get<Pile[]>(`/api/piles${toQuery(filters)}`),
  getById: (id: number) => httpClient.get<Pile>(`/api/piles/${id}`),
  create: (input: PileInput) => httpClient.post<Pile>('/api/piles', input),
  update: (id: number, patch: PilePatch) =>
    httpClient.patch<Pile>(`/api/piles/${id}`, patch),
  remove: (id: number) => httpClient.delete<void>(`/api/piles/${id}`),

  listEntries: (id: number) =>
    httpClient.get<Entry[]>(`/api/piles/${id}/entries`),
  addEntry: (id: number, entryId: number) =>
    httpClient.post<Entry>(`/api/piles/${id}/entries`, { entryId }),
  /**
   * `after` é o id da obra atrás da qual esta vai; `null` manda pro topo. O
   * servidor é quem escolhe o número da posição (brief, 3.14) — o cliente
   * nunca vê nem manda `position`.
   */
  moveEntry: (id: number, entryId: number, after: MoveInput['after']) =>
    httpClient.patch<Entry[]>(`/api/piles/${id}/entries/${entryId}`, { after }),
  removeEntry: (id: number, entryId: number) =>
    httpClient.delete<void>(`/api/piles/${id}/entries/${entryId}`),

  /**
   * A capa sobe como bytes crus, não `FormData`: o que o cliente tem em mãos é
   * um `Blob` saído do canvas, e não há campo nenhum viajando ao lado dele.
   *
   * **Ela chega ao servidor já quadrada e reduzida** — quem corta e diminui é
   * o navegador (`domain/cover.ts`), porque `sharp` seria um segundo módulo
   * nativo além do `better-sqlite3` e dobraria a superfície de empacotamento
   * do Electron a cada release (brief, 3.17).
   */
  setCover: (id: number, image: Blob) =>
    httpClient.putBlob<Pile>(`/api/piles/${id}/cover`, image),
  removeCover: (id: number) =>
    httpClient.delete<Pile>(`/api/piles/${id}/cover`),
}

/**
 * O endereço da capa, para pôr num `<img>`.
 *
 * `?v=` carrega o `updatedAt` da pilha, e não é enfeite: subir uma capa nova
 * substitui a anterior **no mesmo endereço**, e sem isso o navegador mostraria
 * a antiga até revalidar. O servidor manda `ETag` e responde 304, então o
 * parâmetro não custa transferência — ele só garante que a troca apareça na
 * hora.
 */
export function pileCoverUrl(pile: Pile): string {
  return `/api/piles/${pile.id}/cover?v=${encodeURIComponent(pile.updatedAt)}`
}

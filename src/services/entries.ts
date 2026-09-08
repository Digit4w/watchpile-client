import type { Entry, Pile } from '@/domain/media'
import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

export type EntryInput = NonNullable<
  paths['/api/entries']['post']['requestBody']
>['content']['application/json']

export type EntryPatch = NonNullable<
  paths['/api/entries/{id}']['patch']['requestBody']
>['content']['application/json']

export type ProgressInput = NonNullable<
  paths['/api/entries/{id}/progress']['post']['requestBody']
>['content']['application/json']

export type EntryHistory =
  paths['/api/entries/{id}/history']['get']['responses']['200']['content']['application/json']

export type EntryFilters = paths['/api/entries']['get']['parameters']['query']

/**
 * Um vínculo da obra com um provedor (brief, 3.10).
 *
 * `effective` é o vínculo de onde saem sinopse, ano e arte — e o nome é esse,
 * não `primary`, porque sem promoção explícita quem fala é o vínculo mais
 * antigo, e chamar aquilo de `primary` prometeria uma decisão que ninguém
 * tomou. Quem promove é o `PUT .../{provider}/primary`.
 */
export type EntryLink =
  paths['/api/entries/{id}/links']['get']['responses']['200']['content']['application/json'][number]

export type EntryLinkInput = NonNullable<
  paths['/api/entries/{id}/links']['post']['requestBody']
>['content']['application/json']

function toQuery(filters: EntryFilters): string {
  const params = new URLSearchParams()
  if (filters?.mediaType) {
    params.set('mediaType', filters.mediaType)
  }
  if (filters?.status) {
    params.set('status', filters.status)
  }
  if (filters?.q) {
    params.set('q', filters.q)
  }
  // `sort` só entra quando o chamador pede: omitido, o servidor aplica o
  // padrão dele (`updated`). Mandar o padrão explicitamente daria uma chave de
  // cache diferente pra exatamente a mesma resposta.
  if (filters?.sort) {
    params.set('sort', filters.sort)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const entriesService = {
  list: (filters: EntryFilters = undefined) =>
    httpClient.get<Entry[]>(`/api/entries${toQuery(filters)}`),
  getById: (id: number) => httpClient.get<Entry>(`/api/entries/${id}`),
  create: (input: EntryInput) => httpClient.post<Entry>('/api/entries', input),
  update: (id: number, input: EntryPatch) =>
    httpClient.patch<Entry>(`/api/entries/${id}`, input),
  remove: (id: number) => httpClient.delete<void>(`/api/entries/${id}`),
  /**
   * Apaga a biblioteca INTEIRA de quem está logado.
   *
   * Ela leva mais do que o nome diz, e por cascade no servidor: progresso,
   * histórico, vínculo com provedor e a posição da obra em cada pilha. **As
   * pilhas ficam, vazias.** Quem promete isso antes do clique é a tela.
   *
   * Devolve quantas saíram, e é esse número que a tela mostra depois —
   * contar antes seria uma segunda conta, e é assim que uma fica pra trás.
   */
  removeAll: () => httpClient.delete<{ deleted: number }>('/api/entries'),
  /**
   * Ajuste de progresso é evento novo no log, nunca reescrita do contador
   * (brief, 3.11) — inclusive o desfazer, que é um delta negativo. Por isso a
   * UI otimista tem que tratar "desfazer" como mais uma escrita.
   */
  addProgress: (id: number, input: ProgressInput) =>
    httpClient.post<Entry>(`/api/entries/${id}/progress`, input),
  /**
   * Em quais pilhas a obra já está. A direção contrária —
   * `pilesService.listEntries` — já existia; esta nasceu pra tela de adicionar
   * à pilha conseguir mostrar o estado atual, e não só oferecer o destino.
   */
  piles: (id: number) => httpClient.get<Pile[]>(`/api/entries/${id}/piles`),
  /**
   * O resumo do que o log sabe. **Resumo e não lista**: é o que cabe numa
   * caixa da coluna, e responde "faz quanto tempo que larguei isto?".
   */
  history: (id: number) =>
    httpClient.get<EntryHistory>(`/api/entries/${id}/history`),
  /**
   * De quais provedores esta obra fala.
   *
   * Rota própria e não campo de `Entry`: a lista é da tela de detalhe, e
   * `GET /api/entries` devolve a biblioteca inteira — pendurar os vínculos na
   * obra faria toda listagem pagar por uma caixa que só uma tela mostra.
   */
  links: (id: number) =>
    httpClient.get<EntryLink[]>(`/api/entries/${id}/links`),
  /**
   * Vincular obra que já existe (brief, 3.10). É o que evita que anexar
   * metadados a uma obra antiga passe por apagar e re-adicionar, o que levaria
   * progresso e log junto.
   */
  link: (id: number, input: EntryLinkInput) =>
    httpClient.post<EntryLink>(`/api/entries/${id}/links`, input),
  /**
   * Desvincular. **Não apaga a obra** — progresso, nota e log são dela e
   * sobrevivem, ao contrário de `remove`.
   */
  unlink: (id: number, provider: string) =>
    httpClient.delete<void>(`/api/entries/${id}/links/${provider}`),
  /**
   * Escolher de qual vínculo a obra fala (brief, 3.10).
   *
   * Devolve a lista INTEIRA porque a escrita move o `effective` de um item pro
   * outro — remendar só o promovido deixaria o antigo mentindo até a próxima
   * leitura.
   */
  setPrimary: (id: number, provider: string) =>
    httpClient.put<EntryLink[]>(
      `/api/entries/${id}/links/${provider}/primary`,
      undefined,
    ),
}

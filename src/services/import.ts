import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * `YOU / Import` (brief, 3.12).
 *
 * **A resposta não traz frase** — traz `kind` e `params`, e quem monta a copy é
 * `-import.copy.ts`. Mesma régua da central de notificações, e aqui ela aperta
 * mais: o resultado de uma importação é PERSISTIDO e relido semanas depois, com
 * o app talvez noutro idioma.
 */

export type ImportStatus =
  paths['/api/import/status']['get']['responses'][200]['content']['application/json']

export type ImportJob = NonNullable<ImportStatus['latest']>

export type ImportProblem = ImportJob['problems'][number]

export type ImportProblemKind = ImportProblem['kind']

export type ImportFailureKind = NonNullable<ImportJob['errorKind']>

export type ImportSourceSlug = ImportJob['source']

export type ImportMode = ImportJob['mode']

/** O que ESTA instalação consegue importar, e por que não, quando não consegue. */
export type ImportSourceState = ImportStatus['sources'][number]

export const importService = {
  status: () => httpClient.get<ImportStatus>('/api/import/status'),

  /**
   * O arquivo vai como CORPO CRU, com o mime declarado por nós — não pelo
   * `File`.
   *
   * `file.type` vem do sistema operacional e varia: um `.csv` chega como
   * `text/csv`, como `application/vnd.ms-excel` no Windows, ou como string
   * vazia. Reembrulhar num `Blob` com o tipo que o contrato declara tira essa
   * variação do caminho, sem ler o arquivo inteiro pra memória duas vezes.
   *
   * O modo vai na QUERY porque é um enum de dois valores ao lado de um arquivo
   * — pequeno demais pra pagar um `FormData` de um lado e um parser de
   * multipart do outro.
   */
  startCsv: (file: File, mode: ImportMode) =>
    httpClient.postBlob<ImportJob>(
      `/api/import/csv?mode=${mode}`,
      new Blob([file], { type: 'text/csv' }),
    ),

  /**
   * As fontes de SERVIÇO — por nome de usuário, sem OAuth, porque perfil público
   * não pede credencial de ninguém.
   *
   * O `mode` vai na query nas três, mesmo aqui onde o corpo é JSON: as três são
   * a mesma operação com a mesma regra de colisão, e uniformidade vale mais que
   * economizar um parâmetro.
   */
  startProfile: (
    source: Extract<ImportSourceSlug, 'anilist' | 'mal'>,
    username: string,
    mode: ImportMode,
  ) =>
    httpClient.post<ImportJob>(`/api/import/${source}?mode=${mode}`, {
      username,
    }),

  cancel: (id: number) =>
    httpClient.post<ImportJob>(`/api/import/${id}/cancel`, {}),
}

import type { MediaTypeInfo } from '@/domain/media-type'
import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

export type MediaTypeInput = NonNullable<
  paths['/api/media-types']['post']['requestBody']
>['content']['application/json']

export type MediaTypePatch = NonNullable<
  paths['/api/media-types/{slug}']['patch']['requestBody']
>['content']['application/json']

/**
 * Um template embarcado, como o servidor o descreve.
 *
 * Os três primeiros campos são exatamente o corpo do `POST` — escolher um
 * template PREENCHE a folha, e salvar passa pelo mesmo caminho do formulário em
 * branco (brief, 3.9). `installed` é o que só o servidor sabe.
 */
export type MediaTypeTemplate =
  paths['/api/media-types/templates']['get']['responses'][200]['content']['application/json'][number]

export const mediaTypesService = {
  /**
   * `locale` é o idioma de quem está lendo, e **quem resolve o nome é o
   * servidor** — ele conhece o idioma da instância, que é o degrau 2 da queda
   * (brief, 3.12). O cliente não reimplementa essa regra; ele diz quem está
   * lendo e recebe o nome pronto.
   */
  list: (locale?: string) =>
    httpClient.get<MediaTypeInfo[]>(
      `/api/media-types${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`,
    ),
  /** Do admin, como escrever: template só existe pra criar tipo (brief, 3.9). */
  templates: () =>
    httpClient.get<MediaTypeTemplate[]>('/api/media-types/templates'),
  create: (input: MediaTypeInput) =>
    httpClient.post<MediaTypeInfo>('/api/media-types', input),
  update: (slug: string, patch: MediaTypePatch) =>
    httpClient.patch<MediaTypeInfo>(`/api/media-types/${slug}`, patch),
  remove: (slug: string) => httpClient.delete<void>(`/api/media-types/${slug}`),
  /**
   * Que este provedor sirva este tipo, **copiando a receita** de um tipo que
   * ele já serve (brief, 3.10, 10/09/2026).
   *
   * `copyFrom` não é conveniência: a junção carrega `search_body`, `field_map`,
   * `detail_path` e o token do provedor, e a linha em branco cai no endpoint do
   * PROVEDOR — que no AniList busca `ANIME` para tudo. Um tipo novo ligado
   * assim devolveria anime para toda busca de light novel, sem erro nenhum.
   *
   * Devolve o tipo já atualizado, então quem chama remenda o cache no lugar.
   */
  linkProvider: (slug: string, provider: string, copyFrom: string) =>
    httpClient.put<MediaTypeInfo>(
      `/api/media-types/${slug}/providers/${provider}`,
      { copyFrom },
    ),
  /** E que ele pare. O servidor recusa com a contagem se houver obra apontando. */
  unlinkProvider: (slug: string, provider: string) =>
    httpClient.delete<MediaTypeInfo>(
      `/api/media-types/${slug}/providers/${provider}`,
    ),
}

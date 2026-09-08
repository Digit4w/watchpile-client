import type { components, paths } from '@/infra/lib/api-types'

/**
 * O tipo de mídia deixou de ser uma união de seis — 31/08/2026 (brief, 3.12).
 *
 * **Não é "derivar a união do contrato": é a união deixar de existir.** Enquanto
 * o servidor tinha um enum fixo, `'movie' | 'tv' | ...` mantinha as duas pontas
 * de acordo. Agora o vocabulário é dado da instância, e afirmar seis valores
 * seria o cliente mentir sobre o que o servidor pode devolver — o que ele fazia
 * até aqui, calado: um tipo criado pelo admin sumia dos chips e a carta
 * renderizava sem ícone nenhum, sem erro.
 *
 * O que sobra é o que sempre foi de verdade: um slug.
 */
export type MediaType = string

/** A forma pública de um tipo, como o servidor a devolve. */
export type MediaTypeInfo =
  paths['/api/media-types']['get']['responses'][200]['content']['application/json'][number]

/**
 * O nome do glifo no acervo curado — **este sim deriva**, e é o caso clássico.
 *
 * O acervo é um conjunto FINITO no contrato (`z.enum` de 94 valores no
 * servidor), então duas cópias à mão divergiriam. Escrever a lista aqui seria
 * exatamente o que o brief 3.7 proíbe.
 */
export type IconName = NonNullable<
  NonNullable<
    paths['/api/media-types']['post']['requestBody']
  >['content']['application/json']['icon']
>

export type { components }

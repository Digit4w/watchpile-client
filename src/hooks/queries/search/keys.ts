import type { SearchParams } from '@/services/search'

export const searchKeys = {
  all: ['search'] as const,
  /**
   * O termo, o tipo e a fonte entram na chave porque os três mudam a resposta.
   * `provider` normalizado pra `null` e não omitido: `undefined` e `null`
   * geram chaves diferentes pro mesmo pedido, e a busca voltaria ao servidor
   * só porque o componente passou um em vez do outro.
   */
  query: ({ type, q, provider }: SearchParams) =>
    [...searchKeys.all, { type, q, provider: provider ?? null }] as const,
}

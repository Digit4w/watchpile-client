import type { MediaTypeInfo } from '@/domain/media-type'
import { HttpError } from '@/infra/lib/http-client'

/** Um provedor que pode passar a servir um tipo, e de onde copiar a receita. */
export type LinkableProvider = {
  slug: string
  /** Os tipos que ele já serve — cada um é uma receita PROVADA. */
  sources: { slug: string; label: string }[]
}

/**
 * Que provedores podem passar a servir este tipo, e de qual tipo copiar a
 * receita de cada um — 10/09/2026 (brief, 3.10).
 *
 * ── Por que a oferta é derivada, e não uma lista de provedores ──────────────
 * A junção não é uma associação, é uma **receita**: `search_body`, `field_map`,
 * `detail_path`, o token do provedor. Medido no servidor: **nenhum dos doze
 * pares semeados funciona vazio**, e um tipo ligado com a linha em branco cai
 * no endpoint do PROVEDOR — que no AniList busca `ANIME` para tudo. Um
 * `Light Novel` assim devolveria anime para toda busca, sem erro nenhum.
 *
 * Então **o que se oferece não é "um provedor", é "um provedor E de onde
 * copiar"**. Provedor que ainda não serve tipo nenhum não tem receita a
 * oferecer, e fica fora — ele não está quebrado, está **ocioso**, que é o
 * vocabulário que a 3.10 já usa.
 *
 * ── O tipo ALVO nunca é fonte de si mesmo ──────────────────────────────────
 * Se ele já é servido por aquele provedor, o provedor inteiro sai da oferta —
 * a lista é de quem pode ENTRAR. Trocar a receita de um par existente é outro
 * gesto, e ele acontece pelo mesmo `PUT`, a partir da linha que já está lá.
 */
export function linkableProviders(
  types: readonly MediaTypeInfo[],
  targetSlug: string,
): LinkableProvider[] {
  const target = types.find((type) => type.slug === targetSlug)
  const already = new Set(target?.providers ?? [])

  const sourcesBy = new Map<string, { slug: string; label: string }[]>()

  for (const type of types) {
    if (type.slug === targetSlug) {
      continue
    }
    for (const provider of type.providers) {
      if (already.has(provider)) {
        continue
      }
      const list = sourcesBy.get(provider) ?? []
      // O PLURAL, como em toda linha que nomeia um conjunto de obras (design
      // system, seção 8, sexta leva).
      list.push({ slug: type.slug, label: type.plural })
      sourcesBy.set(provider, list)
    }
  }

  /**
   * Ordenado por slug, que é o desempate estável do resto do app — e o mesmo
   * que `sourcesByType` usa. Ordenar pelo NOME seria melhor de ler e mudaria
   * com o idioma, que é a única coisa que uma lista de escolha não pode fazer
   * entre duas visitas.
   */
  return [...sourcesBy.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, sources]) => ({
      slug,
      sources: sources.sort((a, b) => a.slug.localeCompare(b.slug)),
    }))
}

/**
 * A contagem que vem dentro da recusa de desvincular, ou nulo se não for ela.
 *
 * **Ler o corpo de uma recusa é regra decidível, e por isso mora aqui** — é a
 * mesma divisão de `search-refusal.ts`: `HttpError.data` é `unknown` de
 * propósito, porque quem sabe a forma é quem chamou a rota.
 *
 * O `409` significa uma coisa só nesta rota: obra daquele tipo já aponta pra
 * aquele provedor. E o número importa porque a consequência é invisível —
 * `bindingFor` é o que serve arte e detalhe, então sem a receita elas param de
 * carregar sem nada dizer por quê.
 */
export function pairInUseCount(error: unknown): number | null {
  if (!(error instanceof HttpError) || error.status !== 409) {
    return null
  }
  const data = error.data
  if (typeof data !== 'object' || data === null) {
    return null
  }
  const { entryCount } = data as Record<string, unknown>
  return typeof entryCount === 'number' ? entryCount : null
}

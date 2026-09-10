import type { MediaTypeInfo } from '@/domain/media-type'
import type { Provider } from '@/services/providers'

/**
 * O escopo da busca — o tipo de mídia, e ele é OBRIGATÓRIO.
 *
 * `GET /api/search` exige `type`, então não existe "All": um "All" prometeria
 * um ranking comum entre catálogos que não compartilham identificador, que é
 * exatamente o que a decisão de "uma busca = um tipo = um provedor" recusa.
 *
 * **O escopo é parâmetro da consulta, não recorte do resultado** — e é por isso
 * que ele mora dentro do campo, e não numa fileira de filtro (design system,
 * seção 5, 01/09/2026). A FONTE é parâmetro pelo mesmo motivo, e é por isso que
 * ela mora no mesmo menu.
 */

/** Um provedor como a tela o nomeia: chave pra mandar, nome pra ler. */
export type Source = { slug: string; name: string }

/**
 * As fontes de um tipo: quem responde hoje, e quais são as opções.
 *
 * `opcoes` tem pelo menos um item — tipo sem provedor não entra no mapa, e é a
 * ausência da chave que significa "não há onde buscar".
 */
export type TypeSources = { current: Source; options: Source[] }

/**
 * slug do tipo → as fontes dele.
 *
 * ── Por que o provedor efetivo entra aqui — 02/09/2026 ──────────────────────
 * A versão anterior lia só a lista de provedores e escolhia o **primeiro por
 * slug**, com um comentário dizendo que era "a mesma ordem que o servidor usa
 * pra desempatar quem responde, senão o menu prometeria uma fonte e outra
 * responderia".
 *
 * A ordem deixou de ser a mesma no dia em que um tipo ganhou provedor padrão:
 * o servidor passou a escolher por `default_provider_slug` e a tela continuou
 * escolhendo por alfabeto. **O defeito que o comentário existia pra evitar
 * aconteceu** — com Jikan e Kitsu servindo anime, o menu dizia "Jikan" e o
 * Kitsu respondia.
 *
 * **E aconteceu de novo em 10/09/2026, um degrau acima:** o servidor ganhou a
 * preferência de quem busca (`preferred_search_sources`), que vence o efetivo.
 * Sem ela aqui, o menu voltaria a dizer o padrão do admin enquanto a busca
 * responderia com a fonte escolhida. **Por isso `preferred` é parâmetro e não
 * uma leitura de dentro:** a regra é pura, e quem a alimenta é a tela que já
 * tem as duas consultas na mão.
 *
 * A régua: **onde o servidor decide, a tela lê a decisão — não a reimplementa.**
 * `effectiveProvider` já vem resolvido no `GET /api/media-types`, e o alfabeto
 * sobra só pro caso em que ele é nulo, que é exatamente onde o servidor também
 * cai no alfabeto (`chooseSearchProvider`): ninguém definiu padrão e há mais de um
 * candidato. As duas pontas voltam a concordar por LEREM a mesma coisa, em vez
 * de calcularem a mesma coisa em dois lugares.
 */
export function sourcesByType(
  types: readonly MediaTypeInfo[],
  providers: readonly Provider[],
  preferred: Readonly<Record<string, string>> = {},
): Map<string, TypeSources> {
  const nameBySlug = new Map(providers.map((p) => [p.slug, p.name]))
  const map = new Map<string, TypeSources>()

  for (const type of types) {
    /**
     * Ordenado por slug porque é esse o desempate do servidor quando não há
     * padrão — e porque a lista que a pessoa lê e a ordem que decide quem
     * responde precisam ser a mesma.
     *
     * Provedor sem nome conhecido cai fora: ele existe na associação mas não na
     * lista que esta tela recebeu, e um item sem rótulo seria um controle que
     * não diz o que faz.
     */
    const options = [...type.providers]
      .sort((a, b) => a.localeCompare(b))
      .flatMap((slug) => {
        const name = nameBySlug.get(slug)
        return name ? [{ slug, name }] : []
      })

    /**
     * O primeiro sai numa constante em vez de `opcoes[0]` no `??` porque com
     * `noUncheckedIndexedAccess` o índice é `T | undefined` — e o
     * `opcoes.length === 0` que guardava isso acima não ensina nada ao
     * compilador. Um `continue` sobre a própria constante ensina, e some com a
     * checagem duplicada de vazio.
     */
    const first = options[0]
    if (!first) {
      continue
    }

    /**
     * A precedência é a MESMA do servidor, e por isso ela é lida em vez de
     * inventada — ver o cabeçalho do tipo: quando as duas contas divergiram,
     * o menu prometeu uma fonte e outra respondeu.
     *
     * `chooseSearchProvider` tem quatro degraus: o pedido explícito (que é o
     * `?provider=` e não passa por aqui), **a preferência de quem busca**, o
     * efetivo do admin, e o primeiro por slug. Os três últimos são estes.
     */
    const current =
      options.find((option) => option.slug === preferred[type.slug]) ??
      options.find((option) => option.slug === type.effectiveProvider) ??
      first

    map.set(type.slug, { current, options })
  }

  return map
}

/**
 * Qual fonte de fato responde — a pedida, se ela serve o tipo; senão a que manda.
 *
 * **Existe pra não haver duas contas dessa mesma coisa.** Ela nasceu em
 * 02/09/2026 depois de o cálculo ser escrito à mão no cabeçalho e ESQUECIDO no
 * estado vazio: o campo prometia "Search Anime on Jikan" e a frase logo abaixo
 * dizia "Anime are searched on Kitsu", na mesma tela, ao mesmo tempo.
 *
 * Fonte pedida que não serve o tipo cai na que manda em vez de sumir: é o que o
 * servidor faz com `provider` inválido (400), e a tela não pode prometer uma
 * fonte que a consulta vai recusar.
 */
export function effectiveSource(
  sources: TypeSources | null,
  requested: string | null,
): Source | null {
  if (!sources) {
    return null
  }
  return (
    sources.options.find((option) => option.slug === requested) ??
    sources.current
  )
}

/**
 * Em qual tipo a tela abre quando a URL não diz.
 *
 * **O primeiro COM fonte**, e não simplesmente o primeiro: abrir num tipo que
 * não tem onde buscar mostraria uma explicação no lugar de um campo pronto, e a
 * pessoa que clicou em `Search` quer buscar. Hoje isso importa muito — quatro
 * dos seis tipos semeados não têm provedor, e essa é a instalação normal.
 *
 * Sem nenhum tipo com fonte, cai no primeiro do vocabulário: aí a explicação é
 * a resposta certa, e ela precisa de um escopo pra falar sobre.
 */
export function defaultScope(
  types: readonly { slug: string }[],
  sourceByType: ReadonlyMap<string, unknown>,
): string | null {
  const served = types.find((type) => sourceByType.has(type.slug))
  return served?.slug ?? types[0]?.slug ?? null
}

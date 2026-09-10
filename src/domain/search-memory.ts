import type { TypeSources } from '@/domain/search-scope'

/**
 * O escopo LEMBRADO de `/search` — tipo e fonte, 10/09/2026, decisão do dono.
 *
 * ── O que o relato era ──────────────────────────────────────────────────────
 * "Ir na biblioteca e voltar pra busca devolve tudo ao começo." E o mecanismo
 * não é perda de estado: escopo e fonte moram na URL (`?type=`, `?provider=`),
 * o item `Search` da nav aponta pra `/search` **pelado**, e sem parâmetro a
 * tela cai em `defaultScope` — o primeiro tipo com fonte, que é `movie`/TMDB.
 * A tela tem um padrão, e **o padrão nunca é o que a pessoa estava fazendo**.
 *
 * ── A URL continua dona ─────────────────────────────────────────────────────
 * Isto **não** move o estado pro `localStorage`: ele semeia o padrão de quando
 * a URL está muda, e nada mais. Escolher escopo sempre escreve na URL, então
 * todo link de busca que alguém compartilha carrega `?type=` explícito — **o
 * único endereço ambíguo é o `/search` da nav**, que é exatamente o caso do
 * relato. Nenhum link compartilhado muda de sentido.
 *
 * ── O que NÃO pega carona, e o argumento é do próprio app ───────────────────
 * `/library` e `/piles` esquecem filtro e ordenação pelo mesmo mecanismo, e
 * **devem continuar esquecendo**. A distinção é a de 01/09: **escopo é
 * parâmetro da consulta, filtro é recorte do resultado**. Sem tipo, a busca não
 * tem o que perguntar — a ferramenta chega desconfigurada. Sem filtro, a
 * biblioteca mostra tudo, que é um estado completo e legítimo; lembrar um
 * filtro esconderia obras que ninguém pediu pra esconder.
 *
 * ── A fonte entra junto, e isso foi decisão do dono ─────────────────────────
 * Lembrar a fonte a transforma em **preferência**, e em 02/09 o argumento que
 * manteve `media_types.default_provider_slug` no projeto foi literalmente que o
 * seletor de `/search` não cobria o mesmo terreno — *"a fonte escolhida ali vive
 * na URL e é limpa ao trocar de tipo, então é por consulta e não preferência"*
 * (brief, 3.10). **A pergunta foi reaberta de frente**: o dono escolheu lembrar
 * as duas, e o que sustenta a coluna passa a ser o outro argumento, o que ela
 * sempre teve e que este `localStorage` não alcança — **sem padrão, o desempate
 * é o alfabeto, e alfabeto muda sozinho** quando entra um provedor de slug
 * anterior. Este aqui é por APARELHO e não decide nada pra quem chega de fora.
 */
export type RememberedScope = { type: string; provider: string | null }

/**
 * Lê o que ficou guardado e o **valida contra o vocabulário de agora**.
 *
 * Validar não é zelo: um tipo guardado pode ter sido **apagado** pelo admin
 * (brief, 3.9) ou **escondido** pela preferência do leitor (04/09), e semear o
 * escopo com um slug que não existe mais abriria a busca num tipo fantasma. É a
 * mesma checagem que `useStoredViewMode` faz contra a lista de modos — aqui ela
 * pesa mais, porque a lista não é constante de módulo: ela é dado.
 *
 * **Exige que o tipo ainda tenha FONTE**, e não só que exista. É o mesmo
 * argumento de `defaultScope`: abrir num tipo sem provedor mostra uma explicação
 * no lugar de um campo pronto, e quem clicou em `Search` quer buscar. Se a
 * associação caiu, o padrão volta a decidir.
 *
 * **A fonte é validada dentro do tipo**, nunca sozinha: o slug de um provedor
 * só é legível dentro do par (brief, 3.10), e uma fonte que não serve mais
 * aquele tipo vira `null` — o que cai na fonte efetiva, que é a resposta certa,
 * em vez de pedir ao servidor um par que ele recusa com 400.
 */
export function rememberedScope(
  raw: string | null,
  sourceByType: ReadonlyMap<string, TypeSources>,
): RememberedScope | null {
  const parsed = parse(raw)
  if (!parsed) {
    return null
  }

  const sources = sourceByType.get(parsed.type)
  if (!sources) {
    return null
  }

  const provider = sources.options.some(
    (option) => option.slug === parsed.provider,
  )
    ? parsed.provider
    : null

  return { type: parsed.type, provider }
}

/**
 * JSON e não duas chaves soltas: os dois valores só fazem sentido juntos — uma
 * fonte sem o tipo dela não é legível —, e ler um par escrito em dois momentos
 * é como eles ficariam fora de sincronia.
 *
 * Tudo que não for exatamente a forma esperada devolve nulo: o storage é
 * editável, sobrevive a uma versão em que o formato era outro, e um valor
 * quebrado não pode custar mais que um padrão.
 */
function parse(raw: string | null): RememberedScope | null {
  if (!raw) {
    return null
  }
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) {
      return null
    }
    const { type, provider } = value as Record<string, unknown>
    if (typeof type !== 'string' || type === '') {
      return null
    }
    return {
      type,
      provider:
        typeof provider === 'string' && provider !== '' ? provider : null,
    }
  } catch {
    return null
  }
}

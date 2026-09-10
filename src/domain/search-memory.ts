import type { TypeSources } from '@/domain/search-scope'

/**
 * O tipo com que `/search` abre quando a URL não diz — 10/09/2026, decisão do
 * dono.
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
 * biblioteca mostra tudo, que é um estado completo e legítimo.
 *
 * ── A FONTE saiu daqui em 10/09/2026, e a divisão é por SIGNIFICADO ─────────
 * Esta memória guardava o par `{tipo, fonte}`, e a fonte **mudou de lugar**:
 * ela virou preferência de conta (`preferred_search_sources`, no servidor). Não
 * é arrumação — as duas respondem perguntas diferentes:
 *
 * - *em que tipo eu estava?* é **hábito daquele aparelho**, da mesma família
 *   da sidebar recolhida e do modo de exibição, e some com o navegador sem
 *   perda nenhuma
 * - *com que fonte eu busco mangá?* é **escolha sobre o acervo**, vale no
 *   celular e no desktop, e **é uma por TIPO** — coisa que um par só nunca
 *   conseguiu guardar: escolher Kitsu pra mangá esquecia o que valia pra anime
 *
 * O par também prendia as duas ao mesmo gesto: quem trocasse de tipo perdia a
 * fonte do tipo anterior, porque só havia uma linha pra guardar as duas.
 */
export type RememberedType = string

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
 */
export function rememberedType(
  raw: string | null,
  sourceByType: ReadonlyMap<string, TypeSources>,
): RememberedType | null {
  const parsed = parse(raw)
  if (!parsed || !sourceByType.has(parsed)) {
    return null
  }
  return parsed
}

/**
 * Aceita o slug cru **e** o objeto que a versão anterior gravava.
 *
 * O `localStorage` sobrevive a uma release: quem usou o app antes de 10/09 tem
 * `{"type":"anime","provider":"kitsu"}` gravado, e ler isso como "não sei"
 * mandaria de volta ao padrão exatamente quem o remendo veio servir. O
 * `provider` do formato antigo é **descartado de propósito** — ele era do
 * aparelho e virou preferência de conta, e promovê-lo aqui escreveria na conta
 * uma escolha feita noutro navegador.
 *
 * Tudo que não for uma das duas formas devolve nulo: o storage é editável, e um
 * valor quebrado não pode custar mais que um padrão.
 */
function parse(raw: string | null): string | null {
  if (!raw) {
    return null
  }
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value === 'string') {
      return value === '' ? null : value
    }
    if (typeof value === 'object' && value !== null) {
      const { type } = value as Record<string, unknown>
      return typeof type === 'string' && type !== '' ? type : null
    }
    return null
  } catch {
    return null
  }
}

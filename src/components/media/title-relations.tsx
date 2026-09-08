import { Link } from '@tanstack/react-router'
import { searchCopy } from '../../routes/-search.copy'
import { RemoteArt } from './remote-art'
import { TitleSection } from './title-detail'

/**
 * O que a tela precisa de um vínculo. Espelha a forma do contrato — ver
 * `titles.public.ts`, campo `relations`.
 */
export type TitleRelation = {
  kind: string | null
  provider: string
  externalId: string
  type: string
  title: string
  year: number | null
  art: string | null
}

/**
 * Os VÍNCULOS de uma obra, uma seção por tipo de relação — 02/09/2026.
 *
 * ── Por que uma seção por tipo, e não uma seção com o rótulo na carta ──────
 * `Prequel`, `Sequel` e `Adaptation` respondem perguntas diferentes, e o
 * enquadramento do Yamtrack (uma aba "Parent Game") diz a mesma coisa: o tipo
 * da relação é **cabeçalho**, não atributo do item.
 *
 * Pôr o rótulo na carta também custaria caro no lugar errado: a segunda linha
 * dela já carrega ano e subtipo, e o degradê que a torna legível foi medido
 * contando com o título numa altura fixa (design system, seção 9).
 *
 * ── A ordem é a que o provedor devolveu ────────────────────────────────────
 * Agrupar preserva a primeira aparição de cada tipo, em vez de ordenar por
 * alfabeto ou por uma hierarquia inventada. O provedor sabe o que é mais
 * próximo da obra; nós não.
 */
export function TitleRelations({ relations }: { relations: TitleRelation[] }) {
  if (relations.length === 0) {
    return null
  }

  /**
   * Agrupado preservando a ordem de chegada. `Map` e não objeto: chave de
   * objeto com número dentro reordena sozinha, e `kind` vem do provedor.
   */
  const byType = new Map<string, TitleRelation[]>()
  for (const relation of relations) {
    const key = relation.kind ?? searchCopy.relatedFallback
    byType.set(key, [...(byType.get(key) ?? []), relation])
  }

  return (
    <>
      {[...byType].map(([kind, ofKind]) => (
        <TitleSection key={kind} title={kind}>
          <RelationGrid relations={ofKind} />
        </TitleSection>
      ))}
    </>
  )
}

/**
 * As RECOMENDAÇÕES — 03/09/2026.
 *
 * ── Por que é OUTRO componente, se a carta e a grade são as mesmas ─────────
 * Porque a regra de agrupamento não é a mesma, e é ela que faz o componente
 * acima existir. Lá `kind` é o cabeçalho e a lista vira N seções; aqui `kind`
 * é nulo em todo item — nenhum dos três provedores nomeia a relação, porque
 * não há relação a nomear — e a lista é **uma** seção, cujo título é copy
 * nossa.
 *
 * Passar isto pelo `TitleRelations` cairia no `relatedFallback`, e aí uma
 * recomendação apareceria sob o mesmo cabeçalho de um vínculo cujo provedor
 * esqueceu de nomear. São coisas diferentes: o vínculo AFIRMA, a recomendação
 * SUGERE.
 *
 * A carta e a grade são compartilhadas de verdade, e não copiadas — duas
 * medidas para o mesmo objeto é como uma fica pra trás.
 */
export function TitleRecommendations({
  recommendations,
}: {
  recommendations: TitleRelation[]
}) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <TitleSection title={searchCopy.recommended}>
      <RelationGrid relations={recommendations} />
    </TitleSection>
  )
}

/**
 * A grade das duas listas. **A MESMA da busca**, com os mesmos tokens: a carta
 * é a mesma peça, e duas medidas para o mesmo objeto é como uma fica pra trás.
 */
function RelationGrid({ relations }: { relations: TitleRelation[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
      {relations.map((relation) => (
        <li
          key={`${relation.type}/${relation.externalId}`}
          className="h-card-poster-h w-full max-w-card-poster-max"
        >
          <RelationCard relation={relation} />
        </li>
      ))}
    </ul>
  )
}

/**
 * A carta de um vínculo — a mesma forma da carta de resultado de busca.
 *
 * **O tipo viaja no endereço**, como em toda navegação para um detalhe de
 * provedor: sem ele o id não identifica a obra, e aqui isso não é teoria — o
 * `Adaptation` de um anime aponta para um mangá, então `relation.type` difere
 * do tipo da tela em que se estava.
 */
function RelationCard({ relation }: { relation: TitleRelation }) {
  return (
    <Link
      to="/search/$provider/$externalId"
      params={{
        provider: relation.provider,
        externalId: relation.externalId,
      }}
      search={{ type: relation.type }}
      className="group relative block h-full w-full overflow-hidden rounded-md text-left outline-none ring-ink transition-shadow duration-[var(--motion-micro)] ease-chrome hover:ring-2 focus-visible:ring-[3px] focus-visible:ring-ink/50"
    >
      <RemoteArt
        src={relation.art}
        title={relation.title}
        className="absolute inset-0 h-full w-full text-3xl"
      />
      {/* `from-35%` pelo mesmo reason da carta de searchQuery: medido contra um
       * pôster branco, que é o pior caso (design system, seção 9). */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-0.5 bg-gradient-to-t from-35% from-surface to-transparent px-2 pt-8 pb-2">
        <p className="truncate font-medium text-ink text-xs">
          {relation.title}
        </p>
        <p className="truncate text-[11px] text-faint tabular-nums">
          {relation.year ?? searchCopy.yearUnknown}
        </p>
      </div>
    </Link>
  )
}

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import {
  AddEntrySheet,
  type EntryPick,
} from '@/components/library/add-entry-sheet'
import {
  ScorePair,
  TitleDetail,
  TitleSection,
} from '@/components/media/title-detail'
import {
  ProviderTitleNotFound,
  TitleDetailError,
  TitleDetailSkeleton,
  TitleUnavailable,
} from '@/components/media/title-detail-states'
import { DetailsBox, LinksBox } from '@/components/media/title-rail'
import {
  TitleRecommendations,
  TitleRelations,
} from '@/components/media/title-relations'
import {
  UnitGroupGrid,
  UnitList,
  UnitListSkeleton,
} from '@/components/media/title-units'
import { OpenIcon } from '@/components/menu/menu-icons'
import { Button } from '@/components/ui/button'
import { defaultGroup } from '@/domain/unit-offset'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { useProgressUnit } from '@/hooks/queries/media-types/use-progress-unit'
import { useProviderTitleDetails } from '@/hooks/queries/titles/use-title-details'
import { useProviderUnits } from '@/hooks/queries/titles/use-title-units'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { useGoBack } from '@/hooks/use-go-back'
import { useRequireSession } from '@/hooks/use-require-session'
import { titleDetailCopy } from './-title-detail.copy'

export const Route = createFileRoute('/search/$provider/$externalId')({
  /**
   * **O tipo vai na URL, e não é enfeite**: no TMDB o id `1396` é uma série e
   * pode ser outro filme. O par (tipo, id) é que identifica a obra, e é ele
   * que decide qual endpoint ler — então o endereço tem que carregá-lo, senão
   * o link não é compartilhável.
   */
  validateSearch: (searchQuery: Record<string, unknown>) => ({
    type: typeof searchQuery.type === 'string' ? searchQuery.type : '',
  }),
  component: ProviderTitleRoute,
})

function Plus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  )
}

/**
 * A obra do PROVEDOR — a que ainda não é de ninguém.
 *
 * Mesmo molde de `/library/:id`, e o que muda é a fonte: aqui o provedor é a
 * **única**, então sem ele não há tela. É por isso que esta rota tem recusa e
 * a irmã não: lá o provedor só enriquece o que o servidor já respondeu.
 *
 * **A folha continua sendo o formulário.** Ela não morre com esta tela — o que
 * virou tela cheia foi o OLHAR, não o preencher: título, status, total e
 * pilhas continuam sendo perguntas de formulário, e a folha é onde elas moram.
 */
function ProviderTitleRoute() {
  const { provider, externalId } = Route.useParams()
  const { type } = Route.useSearch()
  const navigate = useNavigate()
  const user = useRequireSession()
  const logout = useLogout()
  const [adding, setAdding] = useState(false)
  const [group, setGroup] = useState<number | null>(null)
  const typeUnit = useProgressUnit()

  const details = useProviderTitleDetails(provider, externalId, type)
  const isLoading = useDelayedPending(details.isPending)
  /** O DESTINO — a copy do não-encontrado nomeia o lugar ("Back to search"). */
  const toSearch = () => navigate({ to: '/search' })
  /**
   * A volta do cabeçalho. Sem histórico — link direto, aba nova, recarregar —
   * ela cai na busca, que é de onde esta tela teria vindo.
   */
  const goBack = useGoBack(toSearch)

  if (!user) {
    return null
  }

  const data = details.data ?? null
  /**
   * A identidade desta abertura da folha, e ela é **dada por quem abre**
   * (design system, seção 8, quinta leva): dois resultados diferentes podem
   * ter o mesmo título, e "mudou de alvo?" não se responde olhando o alvo.
   */
  const pick: EntryPick | null = data
    ? {
        key: `${provider}:${externalId}`,
        mediaType: type,
        title: data.title,
        year: data.year,
        synopsis: data.synopsis,
        art: data.art,
        providerName: data.provider.name,
        source: { provider, externalId },
      }
    : null

  function content() {
    /**
     * O 404 vem antes do esqueleto — resposta definitiva não fica atrás de
     * espera. E aqui a ausência é do PROVEDOR, não nossa: a copy diz de quem
     * é, senão se lê como defeito deste servidor.
     */
    if (details.isError && details.error.status === 404) {
      return <ProviderTitleNotFound providerName={provider} onBack={toSearch} />
    }

    if (isLoading) {
      return <TitleDetailSkeleton />
    }

    /**
     * A recusa vem do corpo do 503, com `reason` — cada motivo tem uma saída
     * diferente, e é o campo que deixa a tela escolher a copy.
     */
    if (details.isError && details.error.status === 503) {
      const reason = (
        details.error.data as {
          reason?: keyof typeof titleDetailCopy.unavailable
        }
      )?.reason
      return reason ? (
        <TitleUnavailable
          reason={reason}
          onRetry={() => void details.refetch()}
        />
      ) : (
        <TitleDetailError
          error={details.error}
          onRetry={() => void details.refetch()}
        />
      )
    }

    if (details.isError) {
      return (
        <TitleDetailError
          error={details.error}
          onRetry={() => void details.refetch()}
        />
      )
    }

    if (!data) {
      return null
    }

    const groups = data.unitGroups
    const active = group ?? defaultGroup(groups)
    // Mesma regra da tela de dentro: com grupos o nome é do provedor, sem
    // grupos é a unidade de progresso do tipo, que já vem plural e traduzida.
    const groupName =
      groups.find(({ number }) => number === active)?.name ??
      typeUnit(type) ??
      ''

    return (
      <TitleDetail
        title={data.title}
        mediaType={type}
        meta={[
          data.year ? String(data.year) : null,
          titleDetailCopy.from(data.provider.name),
        ]}
        synopsis={data.synopsis}
        art={data.art}
        snapshot={data.snapshot}
        onBack={goBack}
        column={
          <>
            {/* **Um botão e os details, e mais nada.** Progresso, status,
             * pilha e notas só existem depois de adicionar — é isso que faz as
             * duas telas se parecerem sem que a de fora prometa o que não tem. */}
            {data.ownedEntryId === null ? (
              <Button
                onClick={() => setAdding(true)}
                className="h-10 w-full gap-2"
              >
                <Plus />
                {titleDetailCopy.add}
              </Button>
            ) : (
              /**
               * **O botão nomeia o DESTINO, e diz por que ir.**
               *
               * Ele dizia `Already in your library` — um fato, não uma ação —,
               * e levava pra obra sem nada indicar isso: um estado final que
               * anunciava "o que você quer está em outro lugar" sem oferecer o
               * caminho. A linha abaixo é a que faltava: ela diz o que só existe
               * lá, e por quê (esta página é a do provedor, não a sua).
               *
               * **Ele quase não aparece no caminho comum**, porque adicionar já
               * leva pra lá. Ele é pra quem CHEGA numa obra que já tem — pelos
               * resultados, por um vínculo ou por `More like this` —, e aí não
               * houve gesto de adicionar que justificasse mover a pessoa.
               */
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  className="h-10 w-full gap-2"
                  onClick={() =>
                    navigate({
                      to: '/library/$entryId',
                      params: { entryId: String(data.ownedEntryId) },
                    })
                  }
                >
                  <OpenIcon />
                  {titleDetailCopy.owned}
                </Button>
                <p className="px-0.5 text-faint text-xs leading-relaxed">
                  {titleDetailCopy.ownedHint}
                </p>
              </div>
            )}
            <DetailsBox
              rows={[
                {
                  label: titleDetailCopy.fields.format,
                  value: data.subtype,
                },
                { label: titleDetailCopy.fields.year, value: data.year },
                {
                  label: titleDetailCopy.fields.seasons,
                  value: groups.filter(({ number }) => number >= 1).length,
                },
                { label: titleDetailCopy.fields.episodes, value: data.total },
              ]}
            />
            <LinksBox links={data.links} />
          </>
        }
      >
        <ScorePair
          yours={
            <div className="flex min-w-32 flex-1 flex-col gap-0.5 rounded-md px-3 py-2 ring-1 ring-line">
              <span className="text-[0.6875rem] text-faint uppercase tracking-wide">
                {titleDetailCopy.yourScore}
              </span>
              <span className="font-medium text-faint text-xl">
                {titleDetailCopy.scoreEmpty}
              </span>
              <span className="text-faint text-xs">
                {data.ownedEntryId === null
                  ? titleDetailCopy.addHint
                  : titleDetailCopy.ownedScoreHint}
              </span>
            </div>
          }
          provider={
            data.score === null
              ? null
              : {
                  name: data.provider.name,
                  score: data.score,
                  votes: data.votes,
                }
          }
        />

        {groups.length > 0 && (
          <TitleSection title={titleDetailCopy.seasons}>
            <UnitGroupGrid
              groups={groups}
              active={active}
              onGroup={setGroup}
              progress={null}
              offsetDe={() => null}
            />
          </TitleSection>
        )}

        {/* List PLANA: `hasUnits` sem group nenhum. Ver `library.$entryId`. */}
        {data.hasUnits && (groups.length === 0 || active !== null) && (
          <TitleSection title={groupName}>
            <ProviderUnits
              provider={provider}
              externalId={externalId}
              type={type}
              group={active}
              enabled
            />
          </TitleSection>
        )}

        {/* Os VÍNCULOS vêm por último: são navegação pra FORA desta entry, e
         * tudo que é sobre ela — nota, temporadas, unidades — vem antes.
         *
         * E a RECOMENDAÇÃO vem depois do vínculo, porque é a peça mais fraca
         * da página: vínculo é fato do catálogo, recomendação é sugestão. */}
        <TitleRelations relations={data.relations} />
        <TitleRecommendations recommendations={data.recommendations} />
      </TitleDetail>
    )
  }

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      screenTitle={data?.title ?? ''}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      {content()}
      {pick && (
        <AddEntrySheet
          key={pick.key}
          open={adding}
          onOpenChange={setAdding}
          pick={pick}
          /**
           * **Adicionar TERMINA nesta tela, e a próxima é a de dentro.**
           *
           * Aqui você está olhando UMA obra, e o que vem depois de adicionar é
           * acompanhá-la — progresso, status, pilhas, notas. Nada disso existe
           * nesta página, que é a do provedor (decisão de 01/09: são duas telas
           * e um molde, e o que difere é o bloco de estado). Ficar aqui deixava
           * um botão dizendo "está lá" sem levar ninguém.
           *
           * **`replace` e não push**, e é o miolo do conserto: a página do
           * provedor de uma obra que agora é sua é um beco — ela não sabe
           * mostrar nada do que você quer em seguida. Deixá-la no histórico
           * fazia o "voltar" cair nela e exigir um segundo "voltar" pra chegar
           * na busca. Com `replace`, voltar vai direto pros resultados, que é de
           * onde você veio e onde você continua.
           *
           * A troca de tela é quase invisível de propósito: as duas usam o
           * mesmo molde, e o que muda é a coluna trocar o botão pelo estado —
           * lê-se como "a página virou sua", que é exatamente o que aconteceu.
           */
          onCreated={(created) =>
            navigate({
              to: '/library/$entryId',
              params: { entryId: String(created.id) },
              replace: true,
            })
          }
        />
      )}
    </AppShell>
  )
}

/** A lista da obra que ainda não é sua: só leitura, sem alvo de marcar. */
function ProviderUnits({
  provider,
  externalId,
  type,
  group,
  enabled,
}: {
  provider: string
  externalId: string
  type: string
  group: number | null
  enabled: boolean
}) {
  const units = useProviderUnits(provider, externalId, type, group, enabled)

  if (!enabled) {
    return null
  }
  if (units.isPending) {
    return <UnitListSkeleton />
  }
  if (units.isError || !units.data) {
    return null
  }

  return <UnitList units={units.data.units} progress={null} />
}

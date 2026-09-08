import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { LinkProviderSheet } from '@/components/media/link-provider-sheet'
import { SourcePreviewBar } from '@/components/media/source-preview-bar'
import { StatusButton } from '@/components/media/status-button'
import { TitleActions } from '@/components/media/title-actions'
import {
  ScorePair,
  TitleDetail,
  TitleSection,
} from '@/components/media/title-detail'
import {
  TitleDetailError,
  TitleDetailSkeleton,
  TitleNotFound,
} from '@/components/media/title-detail-states'
import {
  ActivityBox,
  DetailsBox,
  LinksBox,
} from '@/components/media/title-rail'
import {
  TitleRecommendations,
  TitleRelations,
} from '@/components/media/title-relations'
import { SourcesBox } from '@/components/media/title-sources'
import {
  NotesBox,
  PilesBox,
  ProgressBox,
  YourScore,
} from '@/components/media/title-state'
import {
  UnitGroupGrid,
  UnitList,
  UnitListSkeleton,
} from '@/components/media/title-units'
import { showsCounter } from '@/domain/shows-counter'
import { defaultGroup, unitOffset } from '@/domain/unit-offset'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { useAddProgress } from '@/hooks/mutations/entries/use-add-progress'
import { useSetPrimarySource } from '@/hooks/mutations/entries/use-set-primary-source'
import { useEntry } from '@/hooks/queries/entries/use-entry'
import { useEntryHistory } from '@/hooks/queries/entries/use-entry-history'
import { useEntryLinks } from '@/hooks/queries/entries/use-entry-links'
import { useCountsProgress } from '@/hooks/queries/media-types/use-counts-progress'
import { useMediaTypeMap } from '@/hooks/queries/media-types/use-media-type-map'
import { useProgressUnit } from '@/hooks/queries/media-types/use-progress-unit'
import {
  useEntryTitleDetails,
  useProviderTitleDetails,
} from '@/hooks/queries/titles/use-title-details'
import {
  useEntryUnits,
  useProviderUnits,
} from '@/hooks/queries/titles/use-title-units'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { useGoBack } from '@/hooks/use-go-back'
import { useRequireSession } from '@/hooks/use-require-session'
import { formatDate } from '@/lib/format'
import type { EntryLink } from '@/services/entries'
import { titleDetailCopy } from './-title-detail.copy'

export const Route = createFileRoute('/library/$entryId')({
  component: EntryDetailRoute,
})

/**
 * A obra que É sua — lida do que o servidor guarda.
 *
 * **Duas consultas, e elas não são iguais.** `useEntry` é a obra: título,
 * progresso, status, nota, notas — o que este servidor tem e responde offline.
 * `useEntryTitleDetails` é o contexto do provedor: sinopse, ano, arte. A
 * primeira decide se a tela existe; a segunda só enriquece, e **falhar nela
 * não é falha da tela** (brief, 3.10) — obra digitada à mão nunca terá
 * contexto nenhum, e isso é normal, não erro.
 *
 * É essa assimetria que separa esta tela da irmã em `/search`: lá o provedor é
 * a única fonte, e sem ele não há o que mostrar.
 */
function EntryDetailRoute() {
  const { entryId } = Route.useParams()
  const id = Number(entryId)
  const [group, setGroup] = useState<number | null>(null)
  const typeUnit = useProgressUnit()
  const navigate = useNavigate()
  const user = useRequireSession()
  const logout = useLogout()

  const [linking, setLinking] = useState(false)
  /**
   * O vínculo que a tela está PREVENDO — e prever é renderizar a página como
   * ela ficaria, não desenhar uma miniatura dela.
   *
   * A primeira versão punha um par de cartões na coluna de 200px e o dono
   * apontou que não dava pra ver detalhe nenhum. **O preview de uma tela é a
   * tela**: `TitleDetail` já é o molde de `/search/:provider/:id`, que desenha
   * "esta obra vista por um provedor", então prever é o TERCEIRO chamador dele
   * — sem componente novo e sem uma segunda medida do mesmo objeto.
   */
  const [projecting, setProjecting] = useState<EntryLink | null>(null)

  const entry = useEntry(id)
  const details = useEntryTitleDetails(id)
  const links = useEntryLinks(id)
  const promote = useSetPrimarySource(id)
  /**
   * O contexto do vínculo que se está prevendo, ao vivo.
   *
   * `enabled` pelo modo: sem preview aberto não há pergunta a fazer, e é a
   * mesma consulta que a tela irmã já usa — nenhuma rota nova.
   */
  const preview = useProviderTitleDetails(
    projecting?.provider.slug ?? '',
    projecting?.externalId ?? '',
    entry.data?.mediaType ?? '',
    projecting !== null && entry.data !== undefined,
  )

  /**
   * A previsão morre quando o vínculo que a abriu deixa de existir — desvincular
   * numa segunda aba, por exemplo. Sem isto a página ficaria prevendo uma fonte
   * que a obra não tem mais, e o `Use this source` responderia 404.
   */
  const projection =
    projecting &&
    links.data?.some((l) => l.provider.slug === projecting.provider.slug)
      ? projecting
      : null
  const history = useEntryHistory(id)
  const { map } = useMediaTypeMap()
  const type = entry.data ? map.get(entry.data.mediaType) : undefined
  /** A unidade vem do TIPO: em mangá isto lê "chapters" sem código novo. */
  const unit = type?.progressUnit ?? 'units'
  const countsProgress = useCountsProgress()

  // Só a obra manda no esqueleto. Esperar o provedor deixaria a tela em branco
  // por causa de uma ida à rede que pode nem ter resposta.
  const isLoading = useDelayedPending(entry.isPending)
  /**
   * O DESTINO, e ele não passa pelo histórico: quem o usa é o não-encontrado,
   * cuja copy nomeia o lugar ("Back to library"), e o apagar, depois do qual
   * voltar poderia recair na obra que acabou de deixar de existir.
   */
  const toLibrary = () => navigate({ to: '/library' })
  /** A volta do cabeçalho, que é sobre o histórico e cai no destino sem ele. */
  const goBack = useGoBack(toLibrary)

  if (!user) {
    return null
  }

  function content() {
    /**
     * O 404 vem ANTES do esqueleto, e a ordem foi defeito visto na tela em
     * `/piles/:id`: resposta definitiva não fica atrás de espera (design
     * system, seção 8, quarta leva).
     */
    if (entry.isError && entry.error.status === 404) {
      return <TitleNotFound onBack={toLibrary} />
    }

    if (isLoading) {
      return <TitleDetailSkeleton />
    }

    if (entry.isError) {
      return (
        <TitleDetailError
          error={entry.error}
          onRetry={() => void entry.refetch()}
        />
      )
    }

    if (!entry.data) {
      return null
    }

    /**
     * O contexto entra quando existe. **Nada aqui espera por ele nem reclama
     * dele** — 404 é obra sem vínculo, 503 é provedor sem chave, e nos dois
     * casos a tela mostra o que já tem em vez de virar um painel de erro por
     * causa de uma sinopse.
     */
    /**
     * **Prevendo, o contexto é o do OUTRO vínculo** — e é só isso que a
     * previsão faz. Tudo abaixo já lê `contexto`: sinopse, ano, formato, links,
     * vínculos e a lista de unidades. Trocar a fonte desta variável é o que faz
     * a página inteira mostrar como ela ficaria, sem um componente novo.
     *
     * A coluna esquerda **não** troca: progresso, status, nota, notas e pilhas
     * são da obra, e vê-los parados ao lado é a prova visual do que a barra
     * promete por escrito.
     */
    const context = (projection ? preview.data : details.data) ?? null
    const groups = context?.unitGroups ?? []
    const active = group ?? defaultGroup(groups)
    const offsetDe = (numero: number) => unitOffset(groups, numero)
    const offset = active === null ? 0 : offsetDe(active)
    /**
     * O título da seção de unidades.
     *
     * Com grupos é o nome que o PROVEDOR deu ("Season 1"). **Sem grupos** —
     * anime no Jikan, que devolve episódio numa lista plana — ele vem da
     * unidade de progresso do tipo, que já chega plural e capitalizada do
     * servidor ("Episodes", "Episódios") e já no idioma de quem lê. Escrever
     * "Episodes" aqui erraria em mangá, que é o mesmo motivo pelo qual o
     * schema não se chama `episodes`.
     */
    const groupName =
      groups.find(({ number }) => number === active)?.name ??
      typeUnit(entry.data.mediaType) ??
      ''
    const effectiveTotal = entry.data.total ?? context?.total ?? null

    return (
      <TitleDetail
        title={entry.data.title}
        mediaType={entry.data.mediaType}
        meta={[
          context?.year ? String(context.year) : null,
          context?.provider.name
            ? titleDetailCopy.from(context.provider.name)
            : null,
        ]}
        synopsis={context?.synopsis ?? null}
        snapshot={context?.snapshot ?? null}
        onBack={goBack}
        /**
         * Prevendo, a arte vem do provedor — EMPRESTADA, como na tela de busca.
         * `entry.art` aponta pro nosso cache, que o servidor resolve pelo
         * vínculo efetivo de HOJE: mantê-la mostraria o pôster antigo debaixo
         * da sinopse nova, que é a metade errada da previsão.
         */
        art={projection ? (context?.art ?? null) : entry.data.art}
        actions={<TitleActions entry={entry.data} onDeleted={toLibrary} />}
        column={
          <>
            {/* O total pode vir do PROVEDOR quando a entry não guarda um.
             * `entries.total` é o que a pessoa escreveu ao adicionar, e fica
             * nulo em quase toda obra vinda da busca — mas o provedor sabe
             * que Breaking Bad tem 62. Mostrar "8 / ?" com o número à mão é a
             * verdade menos útil possível, e o mesmo número vira o teto do
             * `+`, que também é o certo: não dá pra ver mais que 62. */}
            {/* O status é o botão PRIMÁRIO da coluna, logo sob o pôster: é a
             * coisa que mais muda numa obra em andamento e a primeira que se
             * olha. Cinco linhas de menu gastavam 130px pra dizer uma palavra. */}
            <StatusButton entry={entry.data} />
            {/* **Aqui é REMOÇÃO, não substituição** (07/09/2026): o status já
             * está logo acima, então uma obra que não conta simplesmente perde
             * a caixa. Nas listas e na carta o status entra no LUGAR do
             * contador porque lá não há nenhum outro.
             *
             * **O total que decide é o EFETIVO**, não `entries.total`: ele fica
             * nulo em quase toda obra vinda da busca, e quem manda é o número
             * que a pessoa está vendo — um filme que o provedor diz ter uma
             * unidade tem tão pouco a contar quanto um que a pessoa digitou. */}
            {showsCounter({
              typeCounts: countsProgress(entry.data.mediaType) !== false,
              total: effectiveTotal,
            }) && (
              <ProgressBox
                entry={entry.data}
                total={effectiveTotal}
                unit={unit}
              />
            )}
            <PilesBox entry={entry.data} />
            <NotesBox entry={entry.data} />
            <DetailsBox
              rows={[
                {
                  label: titleDetailCopy.fields.format,
                  value: context?.subtype ?? null,
                },
                {
                  label: titleDetailCopy.fields.year,
                  value: context?.year ?? null,
                },
                {
                  label: titleDetailCopy.fields.seasons,
                  value: groups.filter(({ number }) => number >= 1).length,
                },
                {
                  label: titleDetailCopy.fields.episodes,
                  value: effectiveTotal,
                },
              ]}
            />
            {/* As FONTES vêm depois dos details e antes dos links pra outside:
             * é a última coisa sobre de ONDE a obra fala, e o `LinksBox`
             * logo abaixo já é sobre sair daqui. */}
            <SourcesBox
              entryId={entry.data.id}
              previewing={projection?.provider.slug ?? null}
              onLink={() => setLinking(true)}
              onPreview={setProjecting}
            />
            <LinksBox links={context?.links ?? []} />
            <ActivityBox
              startedAt={history.data?.startedAt ?? null}
              lastAt={history.data?.lastAt ?? null}
              events={history.data?.events ?? 0}
              format={formatDate}
            />
          </>
        }
      >
        <ScorePair
          yours={<YourScore entry={entry.data} />}
          provider={
            context?.score === null || context === null
              ? null
              : {
                  name: context.provider.name,
                  score: context.score,
                  votes: context.votes,
                }
          }
        />

        {groups.length > 0 && (
          <TitleSection
            title={titleDetailCopy.seasons}
            aside={
              effectiveTotal === null ? undefined : (
                <span className="text-faint text-xs tabular-nums">
                  {titleDetailCopy.units.watched(
                    String(entry.data.progress),
                    String(effectiveTotal),
                  )}
                </span>
              )
            }
          >
            <UnitGroupGrid
              groups={groups}
              active={active}
              onGroup={setGroup}
              progress={entry.data.progress}
              offsetDe={offsetDe}
            />
          </TitleSection>
        )}

        {/**
         * **`grupos.length === 0` é um caminho, não um vazio.** A lista PLANA
         * — provedor que numera sem agrupar — tem `hasUnits` verdadeiro e
         * nenhum grupo, e `defaultGroup([])` devolve nulo. A condição anterior
         * exigia grupo ativo, então a lista inteira sumia: metade do desenho de
         * unidades existia desde 01/09/2026 e nunca tinha sido exercida, porque
         * o único provedor com unidades agrupava.
         */}
        {context?.hasUnits && (groups.length === 0 || active !== null) && (
          <TitleSection title={groupName}>
            <Units
              entryId={entry.data.id}
              projection={projection}
              mediaType={entry.data.mediaType}
              progress={entry.data.progress}
              group={active}
              offset={offset}
              enabled
            />
          </TitleSection>
        )}

        {/* Os VÍNCULOS vêm por último: são navegação pra FORA desta entry, e
         * tudo que é sobre ela — nota, temporadas, unidades — vem antes.
         *
         * E a RECOMENDAÇÃO vem depois do vínculo, porque é a peça mais fraca
         * da página: vínculo é fato do catálogo, recomendação é sugestão. */}
        <TitleRelations relations={context?.relations ?? []} />
        <TitleRecommendations
          recommendations={context?.recommendations ?? []}
        />

        {projection && (
          <SourcePreviewBar
            target={projection}
            isLoading={preview.isPending}
            failed={preview.isError}
            saving={promote.isPending}
            onCancel={() => setProjecting(null)}
            onConfirm={() =>
              promote.mutate(projection.provider.slug, {
                onSuccess: () => setProjecting(null),
              })
            }
          />
        )}
      </TitleDetail>
    )
  }

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      // O título da barra do CELULAR é o da obra: no desktop quem nomeia a
      // tela é o próprio cabeçalho dela, e aqui ele é o título em corpo 24.
      screenTitle={entry.data?.title ?? ''}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      {content()}
      {/* A folha mora FORA de `content()`: ela sobrevive à troca de estado da
       * tela, e montá-la dentro faria uma revalidação da obra desmontá-la no
       * meio da digitação. */}
      {entry.data && (
        <LinkProviderSheet
          entryId={entry.data.id}
          mediaType={entry.data.mediaType}
          title={entry.data.title}
          linked={(links.data ?? []).map(({ provider }) => provider.slug)}
          isAdmin={user.isAdmin}
          open={linking}
          onOpenChange={setLinking}
        />
      )}
    </AppShell>
  )
}

/**
 * A lista de unidades da obra que é sua.
 *
 * **Marcar é mover o CONTADOR**, não gravar um episódio: a unidade `n` está
 * vista quando o progresso chegou em `n`, e clicar nela leva o contador até
 * ali. Voltar também funciona, e o log append-only registra como delta
 * negativo (brief, 3.11) — nunca reescrita.
 */
function Units({
  entryId,
  projection,
  mediaType,
  progress,
  group,
  offset,
  enabled,
}: {
  entryId: number
  /**
   * Prevendo, a lista vem do provedor previsto e **não se marca**: mover o
   * contador a partir de uma tela que ainda não foi confirmada escreveria no
   * log por causa de um preview. Ver `onIrPara` abaixo.
   */
  projection: EntryLink | null
  mediaType: string
  progress: number
  group: number | null
  /** Nulo quando o provedor não disse quantas unidades os grupos anteriores
   * têm: sem isso não dá pra traduzir "E3" no contador, e marcar erraria. */
  offset: number | null
  enabled: boolean
}) {
  const fromEntry = useEntryUnits(entryId, group, enabled && !projection)
  const fromProvider = useProviderUnits(
    projection?.provider.slug ?? '',
    projection?.externalId ?? '',
    mediaType,
    group,
    enabled && projection !== null,
  )
  const units = projection ? fromProvider : fromEntry
  const advance = useAddProgress(entryId)

  if (!enabled) {
    return null
  }

  if (units.isPending) {
    return <UnitListSkeleton />
  }

  // 404 aqui é "este par não tem unidades", que o `hasUnits` já deveria ter
  // dito — e falha de rede não vira painel: a tela toda continua útil sem a
  // lista, então ela some em silêncio em vez de virar erro.
  if (units.isError || !units.data) {
    return null
  }

  return (
    <UnitList
      units={units.data.units}
      progress={progress}
      offset={offset ?? 0}
      onIrPara={
        offset === null || projection
          ? undefined
          : (absolute) => advance.mutate({ delta: absolute - progress })
      }
    />
  )
}

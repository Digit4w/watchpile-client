import { ChevronLeft, History } from 'lucide-react'
import type { ReactNode } from 'react'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { RemoteArt } from '@/components/media/remote-art'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'
import { formatRelativeTime } from '@/lib/format'
import { titleDetailCopy } from '@/routes/-title-detail.copy'
import type { TitleDetails } from '@/services/titles'

/**
 * O molde do detalhe de uma obra — **um só para as duas telas**.
 *
 * `/library/:id` mostra a obra que é sua; `/search/:provider/:id` mostra a do
 * provedor, ao vivo. Decisão do dono em 01/09/2026, pelo motivo da fonte, com
 * o mesmo visual — então o componente é um só e o que difere é o que entra em
 * `coluna` e em `conteudo`.
 *
 * ── DUAS COLUNAS QUE CORREM JUNTAS ─────────────────────────────────────────
 * Refeito em 01/09/2026, depois de o dono ver a primeira versão. Ela punha o
 * pôster à esquerda e empilhava o formulário à direita: a coluna esquerda
 * morria depois de 300px e a direita seguia por mais 800, e a página lia como
 * duas metades sem relação.
 *
 * Agora a esquerda é **contínua** — pôster, progresso, status, pilhas, notas,
 * detalhes, links, atividade — e a direita é só conteúdo. É o que faz a página
 * ser uma coisa só, e é também o que aproveita a largura: o conteúdo ganha a
 * tela inteira em vez de dividir espaço com um formulário.
 *
 * **Tela cheia, nunca folha lateral**: o detalhe cresce para a lista de
 * unidades com thumb e descrição, e isso não cabe numa folha.
 */
export function TitleDetail({
  title,
  mediaType,
  meta,
  synopsis,
  art,
  snapshot,
  actions,
  onBack,
  column,
  children,
}: {
  title: string
  mediaType: string
  /** Ano · contagem · de quem veio. Já montado, porque o que entra varia. */
  meta: (string | null)[]
  synopsis: string | null
  art: string | null
  /**
   * De quando é esta página, quando ela não é de agora.
   *
   * Nulo é o caso normal — o provedor respondeu. Preenchido significa que o
   * servidor degradou para o snapshot que guardou, e a linha diz de quando e
   * por quê.
   */
  snapshot: { fetchedAt: string; reason: SnapshotReason } | null
  /**
   * O `⋯` ao lado do título. Ausente na obra que não é sua — não há o que
   * remover nem onde guardar.
   */
  actions?: ReactNode
  /**
   * A volta. **Opcional porque o terceiro chamador deste molde não é uma
   * tela**: o preview de troca de fonte, em `/library/:id`, renderiza este
   * componente dentro da página onde a pessoa já está — ali não há de onde
   * voltar, e a saída é a barra de vidro do próprio preview.
   */
  onBack?: () => void
  /** A coluna esquerda, sob o pôster. É ela que difere entre as duas telas. */
  column: ReactNode
  /** As seções da direita — notas, temporadas, unidades, recomendações. */
  children: ReactNode
}) {
  const typeName = useMediaTypeName()

  return (
    <div className="flex flex-col gap-4">
      {/* **A volta fica ACIMA das duas colunas, não dentro de uma delas.** Ela
       * é sobre a NAVEGAÇÃO e não sobre a obra — pô-la ao lado do título a
       * misturaria com o `⋯`, que age sobre a obra. Fora do celular esta é a
       * única saída visível da tela: o desktop não tem barra de cima desde
       * 28/08, e o controle do navegador não existe no Electron.
       *
       * 44px de alvo, como o `⋯` do título: aqui a densidade não briga, então
       * esta peça também não herda a decisão em aberto #8. */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 inline-flex h-11 w-fit cursor-pointer items-center gap-1 rounded-md pr-3 pl-2 text-muted text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          <ChevronLeft size={16} strokeWidth={1.7} />
          {titleDetailCopy.back}
        </button>
      )}

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <aside className="flex shrink-0 flex-col gap-3 md:w-card-poster-h">
          {/* `eager`: o pôster está acima da dobra por definição, e — o que
           * importa mais — o `src` dele TROCA com o elemento montado, quando o
           * preview de fonte mostra a obra por outro vínculo. Preguiçoso ali não
           * reavalia, e a imagem nova nunca chega (ver `remote-art.tsx`). */}
          <RemoteArt
            src={art}
            title={title}
            eager
            className="aspect-poster w-full rounded-lg text-3xl ring-1 ring-line"
          />
          {column}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {/* **Acima do que ela governa**, e não ao pé da página: a linha
           * qualifica o título, o ano, a sinopse e os números logo abaixo, e
           * uma ressalva que se lê depois do conteúdo já chegou tarde. É a
           * mesma colocação da regra que governa a operação inteira na tela de
           * import (design system, seção 5).
           *
           * Fica nesta coluna e não acima das duas porque é ela que está
           * velha: o pôster vem do NOSSO cache em disco, e continua sendo o
           * que era. */}
          {snapshot && <SnapshotLine snapshot={snapshot} />}

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-6 items-center gap-1.5 rounded-sm bg-raised px-2 text-muted text-xs">
                <MediaTypeIcon type={mediaType} size={12} strokeWidth={1.7} />
                {typeName(mediaType)}
              </span>
              <p className="text-faint text-sm">
                {meta.filter(Boolean).join(' · ')}
              </p>
            </div>

            {/* O `⋯` fica na LINHA do título, alinhado ao topo dele: é ação
             * sobre a obra, e o título é quem a nomeia. Aqui os 44px saem de
             * graça — esta peça não herda a decisão em aberto #8, que é sobre
             * densidade de linha de listagem. */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-medium text-ink text-xl leading-tight md:text-2xl">
                {title}
              </h1>
              {actions}
            </div>

            {/* A ausência de sinopse é DITA, não escondida: entry digitada à mão
             * não tem provedor de onde tirá-la, e o espaço em branco no lugar
             * pareceria carregamento que nunca termina. */}
            <p
              className={`max-w-3xl text-sm leading-relaxed ${
                synopsis ? 'text-muted' : 'text-faint italic'
              }`}
            >
              {synopsis ?? titleDetailCopy.noSynopsis}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export type SnapshotReason = keyof typeof titleDetailCopy.snapshot.why

/**
 * A prova de que a lista de motivos acima é o `z.enum` do servidor, e não uma
 * segunda cópia à mão dele (brief, 3.7) — a mesma rede que `search-refusal.ts`
 * tem desde 02/09/2026.
 *
 * Sem isto, motivo novo no contrato chega calado: a linha renderiza `undefined`
 * depois do ponto separador e a tela diz "Saved copy from 3 days ago · " sem
 * terminar a frase. **Falha de contrato tem que quebrar o build, não a tela.**
 *
 * Nas duas direções de propósito: uma só provaria que a nossa lista cabe no
 * contrato, e não que ela o cobre inteiro — que é justamente o caso do motivo
 * novo.
 */
type ContractReason = NonNullable<TitleDetails['snapshot']>['reason']

type _CoversTheContract = ContractReason extends SnapshotReason ? true : never
type _FitsTheContract = SnapshotReason extends ContractReason ? true : never

const _proof: [_CoversTheContract, _FitsTheContract] = [true, true]
void _proof

/**
 * A linha que diz que esta página é uma cópia guardada.
 *
 * **Contorno, nunca cor.** Ela poderia ser uma pílula tingida, e não é: o fato
 * — *você está vendo o que guardamos* — não tem gravidade, e a metade que tem o
 * que arrumar (`not-configured`) já mora em Settings, com o contador da coluna.
 * Um sinal de alerta aqui pintaria de urgência uma página que está funcionando.
 *
 * **Mas ela precisa ser uma PEÇA, e a primeira versão não era** — visto na tela
 * rodando, não no código. Como linha solta em `text-faint` ela ficava no mesmo
 * registro visual da linha de metadados logo abaixo: mesmo cinza, mesmo
 * separador `·`, uma colada na outra. As duas liam como um bloco só, e a
 * ressalva sumia dentro dele — que é precisamente o que ela existe pra evitar.
 * O contorno a torna um objeto SOBRE a página em vez de mais uma legenda DA
 * página, sem subir um decibel de gravidade.
 *
 * **`w-fit`, nunca a largura toda:** faixa de ponta a ponta é banner, e a régua
 * de 31/08 é que condição mora no OBJETO e nunca num banner. Do tamanho do
 * texto, ela pertence à página; atravessando a coluna, ela anuncia.
 *
 * A data é RELATIVA porque é assim que se lê a idade de uma coisa — "3 days
 * ago" responde a pergunta que a pessoa tem; "5 Sep 2026" a obriga a fazer a
 * conta.
 */
function SnapshotLine({
  snapshot,
}: {
  snapshot: { fetchedAt: string; reason: SnapshotReason }
}) {
  return (
    <p className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-muted text-xs ring-1 ring-line">
      <History size={12} strokeWidth={1.7} className="shrink-0" />
      <span className="min-w-0">
        {titleDetailCopy.snapshot.from(formatRelativeTime(snapshot.fetchedAt))}
        {' · '}
        <span className="text-faint">
          {titleDetailCopy.snapshot.why[snapshot.reason]}
        </span>
      </span>
    </p>
  )
}

/**
 * Uma seção da coluna de conteúdo — título à esquerda, um dado à direita.
 */
export function TitleSection({
  title,
  aside,
  children,
}: {
  title: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-medium text-base text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

/**
 * As duas notas, **lado a lado e do mesmo tamanho**.
 *
 * Sozinho, o tile da sua nota ficava órfão ao lado de um contador sem rótulo —
 * o dono chamou de "horrível", e estava certo. O par é que dá sentido aos
 * dois: um é contexto do provedor (se lê), o outro é dado da obra (se edita),
 * e o rótulo em cima diz qual é qual.
 *
 * O tile do provedor **some quando ele não pontua**, em vez de mostrar um traço
 * — provedor sem nota não é uma nota vazia.
 */
export function ScorePair({
  yours,
  provider,
}: {
  yours: ReactNode
  provider: { name: string; score: number; votes: number | null } | null
}) {
  return (
    <div className="flex max-w-md flex-wrap gap-2">
      {yours}
      {provider && (
        <div className="flex min-w-32 flex-1 flex-col gap-0.5 rounded-md px-3 py-2 ring-1 ring-line">
          <span className="text-[0.6875rem] text-faint uppercase tracking-wide">
            {titleDetailCopy.providerScore(provider.name)}
          </span>
          <span className="flex items-baseline gap-1 font-medium text-muted text-xl tabular-nums">
            {provider.score.toFixed(1)}
            <span className="text-faint text-xs">/10</span>
          </span>
          <span className="text-faint text-xs">
            {provider.votes === null
              ? ''
              : titleDetailCopy.votes(
                  new Intl.NumberFormat().format(provider.votes),
                )}
          </span>
        </div>
      )}
    </div>
  )
}

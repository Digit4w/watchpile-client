import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { requestFailure } from '@/domain/request-failure'
import type { SearchRefusal } from '@/domain/search-refusal'
import { appCopy } from '@/lib/copy'
import { searchCopy } from '@/routes/-search.copy'

/**
 * A moldura dos estados desta tela. `ring` e não `border`, como toda caixa que
 * segura conteúdo (design system, seção 4).
 */
function Panel({
  title,
  body,
  quote,
  actions,
  tom = 'neutro',
}: {
  title: string
  body: string
  /**
   * A frase do PROVEDOR, quando há uma — 10/09/2026.
   *
   * **Ela é citada, e não incorporada**, porque não é nossa: vem em inglês, não
   * passa pelo catálogo, e o tom dela é o de quem a escreveu. Sem a atribuição,
   * a pessoa leria uma frase estrangeira no meio da nossa copy e concluiria que
   * o app fala assim.
   */
  quote?: { from: string; text: string } | null
  actions?: React.ReactNode
  tom?: 'neutro' | 'danger'
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-16 text-center ring-1 ${
        tom === 'danger' ? 'ring-danger/40' : 'ring-line'
      }`}
    >
      <p className="font-medium text-base">{title}</p>
      <p className="max-w-md text-muted text-sm">{body}</p>
      {/* Citação e não parágrafo: `<blockquote>` com `cite` diz, na estrutura,
       * o que a atribuição diz na tela. O texto fica em `text-faint`, um degrau
       * abaixo do corpo — é diagnóstico, não a resposta. */}
      {quote && (
        <blockquote className="max-w-md border-line border-l-2 pl-3 text-left">
          <p className="text-faint text-xs leading-relaxed">{quote.text}</p>
          <footer className="mt-1 text-faint text-xs">
            {searchCopy.refusal.saidBy(quote.from)}
          </footer>
        </blockquote>
      )}
      {actions && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

/**
 * Vazio 1 — ainda não se buscou nada.
 *
 * Ele diz **onde** vai procurar, que é a informação que falta quando a busca
 * falha depois. A última linha manda quem procura o que já tem pra `/library`:
 * esta tela não olha a biblioteca, e a copy descreve o que a tela faz.
 */
export function SearchIdle({ type, source }: { type: string; source: string }) {
  return (
    <Panel
      title={searchCopy.idle.title}
      body={searchCopy.idle.body(type, source)}
      actions={
        <Link
          to="/library"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 font-medium text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
        >
          {searchCopy.idle.library}
        </Link>
      }
    />
  )
}

/**
 * Vazio 2 — o catálogo respondeu e não tinha. **Só aqui a lista vazia é
 * honesta**: houve onde procurar. A saída é digitar à mão, que é o que se faz
 * quando o catálogo não tem a obra.
 */
export function SearchNoResults({
  term,
  source,
  type,
  onManual,
}: {
  term: string
  source: string
  type: string
  onManual: () => void
}) {
  return (
    <Panel
      title={searchCopy.noResults.title(term)}
      body={searchCopy.noResults.body(source, type)}
      actions={
        <Button variant="outline" onClick={onManual}>
          {searchCopy.noResults.manual}
        </Button>
      }
    />
  )
}

/**
 * A recusa — e ela tem a **gravidade do fato** (design system, seção 5).
 *
 * Quatro dos seis motivos não são defeito: a busca não quebrou, ela não teve
 * onde acontecer, e pintá-los de `danger` gastaria o sinal que o próximo aviso,
 * o de verdade, vai precisar. Só `provider-refused` e `unreachable` são falha —
 * e o que separa os dois grupos é se **há o que arrumar**, não quem falhou:
 * `provider-down` é falha do provedor e ainda assim fica neutro, porque a
 * resposta de quem lê é a mesma do `rate-limited`, esperar.
 *
 * **A mesma recusa muda de copy por audiência**: quem não é admin não recebe um
 * botão que não pode usar — sinal que a pessoa não consegue apagar é ansiedade
 * sem saída (brief, 3.9).
 *
 * **A troca de fonte NÃO mora aqui, e isso foi visto na tela rodando —
 * 09/09/2026.** Ela chegou a ser um botão por fonte alternativa, ao lado de
 * `Try again`; com anime servido por quatro provedores o painel saiu com CINCO
 * ações na fileira, e `Try again` — a única que não resolve — ficou com o
 * mesmo peso visual das três que resolvem. A saída passou a ser o campo
 * `Source` logo acima do painel, que desde este ciclo sobrevive à recusa: **um
 * parâmetro, um controle**, e o inventário de fontes de um tipo não tem teto,
 * então ele é menu e nunca fileira (design system, seção 5).
 */
export function SearchRefused({
  refusal,
  type,
  source,
  term,
  isAdmin,
  onManual,
  onRetry,
}: {
  refusal: SearchRefusal
  type: string
  /**
   * O NOME da fonte que recusou, para atribuir a frase dela — nulo quando não
   * houve fonte (`no-provider`), e aí não há a quem atribuir nada.
   *
   * O nome e não o slug: *identificador do contrato não vai pra tela* (design
   * system, seção 8, sexta leva).
   */
  source: string | null
  /** O que estava escrito no campo, pra viajar junto pra `/library`. */
  term: string
  isAdmin: boolean
  onManual: () => void
  onRetry: () => void
}) {
  const title =
    refusal.reason === 'no-provider'
      ? searchCopy.refusal['no-provider'](type)
      : searchCopy.refusal[refusal.reason]

  /**
   * **O botão existe onde há o que ARRUMAR** — e é por isso que `provider-down`
   * ficou de fora em 02/09/2026, quando `provider-error` virou dois. Num `5xx`
   * o provedor está falhando do lado dele: mandar o admin pra tela de
   * provedores seria pedir que ele conserte uma configuração que está certa, e
   * a copy do endpoint de teste já dizia isso enquanto esta não.
   */
  const toProviders =
    isAdmin &&
    (refusal.reason === 'no-provider' ||
      refusal.reason === 'not-configured' ||
      refusal.reason === 'provider-refused')

  /** Aqui os dois entram: repetir é a saída tanto do `4xx` quanto do `5xx`. */
  const canRetry =
    refusal.reason === 'rate-limited' ||
    refusal.reason === 'provider-refused' ||
    refusal.reason === 'provider-down' ||
    refusal.reason === 'unreachable'

  return (
    <Panel
      title={title}
      /**
       * O corpo vem do SERVIDOR: ele é quem sabe qual provedor falhou e com que
       * status, e repetir essa lógica aqui daria duas frases pra manter em
       * sincronia — que é como as duas pontas divergem.
       */
      body={refusal.message}
      quote={
        refusal.providerMessage && source
          ? { from: source, text: refusal.providerMessage }
          : null
      }
      tom={refusal.severity === 'failure' ? 'danger' : 'neutro'}
      actions={
        <>
          {toProviders && (
            <Link
              to="/settings/providers"
              className="inline-flex h-9 items-center justify-center rounded-md border border-line px-4 font-medium text-ink text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
            >
              {searchCopy.refusal.openProviders}
            </Link>
          )}
          {canRetry && (
            <Button variant="outline" onClick={onRetry}>
              {searchCopy.refusal.retry}
            </Button>
          )}
          {/* A saída que a tela TEM quando o provedor não responde: a searchQuery da
           * biblioteca é local e funciona offline (brief, 3.1). Sem ela, a
           * recusa é um beco — diz que não deu e esconde que metade do app
           * está de pé.
           *
           * **Só nos motivos em que o provedor PODERIA ter respondido.** Num
           * tipo sem fonte a biblioteca não é o contorno: procurar ali é outra
           * pergunta, e quem chegou aqui queria ADICIONAR. Lá a saída é
           * digitar à mão, e são duas ações em vez de três. */}
          {canRetry && term.trim() !== '' && (
            <Link
              to="/library"
              search={{ q: term }}
              className="inline-flex h-9 items-center justify-center rounded-md px-3 font-medium text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
            >
              {searchCopy.refusal.searchLibrary}
            </Link>
          )}
          {/* Digitar à mão continua funcionando quando não há catálogo, e a
           * copy diz isso: a tela conta o que ainda dá pra fazer. */}
          {!canRetry && (
            <Button variant="ghost" onClick={onManual}>
              {searchCopy.refusal.addManually}
            </Button>
          )}
        </>
      }
    />
  )
}

/**
 * O erro — e ele **não é a recusa**. Aqui o nosso servidor não respondeu; na
 * recusa ele respondeu, e respondeu certo. Confundir os dois daria um "Try
 * again" que repete o mesmo nada (design system, seção 6).
 */
/**
 * A falha de um pedido ao nosso servidor.
 *
 * Recebe o ERRO e não um booleano: qual das duas frases vale é regra decidível,
 * e regra decidível mora em `domain/` — a tela não precisa saber o que é um
 * status zero.
 */
export function SearchError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const copy = appCopy.error[requestFailure(error)]

  return (
    <Panel
      title={copy.title}
      body={copy.body}
      tom="danger"
      actions={
        <Button variant="outline" onClick={onRetry}>
          {appCopy.error.retry}
        </Button>
      }
    />
  )
}

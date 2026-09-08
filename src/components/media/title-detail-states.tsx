import { Button } from '@/components/ui/button'
import { requestFailure } from '@/domain/request-failure'
import { appCopy } from '@/lib/copy'
import { titleDetailCopy } from '@/routes/-title-detail.copy'

type Refusal = keyof typeof titleDetailCopy.unavailable

function Frame({
  children,
  ring = 'ring-line',
}: {
  children: React.ReactNode
  ring?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-20 text-center ring-1 ${ring}`}
    >
      {children}
    </div>
  )
}

/**
 * O esqueleto. Só aparece depois de 200ms e fica no mínimo 300 (design system,
 * seção 11) — o servidor é local, e a maioria das respostas chega antes disso.
 *
 * **O pôster esqueletiza junto**, pelo mesmo motivo de `/piles/:id`: sem isso
 * o retângulo de 200px pularia pro lugar quando a resposta chegasse, e o salto
 * é maior que a espera que ele esconde.
 */
export function TitleDetailSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-5 md:flex-row md:gap-8"
    >
      <div className="aspect-poster w-32 shrink-0 animate-pulse self-start rounded-lg bg-raised md:w-card-poster-h" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="h-6 w-40 animate-pulse rounded-sm bg-raised" />
        <div className="h-8 w-64 animate-pulse rounded-sm bg-raised" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-sm bg-raised" />
        <div className="h-4 w-3/4 max-w-2xl animate-pulse rounded-sm bg-raised" />
        <div className="mt-4 h-11 w-56 animate-pulse rounded-sm bg-raised" />
      </div>
    </div>
  )
}

/**
 * O QUINTO estado, e **ele não é o de erro** (design system, seção 6).
 *
 * No 404 o servidor respondeu, e respondeu certo — repetir dá 404 de novo. Por
 * isso a saída é SAIR, e a copy diz o que provavelmente aconteceu mais o que
 * continua de pé, porque quem chega por um link velho precisa saber que não
 * perdeu o resto.
 */
export function TitleNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="font-medium text-base">{titleDetailCopy.notFound.title}</p>
      <p className="max-w-sm text-muted text-sm">
        {titleDetailCopy.notFound.body}
      </p>
      <Button variant="outline" onClick={onBack} className="mt-1">
        {titleDetailCopy.notFound.action}
      </Button>
    </div>
  )
}

/** O mesmo estado, do lado do provedor: **a ausência é dele, e a copy diz.** */
export function ProviderTitleNotFound({
  providerName,
  onBack,
}: {
  providerName: string
  onBack: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="font-medium text-base">
        {titleDetailCopy.providerNotFound.title(providerName)}
      </p>
      <p className="max-w-sm text-muted text-sm">
        {titleDetailCopy.providerNotFound.body}
      </p>
      <Button variant="outline" onClick={onBack} className="mt-1">
        {titleDetailCopy.providerNotFound.action}
      </Button>
    </div>
  )
}

/**
 * A RECUSA — só existe em tela que depende de terceiro (design system, seção
 * 6, 01/09/2026).
 *
 * Não é erro: o nosso servidor respondeu, e respondeu certo. Não é vazio: não
 * houve onde procurar. **A gravidade acompanha o fato** — falta de chave e
 * cota estourada são condição da instalação e ficam neutras; só a falha de
 * verdade ganha `danger`.
 */
export function TitleUnavailable({
  reason,
  onRetry,
}: {
  reason: Refusal
  onRetry: () => void
}) {
  const copy = titleDetailCopy.unavailable[reason]
  const severe = reason === 'provider-error' || reason === 'unreachable'

  return (
    <Frame ring={severe ? 'ring-danger/40' : 'ring-line'}>
      <p className="font-medium text-base">{copy.title}</p>
      <p className="max-w-sm text-muted text-sm">{copy.body}</p>
      {/* Só quem pode mudar de resposta tentando ganha o botão. Falta de key
       * não muda: quem resolve é um admin, noutra tela. */}
      {severe && (
        <Button variant="outline" onClick={onRetry} className="mt-1">
          {titleDetailCopy.retry}
        </Button>
      )}
    </Frame>
  )
}

/** O nosso servidor não respondeu. Aqui "Try again" é a saída certa. */
/**
 * A falha de um pedido ao nosso servidor.
 *
 * **Ela usava `unavailable.unreachable`, que é a copy do PROVEDOR** — dizia
 * "Couldn't reach the provider" quando quem tinha falhado era o Watchpile.
 * Falha nossa vestida com as palavras de terceiro é a mesma má atribuição que o
 * conserto do 504 do Jikan e o do 403 do AniList tiraram da busca, na direção
 * contrária. A copy de provedor fica pro `TitleUnavailable`, logo abaixo, que é
 * quem de fato fala dele.
 */
export function TitleDetailError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const copy = appCopy.error[requestFailure(error)]

  return (
    <Frame ring="ring-danger/40">
      <p className="font-medium text-base">{copy.title}</p>
      <p className="max-w-sm text-muted text-sm">{copy.body}</p>
      <Button variant="outline" onClick={onRetry} className="mt-1">
        {appCopy.error.retry}
      </Button>
    </Frame>
  )
}

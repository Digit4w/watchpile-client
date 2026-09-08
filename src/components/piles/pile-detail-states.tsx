import { Button } from '@/components/ui/button'
import { requestFailure } from '@/domain/request-failure'
import { appCopy } from '@/lib/copy'
import { pileDetailCopy } from '@/routes/-pile-detail.copy'
import { PileGlyph } from './pile-art'

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
 * Vazio-porque-não-tem: a saída é a **ação primária** (design system, seção 5).
 *
 * A copy diz DE ONDE vem obra, porque numa pilha vazia a pergunta real não é o
 * que aquilo é — é como se enche.
 */
export function PileEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <Frame>
      <p className="font-medium text-base">{pileDetailCopy.empty.title}</p>
      <p className="max-w-sm text-muted text-sm">{pileDetailCopy.empty.body}</p>
      <Button onClick={onAdd} className="mt-1">
        {pileDetailCopy.actions.add}
      </Button>
    </Frame>
  )
}

/**
 * Vazio-porque-filtrou: outro estado, outra saída — **desfazer o recorte**.
 *
 * A copy fala só da pilha. Esta busca não olha a biblioteca, e prometer o
 * contrário faria o usuário concluir que perdeu a obra — o erro mais caro que
 * uma frase consegue causar (design system, seção 7, 30/08/2026).
 */
export function PileNoMatch({ onClear }: { onClear: () => void }) {
  return (
    <Frame>
      <p className="font-medium text-base">{pileDetailCopy.noMatch.title}</p>
      <p className="max-w-sm text-muted text-sm">
        {pileDetailCopy.noMatch.body}
      </p>
      <Button variant="outline" onClick={onClear} className="mt-1">
        {pileDetailCopy.noMatch.clear}
      </Button>
    </Frame>
  )
}

/**
 * A falha de um pedido ao nosso servidor.
 *
 * Recebe o ERRO e não um booleano: qual das duas frases vale é regra decidível,
 * e regra decidível mora em `domain/` — a tela não precisa saber o que é um
 * status zero.
 */
export function PileDetailError({
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

/**
 * **O quinto estado, e ele é só de tela de detalhe** (design system, seção 6,
 * 31/08/2026).
 *
 * Não é o estado de erro, e a diferença decide a saída: no erro o servidor não
 * respondeu, e "Try again" faz sentido. No 404 ele respondeu, e respondeu certo
 * — repetir dá 404 de novo. A saída é voltar pra listagem de onde o objeto
 * veio.
 *
 * A copy diz o que provavelmente houve **e** o que continua de pé: quem chega
 * por um link velho precisa saber que não perdeu o resto.
 */
export function PileNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <span className="text-line">
        <PileGlyph size={34} />
      </span>
      <p className="mt-2 font-medium text-base">
        {pileDetailCopy.notFound.title}
      </p>
      <p className="max-w-sm text-muted text-sm">
        {pileDetailCopy.notFound.body}
      </p>
      <Button variant="outline" onClick={onBack} className="mt-1">
        {pileDetailCopy.back}
      </Button>
    </div>
  )
}

/**
 * O esqueleto, que só aparece depois de 200ms e fica no mínimo 300 (design
 * system, seção 11).
 *
 * **O cabeçalho esqueletiza junto.** Sem isso o quadrado de 200px pularia pro
 * lugar quando a resposta chegasse, e o salto é maior que a espera que ele
 * esconde.
 */
export function PileDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex flex-col gap-4 pb-6 md:flex-row md:gap-6">
        <div className="size-32 shrink-0 animate-pulse rounded-lg bg-raised md:size-card-poster-h" />
        <div className="flex flex-1 flex-col gap-3 pt-1">
          <div className="h-8 w-64 max-w-full animate-pulse rounded-md bg-raised" />
          <div className="h-4 w-40 animate-pulse rounded-sm bg-raised opacity-70" />
          <div className="h-3 w-full max-w-2xl animate-pulse rounded-sm bg-raised opacity-40" />
          <div className="h-3 w-3/4 max-w-2xl animate-pulse rounded-sm bg-raised opacity-40" />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="h-card-poster-h w-full max-w-card-poster-max animate-pulse rounded-md bg-raised"
            style={{ opacity: 1 - index * 0.12 }}
          />
        ))}
      </div>
    </div>
  )
}

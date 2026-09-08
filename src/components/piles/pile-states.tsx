import { Button } from '@/components/ui/button'
import { requestFailure } from '@/domain/request-failure'
import { appCopy } from '@/lib/copy'
import { pilesCopy } from '@/routes/-piles.copy'
import { CreatePilePopover } from './create-pile-popover'
import { PileGlyph } from './pile-art'

/**
 * `ring-1` e não `border`: contorno de container que segura conteúdo sai de
 * dentro da altura com `box-sizing: border-box` (design system, seção 4).
 */
const BOX =
  'flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-20 text-center ring-1'

/**
 * Nenhuma pilha ainda.
 *
 * A frase faz o trabalho que a tela vazia tem que fazer aqui, e que é diferente
 * do de `/library`: ela diz que **obra não precisa de pilha pra existir**.
 * Quem chega numa tela vazia chamada "Piles" sem essa frase conclui o oposto —
 * que precisa criar uma antes de guardar qualquer coisa.
 *
 * O botão repete o do cabeçalho, e a repetição é o ponto: numa tela vazia a
 * ação primária tem que estar onde o olho está, que é o meio, não o canto.
 */
export function PilesEmpty() {
  return (
    <div className={`${BOX} ring-line`}>
      <div
        className="flex size-12 items-center justify-center rounded-lg bg-card text-faint"
        aria-hidden="true"
      >
        <PileGlyph size={24} />
      </div>
      <p className="font-medium text-base">{pilesCopy.empty.title}</p>
      <p className="max-w-sm text-muted text-sm">{pilesCopy.empty.body}</p>
      <CreatePilePopover>
        <Button className="mt-1">{pilesCopy.create.open}</Button>
      </CreatePilePopover>
    </div>
  )
}

/**
 * Vazio de BUSCA é outra tela que "nenhuma pilha": aqui há o que mostrar, só
 * não com este termo. A saída oferecida é limpar a busca — não criar pilha,
 * que resolveria o problema errado.
 *
 * A segunda frase aponta pra `/library` de propósito: quem procura um TÍTULO
 * aqui está na tela errada, e dizer isso custa menos que deixar a pessoa
 * concluir que a obra sumiu.
 */
export function PilesNoMatch({ onClear }: { onClear: () => void }) {
  return (
    <div className={`${BOX} py-16 ring-line`}>
      <p className="font-medium text-base">{pilesCopy.noMatch.title}</p>
      <p className="max-w-sm text-muted text-sm">{pilesCopy.noMatch.body}</p>
      <Button variant="outline" className="mt-1" onClick={onClear}>
        {pilesCopy.noMatch.clear}
      </Button>
    </div>
  )
}

/**
 * A falha de um pedido ao nosso servidor.
 *
 * Recebe o ERRO e não um booleano: qual das duas frases vale é regra decidível,
 * e regra decidível mora em `domain/` — a tela não precisa saber o que é um
 * status zero.
 */
export function PilesError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const copy = appCopy.error[requestFailure(error)]

  return (
    <div className={`${BOX} ring-danger/40`}>
      <p className="font-medium text-base">{copy.title}</p>
      <p className="max-w-sm text-muted text-sm">{copy.body}</p>
      <Button variant="outline" className="mt-1" onClick={onRetry}>
        {appCopy.error.retry}
      </Button>
    </div>
  )
}

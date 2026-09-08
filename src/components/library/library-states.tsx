import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { Button } from '@/components/ui/button'
import { requestFailure } from '@/domain/request-failure'
import { appCopy } from '@/lib/copy'
import { libraryCopy } from '@/routes/-library.copy'

/**
 * `ring-1` e não `border`: contorno de container que segura conteúdo sai de
 * dentro da altura com `box-sizing: border-box` (design system, seção 4).
 */
const BOX =
  'flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-20 text-center ring-1'

/**
 * Biblioteca vazia — a primeira coisa que uma instalação nova vê depois do
 * wizard. A frase enumera os seis tipos de propósito: é o que diz que este não
 * é um app de filmes que também aceita mangá.
 *
 * O botão repete o do cabeçalho, e a repetição é o ponto: numa tela vazia a
 * ação primária tem que estar onde o olho está, que é o meio, não o canto.
 */
export function LibraryEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className={`${BOX} ring-line`}>
      <div
        className="flex size-12 items-center justify-center rounded-lg bg-card text-faint"
        aria-hidden="true"
      >
        <MediaTypeIcon type="book" size={22} strokeWidth={1.5} />
      </div>
      <p className="font-medium text-base">{libraryCopy.empty.title}</p>
      <p className="max-w-sm text-muted text-sm">{libraryCopy.empty.body}</p>
      <Button className="mt-1" onClick={onAdd}>
        {libraryCopy.add.open}
      </Button>
    </div>
  )
}

/**
 * Vazio de FILTRO é outra tela que biblioteca vazia: aqui há o que mostrar, só
 * não com este recorte. A saída oferecida é afrouxar o recorte — não adicionar
 * obra, que resolveria o problema errado.
 */
export function LibraryNoMatch({ onClear }: { onClear: () => void }) {
  return (
    <div className={`${BOX} py-16 ring-line`}>
      <p className="font-medium text-base">{libraryCopy.noMatch.title}</p>
      <p className="max-w-sm text-muted text-sm">{libraryCopy.noMatch.body}</p>
      <Button variant="outline" className="mt-1" onClick={onClear}>
        {libraryCopy.noMatch.clear}
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
export function LibraryError({
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

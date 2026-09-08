import { ChevronRight, Shapes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MediaTypeInfo } from '@/domain/media-type'
import { requestFailure } from '@/domain/request-failure'
import { appCopy } from '@/lib/copy'
import { countOf } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'
import { iconFor } from '../media/icon-set'

/**
 * A linha de um tipo — 56px, uma linha só.
 *
 * **Não há `⋯` aqui** (design system, seção 5, 31/08/2026): a linha inteira é o
 * alvo, com um chevron como affordance, e ela abre a folha. Por isso esta tela
 * **não herda a decisão em aberto #8** — os 44px só brigam com densidade, e uma
 * lista de configuração tem seis a vinte linhas, não duzentas.
 *
 * `<button>` dentro do `<li>`, e não `onClick` no `<li>`: o alvo precisa receber
 * foco e responder ao Enter, e um item de lista não faz nem uma coisa nem outra.
 *
 * A CONTAGEM está na linha de propósito, e não só na folha: é ela que faz a
 * recusa de apagar não surpreender quem abre o tipo. O número já está na tela
 * antes do clique.
 *
 * O glifo sai de `iconFor`, que cai num genérico quando não conhece o nome — um
 * banco semeado por uma versão mais nova pode ter ícone que este build não tem,
 * e renderizar nada foi exatamente o defeito silencioso que abrir o enum criou.
 */
function MediaTypeRow({
  type,
  onOpen,
}: {
  type: MediaTypeInfo
  onOpen: (type: MediaTypeInfo) => void
}) {
  const Icon = iconFor(type.icon)

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(type)}
        className="flex h-14 w-full items-center gap-3 rounded-md px-3 text-left transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
      >
        <Icon
          className="shrink-0 text-muted"
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-ink text-sm">
          {type.name}
        </span>
        {/* A unit some no estreito antes da count: das duas, é a
         * contagem que sustenta a recusa de apagar, então ela é a última a
         * sair. */}
        <span className="hidden shrink-0 text-faint text-sm sm:inline">
          {type.progressUnit ?? settingsCopy.mediaTypes.noUnit}
        </span>
        <span className="shrink-0 text-faint text-sm tabular-nums">
          {type.entryCount === 0
            ? settingsCopy.mediaTypes.noTitles
            : countOf(type.entryCount, settingsCopy.mediaTypes.titleCount)}
        </span>
        <ChevronRight
          className="shrink-0 text-faint"
          size={16}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </button>
    </li>
  )
}

export function MediaTypeList({
  types,
  onOpen,
}: {
  types: MediaTypeInfo[]
  onOpen: (type: MediaTypeInfo) => void
}) {
  return (
    // `-mx-3` devolve o padding da linha à margem do painel: sem ele o nome do
    // tipo nasceria 12px à direita do título da seção, e a coluna deixaria de
    // ser coluna (design system, seção 8, quarta leva).
    <ul className="-mx-3 flex flex-col">
      {types.map((type) => (
        <MediaTypeRow key={type.slug} type={type} onOpen={onOpen} />
      ))}
    </ul>
  )
}

export function MediaTypeListSkeleton() {
  return (
    <ul className="-mx-3 flex flex-col">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <li key={row} className="flex h-14 items-center gap-3 px-3">
          <span className="size-[18px] shrink-0 animate-pulse rounded-sm bg-raised" />
          <span className="h-4 w-36 animate-pulse rounded-sm bg-raised" />
          <span className="ml-auto h-4 w-16 animate-pulse rounded-sm bg-raised" />
        </li>
      ))}
    </ul>
  )
}

/**
 * `ring-1` e não `border`: contorno de container que segura conteúdo sai de
 * dentro da altura com `box-sizing: border-box` (design system, seção 4). É o
 * mesmo vocabulário de caixa que `/library` fixou.
 */
const BOX =
  'flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-20 text-center ring-1'

/**
 * Só acontece se o admin apagar todos. Um servidor sem tipo não registra nada,
 * e a copy diz isso em vez de só constatar o vazio.
 */
export function MediaTypesEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className={`${BOX} ring-line`}>
      <span
        className="flex size-12 items-center justify-center rounded-lg bg-card text-faint"
        aria-hidden="true"
      >
        <Shapes size={22} strokeWidth={1.5} />
      </span>
      <p className="font-medium text-base">
        {settingsCopy.mediaTypes.empty.title}
      </p>
      <p className="max-w-sm text-muted text-sm">
        {settingsCopy.mediaTypes.empty.body}
      </p>
      {/* Repete o botão do cabeçalho DE PROPÓSITO, como `/library` decidiu:
       * numa tela vazia a ação primária tem que estar onde o olho está, que é
       * o meio, não o canto. */}
      {onAdd && (
        <Button className="mt-1" onClick={onAdd}>
          {settingsCopy.mediaTypes.add}
        </Button>
      )}
    </div>
  )
}

/**
 * A falha de um pedido ao nosso servidor.
 *
 * Recebe o ERRO e não um booleano: qual das duas frases vale é regra decidível,
 * e regra decidível mora em `domain/`.
 */
export function MediaTypesError({
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

/**
 * Não-admin que chegou pela URL.
 *
 * **`ring-line` e não `ring-danger`: nada falhou.** O servidor respondeu certo,
 * e a resposta é que isto não é seu — a mesma distinção que separou
 * não-encontrado de erro (design system, seção 6). Por isso a saída é a volta,
 * e não "Try again": repetir daria a mesma coisa.
 */
export function MediaTypesForbidden({ onBack }: { onBack: () => void }) {
  return (
    <div className={`${BOX} ring-line`}>
      <p className="font-medium text-base">
        {settingsCopy.mediaTypes.forbidden.title}
      </p>
      <p className="max-w-sm text-muted text-sm">
        {settingsCopy.mediaTypes.forbidden.body}
      </p>
      <Button variant="outline" className="mt-1" onClick={onBack}>
        {settingsCopy.mediaTypes.forbidden.back}
      </Button>
    </div>
  )
}

import { type FormEvent, useState } from 'react'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { initialTotal } from '@/domain/initial-total'
import type { Entry, MediaType } from '@/domain/media'
import { useUpdateEntry } from '@/hooks/mutations/entries/use-update-entry'
import { useEntryLinks } from '@/hooks/queries/entries/use-entry-links'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { appCopy } from '@/lib/copy'
import { libraryCopy } from '@/routes/-library.copy'

const PICKED =
  'flex h-9 items-center gap-1.5 rounded-sm border border-ink bg-ink px-2.5 text-surface text-xs'
const AVAILABLE =
  'flex h-9 items-center gap-1.5 rounded-sm border border-line px-2.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
const FIELD = 'h-9 rounded-md text-sm'

const copy = libraryCopy.edit

/**
 * A folha de EDITAR obra — 09/09/2026, decisão do dono.
 *
 * ── Por que ela existe ─────────────────────────────────────────────────────
 * Três colunas que a folha de criar escreve não tinham como ser corrigidas
 * depois: `total`, `title` e `mediaType`. O `⋯` oferecia ver, empilhar, tirar
 * da pilha e apagar; `/library/:id` edita status, nota, notas e pilhas. Não
 * havia folha de editar em lugar nenhum do app, e **o servidor já aceitava os
 * três desde sempre** — `UpdateBodySchema` é o corpo de criação `.partial()`,
 * e nenhuma tela chamava assim.
 *
 * O único jeito de arrumar um total era apagar e re-adicionar, o que leva
 * progresso, log, nota e pilhas junto — e *contorno com formato de perda de
 * dado não é contorno* é a frase que o próprio brief usou pra promover
 * "vincular obra existente" a escopo (3.10).
 *
 * ── Folha própria, e não a de criar com um modo ────────────────────────────
 * *Duas formas de uso são dois SCHEMAS, não um com campos opcionais* (régua de
 * 07/09). Criar escreve seis coisas — tipo, título, status, total, pilhas e a
 * procedência do provedor; editar escreve três, e as outras já têm endereço:
 * status é o `StatusButton` que aparece em toda carta e em toda linha, pilhas
 * são o `PilePicker` da coluna e o `EntryPiles` do `⋯`, e procedência é a caixa
 * de `Sources`. **Campo que já tem lugar não ganha um segundo** — é o defeito
 * de "três menus para um objeto" que o `entry-menu` acabou de tirar do app,
 * aqui na forma de dois controles de escrita.
 *
 * ── O peso é o do OBJETO ────────────────────────────────────────────────────
 * Folha, como a de criar: obra é objeto de folha, pilha é objeto de popover
 * (design system, seção 5). Nasceu assim e continua.
 */
export function EditEntrySheet({
  entry,
  open,
  onOpenChange,
}: {
  entry: Entry
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateEntry(entry.id)
  /**
   * Só enquanto a folha está aberta: a resposta só decide UM controle, e pedi-la
   * junto com toda carta da grade seria uma ida à rede por obra na tela.
   */
  const links = useEntryLinks(entry.id, open)

  const [mediaType, setMediaType] = useState<MediaType>(entry.mediaType)
  const [title, setTitle] = useState(entry.title)
  const [total, setTotal] = useState(
    entry.total != null ? String(entry.total) : '',
  )

  /**
   * O tipo atual entra na oferta mesmo escondido: a preferência recorta o que
   * é OFERECIDO e nunca o que existe (04/09), e um formulário que apagasse o
   * tipo da própria obra estaria trocando-a sem dizer.
   */
  const offered = useOfferedMediaTypes(mediaType)
  const chosenType = offered.find((info) => info.slug === mediaType)
  const countsProgress = chosenType?.countsProgress ?? true

  /**
   * ── O tipo só se troca em obra SEM vínculo, e a recusa se anuncia antes do
   * clique ────────────────────────────────────────────────────────────────
   * O id de um provedor é único **dentro** do tipo, não entre tipos: no
   * MyAnimeList `21` é o anime *One Piece* e o mangá *Death Note* (régua de
   * 07/09, a que fez `external_ids` ganhar `media_type`). Trocar o tipo da
   * obra sem trocar o do vínculo deixaria os dois discordando, e trocar o do
   * vínculo junto seria pior: produziria uma identidade externa **falsa**,
   * porque aquele id não é o daquela obra no tipo novo.
   *
   * A régua já estava escrita e é da folha ao lado: **quando a obra veio da
   * busca, o tipo é PROCEDÊNCIA e não escolha** — ele definiu qual catálogo
   * respondeu e qual mapa de campos leu o resultado. A folha de criar já o
   * tratava assim; esta herda sem inventar nada, e o que ela acrescenta é que
   * a procedência pode ter chegado depois, por `Link`.
   *
   * Enquanto os vínculos não chegaram, o controle fica indisponível: mostrá-lo
   * vivo e desabilitá-lo um quadro depois é peça que muda sozinha, que se lê
   * como defeito (04/09).
   */
  const linked = links.data === undefined || links.data.length > 0
  const linkName = links.data?.[0]?.provider.name ?? null

  const trimmedTitle = title.trim()
  const typed = Number.parseInt(total, 10)
  /**
   * A MESMA regra com que a obra nasce (`domain/initial-total.ts`): tipo que
   * não conta vale 1, e campo vazio vale nulo, que é o `12 / ?` da 3.11.
   * Reescrevê-la aqui seriam duas contas da mesma coisa, e é assim que uma
   * fica pra trás.
   */
  const nextTotal = initialTotal({
    countsProgress,
    typed: Number.isFinite(typed) ? typed : null,
  })

  /**
   * O total só entra na conta quando o campo EXISTE. Sem isso, abrir a folha
   * de um jogo antigo — criado antes de `game` deixar de contar, então com
   * `total` nulo — já nasceria com `Save` habilitado sem ninguém ter tocado em
   * nada. Trocar o tipo continua bastando por si, e aí o `1` vai junto.
   */
  const changed =
    trimmedTitle !== entry.title ||
    mediaType !== entry.mediaType ||
    (countsProgress && nextTotal !== entry.total)
  const canSubmit = trimmedTitle !== '' && changed && !update.isPending

  function reset() {
    setMediaType(entry.mediaType)
    setTitle(entry.title)
    setTotal(entry.total != null ? String(entry.total) : '')
    update.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    update.mutate(
      /**
       * Manda os três, e não só os que mudaram: o `PATCH` é `.partial()`, então
       * o que não vai não é tocado — e enumerar os alterados aqui daria uma
       * segunda conta da mesma pergunta que `changed` já responde.
       */
      { mediaType, title: trimmedTitle, total: nextTotal },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
        }
        onOpenChange(next)
      }}
    >
      <SheetContent side="right" className="gap-4" aria-describedby={undefined}>
        <SheetHeader className="pb-0">
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.body}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
        >
          <div className="scrollbar-styled flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4">
            {linked ? (
              <div className="flex flex-col gap-2">
                <span className="text-muted text-xs">
                  {libraryCopy.add.mediaType}
                </span>
                <span className={`${PICKED} w-fit`}>
                  <MediaTypeIcon
                    type={entry.mediaType}
                    size={13}
                    strokeWidth={1.7}
                  />
                  {chosenType?.name ?? entry.mediaType}
                </span>
                {/* A recusa se anuncia ANTES do clique, com o motivo — o app não
                 * tem toast pra explicá-la depois (design system, seção 5). E
                 * ela nomeia o provedor, porque é ele que a causou. */}
                {linkName && (
                  <p className="text-faint text-xs">
                    {copy.typeLocked(linkName)}
                  </p>
                )}
              </div>
            ) : (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-muted text-xs">
                  {libraryCopy.add.mediaType}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {offered.map((info) => (
                    <button
                      key={info.slug}
                      type="button"
                      onClick={() => setMediaType(info.slug)}
                      aria-pressed={mediaType === info.slug}
                      className={mediaType === info.slug ? PICKED : AVAILABLE}
                    >
                      <MediaTypeIcon
                        type={info.slug}
                        size={13}
                        strokeWidth={1.7}
                      />
                      {info.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-muted text-xs" htmlFor="edit-entry-title">
                {libraryCopy.add.titleField}
              </label>
              <Input
                id="edit-entry-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={FIELD}
                autoFocus
              />
            </div>

            {countsProgress && (
              <div className="flex flex-col gap-2">
                <label
                  className="text-muted text-xs"
                  htmlFor="edit-entry-total"
                >
                  {chosenType?.progressUnit
                    ? appCopy.totals.withUnit(chosenType.progressUnit)
                    : appCopy.totals.generic}
                </label>
                <Input
                  id="edit-entry-total"
                  value={total}
                  onChange={(event) =>
                    setTotal(event.target.value.replace(/\D/g, ''))
                  }
                  inputMode="numeric"
                  className={`${FIELD} tabular-nums`}
                />
                <p className="text-faint text-xs">
                  {libraryCopy.add.totalHint}
                </p>
              </div>
            )}

            {update.isError && (
              <p className="text-danger text-xs">{copy.failed}</p>
            )}
          </div>

          <div
            className="mt-auto flex flex-col gap-2 border-line border-t p-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <Button type="submit" disabled={!canSubmit}>
              {copy.submit}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {libraryCopy.add.cancel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

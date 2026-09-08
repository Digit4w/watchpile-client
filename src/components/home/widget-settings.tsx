import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Input, NativeSelect } from '@/components/ui/input'
import type { HomeWidget, WidgetType } from '@/domain/home-widget'
import { SELECTABLE_WIDGET_TYPES } from '@/domain/home-widget'
import type { EntryStatus, MediaType } from '@/domain/media'
import { ENTRY_STATUSES } from '@/domain/media'
import { useUpdateWidget } from '@/hooks/mutations/home-widgets/use-update-widget'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { usePiles } from '@/hooks/queries/piles/use-piles'
import { appCopy } from '@/lib/copy'
import { homeCopy } from '@/routes/-home.copy'

const chip =
  'rounded-sm border px-2 py-1 text-xs transition-colors duration-[var(--motion-micro)] ease-chrome disabled:opacity-[var(--opacity-disabled)]'
const chipOn = `${chip} border-ink bg-ink text-surface`
const chipOff = `${chip} border-line text-muted hover:bg-raised`

/** Remove a chave em vez de gravar array vazio: o filtro é `.strict()`, e
 * `[]` significaria "nenhum tipo casa", não "sem filtro". */
function toggled<T extends string>(current: T[] | undefined, value: T) {
  const next = current?.includes(value)
    ? current.filter((item) => item !== value)
    : [...(current ?? []), value]
  return next.length > 0 ? next : undefined
}

/** Cada bloco entra escalonado (`home-motion.css`) — o `--wp-index` é a vez de
 * cada um na fila, contada aqui em vez de por `nth-child` porque o índice de
 * DOM mudaria se um bloco virasse condicional. */
function block(index: number) {
  return { style: { '--wp-index': index } as CSSProperties }
}

export function WidgetSettings({ widget }: { widget: HomeWidget }) {
  // Os tipos que o filtro JÁ usa entram mesmo escondidos: o widget é do
  // usuário e um filtro que ele não vê é um filtro que ele não desfaz.
  const mediaTypes = useOfferedMediaTypes(widget.filter.mediaType ?? null)
  const typeName = useMediaTypeName()

  const piles = usePiles()
  const update = useUpdateWidget(widget.id)

  const busy = update.isPending

  /**
   * O nome é o único campo com estado local: os demais gravam no clique, mas
   * texto precisa ser digitado antes de valer. Grava ao sair do campo ou no
   * Enter, e nunca a cada tecla — seria uma requisição por letra.
   *
   * O `useEffect` resincroniza quando o widget muda por fora (outra aba, outro
   * cliente); sem ele o campo ficaria preso no que foi digitado da última vez.
   */
  const [name, setNome] = useState(widget.title ?? '')
  useEffect(() => setNome(widget.title ?? ''), [widget.title])

  function saveName() {
    const cleared = name.trim()
    const current = widget.title ?? ''
    if (cleared === current) {
      return
    }
    // Vazio vira `null`, que é o "use o rótulo derivado" do domínio — o
    // servidor normaliza também, mas mandar `''` daqui seria pedir pra ele
    // consertar o que o cliente já sabe.
    update.mutate({ title: cleared === '' ? null : cleared })
  }

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Linha horizontal, não campo empilhado: é o mesmo formato de "Widget
       * type" e "Show at most", e empilhar rótulo e campo custava ~26px de
       * altura num painel que já estava no limite antes de rolar. */}
      <label
        htmlFor={`widget-name-${widget.id}`}
        className="wp-settings-block flex items-center justify-between gap-2"
        {...block(0)}
      >
        <span className="shrink-0 text-muted">{homeCopy.widget.name}</span>
        <Input
          compact
          id={`widget-name-${widget.id}`}
          value={name}
          disabled={busy}
          maxLength={60}
          placeholder={homeCopy.widget.namePlaceholder}
          onChange={(event) => setNome(event.target.value)}
          onBlur={saveName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          className="max-w-40"
        />
      </label>

      <label
        htmlFor={`widget-type-${widget.id}`}
        className="wp-settings-block flex items-center justify-between gap-2"
        {...block(1)}
      >
        <span className="text-muted">{homeCopy.widget.type}</span>
        <NativeSelect
          id={`widget-type-${widget.id}`}
          value={widget.type}
          disabled={busy}
          onChange={(event) =>
            update.mutate({ type: event.target.value as WidgetType })
          }
        >
          {SELECTABLE_WIDGET_TYPES.map((type) => (
            <option key={type} value={type}>
              {homeCopy.types[type]}
            </option>
          ))}
        </NativeSelect>
      </label>

      <fieldset className="wp-settings-block flex flex-col gap-2" {...block(2)}>
        <legend className="text-muted">{homeCopy.widget.source}</legend>
        <div className="flex flex-wrap gap-1">
          {piles.data?.map((pile) => (
            <button
              key={pile.id}
              type="button"
              disabled={busy}
              aria-pressed={widget.pileIds.includes(pile.id)}
              className={widget.pileIds.includes(pile.id) ? chipOn : chipOff}
              onClick={() =>
                update.mutate({
                  pileIds: widget.pileIds.includes(pile.id)
                    ? widget.pileIds.filter((id) => id !== pile.id)
                    : [...widget.pileIds, pile.id],
                })
              }
            >
              {pile.name}
            </button>
          ))}
        </div>
        {widget.pileIds.length === 0 && (
          <p className="text-faint">{homeCopy.widget.wholeLibraryHint}</p>
        )}
      </fieldset>

      <fieldset className="wp-settings-block flex flex-col gap-2" {...block(3)}>
        <legend className="text-muted">{homeCopy.widget.mediaType}</legend>
        <div className="flex flex-wrap gap-1">
          {mediaTypes.map(({ slug: mediaType }) => (
            <button
              key={mediaType}
              type="button"
              disabled={busy}
              aria-pressed={widget.filter.mediaType?.includes(mediaType)}
              className={
                widget.filter.mediaType?.includes(mediaType) ? chipOn : chipOff
              }
              onClick={() =>
                update.mutate({
                  filter: {
                    ...widget.filter,
                    mediaType: toggled<MediaType>(
                      widget.filter.mediaType,
                      mediaType,
                    ),
                  },
                })
              }
            >
              {typeName(mediaType)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="wp-settings-block flex flex-col gap-2" {...block(4)}>
        <legend className="text-muted">{homeCopy.widget.status}</legend>
        <div className="flex flex-wrap gap-1">
          {ENTRY_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              aria-pressed={widget.filter.status?.includes(status)}
              className={
                widget.filter.status?.includes(status) ? chipOn : chipOff
              }
              onClick={() =>
                update.mutate({
                  filter: {
                    ...widget.filter,
                    status: toggled<EntryStatus>(widget.filter.status, status),
                  },
                })
              }
            >
              {appCopy.statuses[status]}
            </button>
          ))}
        </div>
      </fieldset>

      <label
        className="wp-settings-block flex items-center justify-between gap-2"
        htmlFor={`widget-count-${widget.id}`}
        {...block(5)}
      >
        <span className="text-muted">{homeCopy.widget.itemCount}</span>
        <NativeSelect
          id={`widget-count-${widget.id}`}
          value={widget.itemCount ?? ''}
          disabled={busy}
          onChange={(event) =>
            update.mutate({
              itemCount: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <option value="">{homeCopy.widget.noLimit}</option>
          {[3, 5, 10, 20].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </NativeSelect>
      </label>
    </div>
  )
}

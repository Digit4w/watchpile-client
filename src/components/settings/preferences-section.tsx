import { SlidersHorizontal } from 'lucide-react'
import {
  MediaTypeToggleRow,
  MediaTypeToggleSkeleton,
} from '@/components/media/media-type-toggle-row'
import { useSetMediaTypeVisibility } from '@/hooks/mutations/preferences/use-set-media-type-visibility'
import { useMediaTypes } from '@/hooks/queries/media-types/use-media-types'
import { useMediaTypeVisibility } from '@/hooks/queries/preferences/use-media-type-visibility'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { settingsCopy } from '@/routes/-settings.copy'
import { MediaTypesError } from './media-type-list'
import { SectionHeader } from './section-header'

const copy = settingsCopy.preferences

/**
 * `YOU / Preferences` — o que este app oferece a MIM.
 *
 * **É o outro objeto de "tipo de mídia"** (brief, 3.9 e 3.12): definir o tipo é
 * vocabulário da instância e mora em `THIS INSTANCE / Media types`, escrito só
 * pelo admin; escolher quais eu vejo é preferência, e mora aqui. A linha é a
 * mesma dos dois lados de propósito — o que muda é o que ela termina fazendo.
 *
 * **A escolha recorta o que é OFERECIDO, nunca o que existe** (04/09/2026,
 * decisão do dono): ela some dos chips de `/library`, do filtro de widget, do
 * escopo da busca e do seletor da folha de criar obra, e a obra que já existe
 * de um tipo escondido continua na biblioteca. A copy diz isso na tela, porque
 * é a primeira pergunta de quem desliga o primeiro toggle.
 *
 * **Sem `Save`.** Toggle anuncia efeito imediato — é o que `role="switch"`
 * significa —, e a escrita é otimista pelo mesmo motivo. Uma folha com botão
 * seria o vocabulário de formulário emprestado a uma preferência que não tem
 * campo nenhum.
 */
export function PreferencesSection() {
  const types = useMediaTypes()
  const visibility = useMediaTypeVisibility()
  const save = useSetMediaTypeVisibility()

  const isLoading = useDelayedPending(types.isPending || visibility.isPending)
  const isError = types.isError || visibility.isError

  const list = types.data ?? []
  const hidden = new Set(visibility.data?.hidden ?? [])
  /**
   * Contado sobre os tipos QUE EXISTEM, e não sobre o tamanho de `hidden`: um
   * slug escondido de um tipo que o admin apagou some do banco por cascade, mas
   * pode estar num cache velho aqui — e ele não deixa de contar como visível
   * uma linha que a tela não desenha.
   */
  const onCount = list.filter(({ slug }) => !hidden.has(slug)).length

  function toggle(slug: string, next: boolean) {
    const updated = new Set(hidden)
    if (next) {
      updated.delete(slug)
    } else {
      updated.add(slug)
    }
    save.mutate([...updated])
  }

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.preferences}
        body={copy.body}
        Icon={SlidersHorizontal}
      />

      {isError && (
        <MediaTypesError
          // Duas consultas seguram a seção; a que falhou é a que explica.
          error={types.error ?? visibility.error}
          onRetry={() => {
            types.refetch()
            visibility.refetch()
          }}
        />
      )}

      {!isError && (
        <section>
          <h2 className="font-medium text-ink text-sm">
            {copy.mediaTypes.title}
          </h2>
          <p className="mt-1 max-w-prose text-muted text-sm">
            {copy.mediaTypes.body}
          </p>
          <p className="mt-1 max-w-prose text-faint text-xs">
            {copy.mediaTypes.keeps}
          </p>

          {isLoading && <MediaTypeToggleSkeleton />}

          {!isLoading && (
            <ul className="-mx-3 mt-2 flex flex-col">
              {list.map((type) => {
                const on = !hidden.has(type.slug)
                /**
                 * O último visível não desliga, e a recusa aparece ANTES do
                 * clique (design system, seção 5) — sem nenhum tipo, a folha de
                 * criar obra fica sem o que oferecer e a busca sem escopo. O
                 * servidor recusa igual; isto é a tela dizendo o mesmo antes.
                 */
                const last = on && onCount === 1
                return (
                  <MediaTypeToggleRow
                    key={type.slug}
                    type={type}
                    on={on}
                    onToggle={(next) => toggle(type.slug, next)}
                    noUnitLabel={copy.mediaTypes.noUnit}
                    toggleLabel={copy.mediaTypes.toggle}
                    disabled={last}
                    reason={copy.mediaTypes.last}
                  />
                )
              })}
            </ul>
          )}

          {/* Só quando resta um: aviso permanente vira ruído, e a frase existe
           * pra explicar um toggle que não responde. */}
          {!isLoading && onCount === 1 && (
            <p className="mt-2 text-faint text-xs">{copy.mediaTypes.last}</p>
          )}

          {/* A escrita é otimista, então o que falhou já voltou atrás na tela —
           * a frase é o que impede a volta de parecer um clique que não pegou.
           * O app não tem toast, e ela mora embaixo da lista que a pessoa
           * acabou de tocar. */}
          {save.isError && (
            <p className="mt-2 text-danger text-xs">{copy.mediaTypes.failed}</p>
          )}
        </section>
      )}
    </>
  )
}

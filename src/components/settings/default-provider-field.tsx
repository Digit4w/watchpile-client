import type { MediaTypeInfo } from '@/domain/media-type'
import { useSetDefaultProvider } from '@/hooks/mutations/media-types/use-set-default-provider'
import { useProviders } from '@/hooks/queries/providers/use-providers'
import { settingsCopy } from '@/routes/-settings.copy'

const copy = settingsCopy.defaultProvider

/**
 * Qual provedor responde a busca deste tipo (brief, 3.10).
 *
 * ── A escolha faz UMA coisa, e fazia duas até 02/09/2026 ────────────────────
 * A outra era decidir de qual vínculo saem arte e sinopse quando a obra tem
 * mais de um. Ela saiu daqui por decisão do dono: virou `entries.primary_provider`
 * (`entries.source.ts`), do lado do usuário — o tipo é vocabulário da
 * instância, a obra é conteúdo. Sobrou a busca, que é o que esta copy sempre
 * prometeu.
 *
 * ── Por que ele mora no TIPO e não no provedor ───────────────────────────────
 * A relação é muitos-para-muitos, então com um provedor por tipo a escolha seria
 * simétrica — mas escolher pelo lado do provedor significaria que marcar um tipo
 * o **rouba** do provedor anterior: efeito colateral num objeto que não está na
 * tela. Pelo lado do tipo é uma escolha simples e sem vítima.
 *
 * ── Três casos, e o primeiro é o que evita pedir confirmação de nada ─────────
 * · **um provedor** → leitura. O efetivo se resolve sozinho no servidor
 *   (`effectiveProviderOf`), e um radio de uma opção pede que a pessoa confirme
 *   o óbvio
 * · **dois ou mais** → radio de verdade, com "nenhum" como opção legítima —
 *   ela significa que a busca cai no desempate por nome, que é o mesmo do
 *   servidor (`chooseSearchProvider`)
 * · **nenhum** → não há bloco de escolha; há a frase que diz o que a ausência
 *   significa. Ela **não é alerta**: quatro dos seis tipos estão assim, e o
 *   brief chama isso de legítimo. Onde a ausência morde é a busca
 *
 * ── Salva na hora, e não com o `Save` da folha ───────────────────────────────
 * É um rádio, não um campo de texto: não há rascunho a segurar, e o efeito é
 * imediato como o da capa de pilha (que sobe ao confirmar o enquadramento, sem
 * esperar o `Save`). Segurar até o `Save` faria a folha carregar um estado que
 * ela teria que desfazer no `Cancel`.
 */
export function DefaultProviderField({ type }: { type: MediaTypeInfo }) {
  const providers = useProviders()
  const choose = useSetDefaultProvider(type.slug)

  const nameBySlug = new Map(
    (providers.data ?? []).map((p) => [p.slug, p.name]),
  )
  const name = (slug: string) => nameBySlug.get(slug) ?? slug

  if (type.providers.length === 0) {
    return (
      <div className="flex flex-col gap-2 border-line border-t pt-5">
        <span className="text-muted text-xs">{copy.providersLabel}</span>
        <p className="text-faint text-xs leading-relaxed">{copy.noProvider}</p>
      </div>
    )
  }

  if (type.providers.length === 1) {
    const only = type.providers[0] ?? ''
    return (
      <div className="flex flex-col gap-2 border-line border-t pt-5">
        <span className="text-muted text-xs">{copy.label}</span>
        <div className="flex items-start gap-2.5 py-1.5">
          {/* Marcado e inerte: não é um rádio desabilitado, é um fato. */}
          <span
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-line bg-line/40"
            aria-hidden="true"
          >
            <span className="size-1.5 rounded-full bg-muted" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-ink text-sm">{name(only)}</span>
            <span className="text-faint text-xs">{copy.onlyOne}</span>
          </span>
        </div>
        <p className="text-faint text-xs">{copy.onlyOneHint}</p>
      </div>
    )
  }

  const options: { value: string | null; label: string; sub?: string }[] = [
    ...type.providers.map((slug) => ({
      value: slug,
      label: name(slug),
      sub: type.effectiveProvider === slug ? copy.chosen : undefined,
    })),
    { value: null, label: copy.none, sub: copy.noneBody },
  ]

  return (
    <fieldset
      className="flex flex-col gap-2 border-line border-t pt-5"
      disabled={choose.isPending}
    >
      <legend className="text-muted text-xs">{copy.label}</legend>
      <div className="flex flex-col">
        {options.map(({ value, label, sub }) => {
          const selected = type.effectiveProvider === value
          return (
            <label
              key={value ?? '__none__'}
              className="flex cursor-pointer items-start gap-2.5 py-1.5"
            >
              <input
                type="radio"
                name={`default-provider-${type.slug}`}
                className="sr-only"
                checked={selected}
                onChange={() => choose.mutate(value)}
              />
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? 'border-ink bg-ink' : 'border-line'
                }`}
                aria-hidden="true"
              >
                {selected && (
                  <span className="size-1.5 rounded-full bg-surface" />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-ink text-sm">{label}</span>
                {sub && <span className="text-faint text-xs">{sub}</span>}
              </span>
            </label>
          )
        })}
      </div>
      <p className="text-faint text-xs">{copy.hint}</p>
    </fieldset>
  )
}

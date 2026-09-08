import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { BrandMark, PanelShell } from '@/components/chrome/panel-shell'
import {
  MediaTypeToggleRow,
  MediaTypeToggleSkeleton,
} from '@/components/media/media-type-toggle-row'
import { Button } from '@/components/ui/button'
import { useConfigureInstance } from '@/hooks/mutations/setup/use-configure-instance'
import { useMediaTypes } from '@/hooks/queries/media-types/use-media-types'
import { appCopy } from '@/lib/copy'
import { setupCopy } from './-setup.copy'

export const Route = createFileRoute('/setup')({
  component: SetupRoute,
})

/**
 * O wizard de primeiro uso, nível de INSTÂNCIA (brief, 3.9;
 * `design/mockups/setup.html`, 03/09/2026).
 *
 * **Um passo só, e o motivo é o par idioma↔tipos.** Trocar o chip de idioma
 * repinta os nomes dos tipos três linhas abaixo — a escolha prova o que faz sem
 * custar uma segunda tela nem um indicador de passo, que seria componente novo
 * com um uso só.
 *
 * **Quem repinta é o SERVIDOR.** `useMediaTypes(language)` manda o idioma e
 * recebe o nome pronto; o cliente não reimplementa a cadeia da queda (brief,
 * 3.12), que ele nem tem como conhecer — o degrau do meio é o idioma da
 * instância, que é exatamente o que esta tela está decidindo.
 */

function SetupRoute() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')
  /**
   * `null` é "ainda não mexi", e não um conjunto vazio — os dois são diferentes
   * e colapsá-los num `Set` vazio faria a tela nascer com tudo DESLIGADO e o
   * botão recusando, quando o estado inicial é o contrário: **os seis nascem
   * ligados e o wizard tira** (brief, 3.9). É a régua da oitava leva: cada
   * intenção tem o seu estado.
   */
  const [off, setOff] = useState<Set<string>>(new Set())

  /**
   * **A prévia passa pelo idioma do LEITOR, e o campo escreve o da INSTÂNCIA.**
   * São degraus diferentes da mesma cadeia (brief, 3.12): 1 é quem lê, 2 é a
   * instância. Hoje eles coincidem na tela porque o degrau 1 não existe — não
   * há preferência de idioma por usuário enquanto a biblioteca de i18n estiver
   * em aberto —, então pedir `locale=pt-BR` mostra exatamente o que alguém sem
   * preferência vai ver depois de salvar.
   *
   * No dia em que o degrau 1 existir, isto deixa de ser verdade e a prévia
   * passa a mentir: quem tem preferência própria não cai no idioma da
   * instância. Está escrito aqui porque é o tipo de acordo que apodrece calado.
   */
  const types = useMediaTypes(language)
  const configure = useConfigureInstance()

  const keep = (types.data ?? [])
    .filter((type) => !off.has(type.slug))
    .map((type) => type.slug)

  function toggle(slug: string, on: boolean) {
    setOff((current) => {
      const next = new Set(current)
      if (on) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    configure.mutate(
      { language, keep },
      { onSuccess: () => navigate({ to: '/' }) },
    )
  }

  if (types.isError) {
    return (
      <PanelShell size="lg">
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-14 text-center ring-1 ring-line">
          <p className="text-sm">{setupCopy.error.title}</p>
          <p className="max-w-xs text-faint text-xs">{setupCopy.error.body}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={() => types.refetch()}
          >
            {setupCopy.error.retry}
          </Button>
        </div>
      </PanelShell>
    )
  }

  return (
    <PanelShell size="lg">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <BrandMark />
        <h1 className="font-semibold text-xl tracking-tight">
          {setupCopy.title}
        </h1>
        <p className="max-w-xs text-muted text-sm">{setupCopy.body}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <section>
          <h2 className="font-medium text-sm">{setupCopy.language.label}</h2>
          <p className="mt-1 text-faint text-xs">{setupCopy.language.hint}</p>
          {/* O código do idioma, não a bandeira — bandeira não é idioma. O nome
           * inteiro vai no `title`, que é o que cabe numa fileira de chips. */}
          <div className="mt-3 flex w-fit flex-wrap gap-0.5 rounded-md border border-line p-0.5">
            {Object.entries(appCopy.languages).map(([code, name]) => {
              const on = code === language
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  aria-pressed={on}
                  title={name}
                  className={
                    on
                      ? 'flex h-7 items-center rounded-sm bg-ink px-2.5 font-medium text-surface text-xs'
                      : 'flex h-7 items-center rounded-sm px-2.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
                  }
                >
                  {code}
                </button>
              )
            })}
          </div>
        </section>

        {/* Divisória, nunca caixa: o painel já é um container, e agrupar com uma
         * segunda caixa dentro dele é o card-dentro-de-card que a seção 8
         * recusa. */}
        <div className="my-6 border-line border-t" />

        <section>
          <h2 className="font-medium text-sm">{setupCopy.types.label}</h2>
          <p className="mt-1 text-faint text-xs">{setupCopy.types.hint}</p>

          {types.isPending ? (
            <MediaTypeToggleSkeleton />
          ) : (
            <ul className="-mx-3 mt-2 flex flex-col">
              {(types.data ?? []).map((type) => (
                <MediaTypeToggleRow
                  key={type.slug}
                  type={type}
                  on={!off.has(type.slug)}
                  onToggle={(next) => toggle(type.slug, next)}
                  noUnitLabel={setupCopy.types.noUnit}
                  toggleLabel={setupCopy.types.toggle}
                />
              ))}
            </ul>
          )}
        </section>

        {configure.isError && (
          <p className="mt-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-sm">
            {setupCopy.error.saveFailed}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full"
            disabled={keep.length === 0 || configure.isPending}
          >
            {configure.isPending ? setupCopy.submitting : setupCopy.submit}
          </Button>
          {/* A recusa se anuncia antes do clique, e neutra: é campo que falta,
           * não defeito (design system, seção 5). */}
          {keep.length === 0 && (
            <p className="text-center text-faint text-xs">
              {setupCopy.needsOne}
            </p>
          )}
        </div>
      </form>
    </PanelShell>
  )
}

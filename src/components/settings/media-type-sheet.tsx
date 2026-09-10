import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import type { IconName, MediaTypeInfo } from '@/domain/media-type'
import {
  isMissing,
  localesOf,
  type NameDraftMap,
  toNameMap,
  verdictFor,
} from '@/domain/media-type-form'
import { useCreateMediaType } from '@/hooks/mutations/media-types/use-create-media-type'
import { useDeleteMediaType } from '@/hooks/mutations/media-types/use-delete-media-type'
import { useUpdateMediaType } from '@/hooks/mutations/media-types/use-update-media-type'
import { countOf } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'
import { DefaultProviderField } from './default-provider-field'
import { IconPicker } from './icon-picker'
import { TypeProvidersField } from './type-providers-field'

const copy = settingsCopy.mediaTypes

/**
 * O que a folha está editando. `null` é fechada; um `MediaTypeInfo` é editar; o
 * rascunho é criar — já preenchido por um template, ou em branco.
 */
export type SheetTarget =
  | { mode: 'edit'; type: MediaTypeInfo }
  | {
      mode: 'create'
      icon: IconName | null
      countsProgress: boolean
      names: NameDraftMap
    }

function draftFrom(target: SheetTarget): {
  icon: IconName | null
  countsProgress: boolean
  names: NameDraftMap
} {
  if (target.mode === 'create') {
    return {
      icon: target.icon,
      countsProgress: target.countsProgress,
      names: target.names,
    }
  }

  const names: NameDraftMap = {}
  for (const [locale, value] of Object.entries(target.type.names)) {
    names[locale] = {
      name: value.name,
      plural: value.plural,
      progressUnit: value.progressUnit ?? '',
    }
  }

  // O ícone da RESPOSTA é `string`, não o enum: um banco semeado por uma versão
  // mais nova pode ter glifo que este build não conhece. A conversão é honesta
  // porque o seletor só escreve nomes do acervo — o que chega de fora sobrevive
  // até alguém trocá-lo.
  return {
    icon: target.type.icon as IconName,
    countsProgress: target.type.countsProgress,
    names,
  }
}

/**
 * O alternador de idioma — **um alternador governando um bloco**, não um campo
 * por idioma empilhado (design system, seção 5, 31/08/2026).
 *
 * Com dois idiomas seriam seis inputs antes de chegar no ícone, e o bloco
 * cresceria a cada idioma novo no catálogo.
 *
 * O ponto de `--color-warning` marca o idioma que FALTA — **incompleto se
 * marca, não se proíbe**: quem lê num idioma sem tradução cai na cadeia de três
 * degraus do brief 3.12, nunca num buraco.
 */
function LanguageSwitch({
  locales,
  active,
  names,
  onSelect,
}: {
  locales: string[]
  active: string
  names: NameDraftMap
  onSelect: (locale: string) => void
}) {
  return (
    <div className="flex w-fit gap-0.5 rounded-md border border-line p-0.5">
      {locales.map((locale) => {
        const on = locale === active
        const missing = isMissing(names[locale])
        return (
          <button
            key={locale}
            type="button"
            onClick={() => onSelect(locale)}
            aria-pressed={on}
            className={
              on
                ? 'flex h-7 items-center gap-1.5 rounded-sm bg-ink px-2.5 font-medium text-surface text-xs'
                : 'flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
            }
          >
            {/* O código, não a bandeira: bandeira não é idioma
             * (client/CLAUDE.md). O nome inteiro vai no `title`, porque "pt-BR"
             * numa fileira de chips é o que cabe. */}
            <span title={copy.sheet.languages[locale] ?? locale}>{locale}</span>
            {missing && (
              <span
                className="size-1.5 rounded-full bg-warning"
                aria-hidden="true"
              />
            )}
            {missing && (
              <span className="sr-only">, {copy.sheet.missingTranslation}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  placeholder?: string
  onChange: (next: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-muted text-xs" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 text-sm"
      />
      <p className="text-faint text-xs">{hint}</p>
    </div>
  )
}

/**
 * A folha de tipo de mídia.
 *
 * **Tipo ganha folha, não popover** — quatro campos contra o campo único da
 * pilha ("o peso do formulário acompanha o objeto", design system, seção 5).
 *
 * A divisão interna é semântica e não visual: **o que é texto do objeto fica
 * sob o alternador de idioma, o que não é fica fora**. Nome, plural e unidade
 * de progresso são texto e vão por idioma; ícone e "pergunta total" não mudam
 * com o idioma e ficam abaixo da divisória. **Divisória e não caixa** — a folha
 * já é um container, e agrupar com caixa dentro dela é o "card dentro de card"
 * que `research/yamtrack/settings-shell.md` recusou.
 *
 * `modal` explícito: o `Sheet` do projeto é não-modal por padrão, porque a
 * folha de widget existe pra se arrastar de dentro dela pra fora. Um formulário
 * quer o contrário — foco preso, `Esc` fecha, clique fora fecha.
 */
export function MediaTypeSheet({
  target,
  formKey,
  onOpenChange,
}: {
  target: SheetTarget | null
  /**
   * A identidade do que está sendo preenchido — `edit:<slug>`, ou `create:<n>`
   * com um contador que anda a cada abertura.
   *
   * Ela é prop e não uma conta feita aqui porque as duas metades vêm de lugares
   * diferentes: o slug identifica o tipo, mas dois formulários de criação em
   * branco são indistinguíveis por conteúdo — e é justamente entre eles que os
   * campos precisam recarregar. Quem sabe que houve uma abertura nova é quem
   * abre.
   */
  formKey: string
  onOpenChange: (open: boolean) => void
}) {
  const [icon, setIcon] = useState<IconName | null>(null)
  const [countsProgress, setCountsProgress] = useState(true)
  const [names, setNames] = useState<NameDraftMap>({})
  const [language, setLanguage] = useState<string>('en')

  const slug = target?.mode === 'edit' ? target.type.slug : ''
  const update = useUpdateMediaType(slug)
  const create = useCreateMediaType()
  const remove = useDeleteMediaType()

  /**
   * Os campos recarregam quando a folha passa a preencher OUTRA coisa.
   *
   * **A dependência é `formKey`, e nunca o objeto `target`.** Duas razões, e as
   * duas já cobraram em folhas anteriores deste app:
   *
   * - o alvo de EDIÇÃO é remontado a cada render pelo componente de cima, que o
   *   relê do cache pra manter a contagem de obras fresca. Com o objeto na
   *   dependência, cada render reescreveria o campo por cima do que estivesse
   *   sendo digitado (`edit-pile-sheet.tsx` evita o mesmo defeito)
   * - dois formulários de criação em branco são idênticos por conteúdo, então
   *   `mode` e `slug` não bastariam: escolher outro template depois de já ter
   *   escolhido um deixaria o formulário com os dados do primeiro
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: ver acima
  useEffect(() => {
    if (!target) {
      return
    }
    const initial = draftFrom(target)
    setIcon(initial.icon)
    setCountsProgress(initial.countsProgress)
    setNames(initial.names)
    setLanguage('en')
    update.reset()
    create.reset()
    remove.reset()
  }, [formKey])

  const locales = localesOf(names)
  const draft = names[language] ?? { name: '', plural: '', progressUnit: '' }
  const verdict = verdictFor(names)
  const saving = update.isPending || create.isPending

  function setField(campo: keyof typeof draft, value: string) {
    setNames((current) => ({
      ...current,
      [language]: { ...draft, ...current[language], [campo]: value },
    }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!target || !verdict.savable || icon === null || saving) {
      return
    }

    const body = { icon, countsProgress, names: toNameMap(names) }

    if (target.mode === 'edit') {
      update.mutate(body, { onSuccess: () => onOpenChange(false) })
      return
    }
    create.mutate(body, { onSuccess: () => onOpenChange(false) })
  }

  const inUse = target?.mode === 'edit' ? target.type.entryCount : 0

  return (
    <Sheet modal open={target !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-4" aria-describedby={undefined}>
        <SheetHeader className="pb-0">
          <SheetTitle>
            {target?.mode === 'create'
              ? copy.sheet.createTitle
              : copy.sheet.editTitle}
          </SheetTitle>
          <SheetDescription>{copy.sheet.body}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
        >
          <div className="scrollbar-styled flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4">
            <LanguageSwitch
              locales={locales}
              active={language}
              names={names}
              onSelect={setLanguage}
            />

            {/* `key` no idioma: sem ele o React reusa o mesmo `<input>` entre
             * idiomas, e o cursor fica onde estava enquanto o valor troca por
             * baixo. Trocar de idioma é trocar de campo, não editar o mesmo. */}
            <Field
              key={`name-${language}`}
              id="media-type-name"
              label={copy.sheet.name}
              hint={copy.sheet.nameHint}
              value={draft.name}
              onChange={(value) => setField('name', value)}
            />
            <Field
              key={`plural-${language}`}
              id="media-type-plural"
              label={copy.sheet.plural}
              hint={copy.sheet.pluralHint}
              value={draft.plural}
              onChange={(value) => setField('plural', value)}
            />
            <Field
              key={`unit-${language}`}
              id="media-type-unit"
              label={copy.sheet.unit}
              hint={copy.sheet.unitHint}
              placeholder={copy.sheet.unitPlaceholder}
              value={draft.progressUnit}
              onChange={(value) => setField('progressUnit', value)}
            />

            {/* Abaixo da divisória: o que NÃO é text e não muda com o idioma. */}
            <div className="flex flex-col gap-5 border-line border-t pt-5">
              <div className="flex flex-col gap-2">
                <span className="text-muted text-xs">{copy.sheet.icon}</span>
                <IconPicker value={icon} onChange={setIcon} />
              </div>

              {/* **Um toggle, e o corpo dele TROCA com o estado.**
               *
               * Ele teve um irmão (`Ask for a total`) por algumas horas, e cada
               * um explicava metade. Sozinho, ele precisa dizer o que muda E
               * quando desligar — e a frase que responde "quando" só faz
               * sentido no estado desligado, então ela é a frase DELE, não uma
               * nota permanente embaixo. */}
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-1">
                  <span
                    id="media-type-counts-progress"
                    className="text-ink text-sm"
                  >
                    {copy.sheet.countsProgress}
                  </span>
                  <span className="max-w-[15rem] text-faint text-xs leading-relaxed">
                    {countsProgress
                      ? copy.sheet.countsProgressBody
                      : copy.sheet.countsProgressOffBody}
                  </span>
                </span>
                <Switch
                  checked={countsProgress}
                  onCheckedChange={setCountsProgress}
                  aria-labelledby="media-type-counts-progress"
                />
              </div>
            </div>

            {/* Quais provedores servem este tipo, e só depois qual deles
             * RESPONDE a busca — escolher a fonte antes de haver fonte é
             * escolher entre nada.
             *
             * **Só ao EDITAR**, e o motivo mudou em 10/09/2026: era "a
             * associação não é escolha desta folha, ela vem da definição do
             * provedor", e agora ela É escolha desta folha (brief, 3.10). O que
             * segura é outra coisa — um tipo que ainda não existe não tem slug
             * a que vincular, e o slug só nasce ao salvar. */}
            {target?.mode === 'edit' && (
              <>
                <TypeProvidersField type={target.type} />
                <DefaultProviderField type={target.type} />
              </>
            )}

            {/* Apagar só existe ao editar: não há o que apagar num type que
             * ainda não foi criado. */}
            {target?.mode === 'edit' && (
              <div className="flex flex-col gap-2 border-line border-t pt-5">
                {/* **A refusal nasce desabilitada com o reason escrito**, e a
                 * contagem já estava na linha antes do clique (design system,
                 * seção 5). Aceitar o clique e falhar exigiria um toast, que o
                 * app não tem. */}
                <Button
                  type="button"
                  variant="outline"
                  className={
                    inUse === 0
                      ? 'w-fit border-danger/50 text-danger hover:bg-danger/10'
                      : 'w-fit'
                  }
                  disabled={inUse > 0 || remove.isPending}
                  onClick={() =>
                    remove.mutate(target.type.slug, {
                      onSuccess: () => onOpenChange(false),
                    })
                  }
                >
                  {copy.delete.label}
                </Button>
                <p className="text-faint text-xs">
                  {inUse > 0
                    ? copy.delete.inUse(countOf(inUse, copy.titleCount))
                    : copy.delete.free}
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="border-line border-t">
            {/* A refusal se anuncia ANTES do clique: o botão apagado sozinho não
             * diz o que falta. */}
            {!verdict.savable && (
              <p className="text-faint text-xs">
                {verdict.reason === 'no-language'
                  ? copy.sheet.needsOneLanguage
                  : copy.sheet.halfFilled(
                      copy.sheet.languages[verdict.locale] ?? verdict.locale,
                    )}
              </p>
            )}
            <Button
              type="submit"
              disabled={!verdict.savable || icon === null || saving}
              className="w-full"
            >
              {target?.mode === 'create' ? copy.sheet.create : copy.sheet.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {copy.sheet.cancel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

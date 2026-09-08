import { Check, LoaderCircle, Lock, X } from 'lucide-react'
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
import { conditionOf } from '@/domain/provider-status'
import { useTestProvider } from '@/hooks/mutations/providers/use-test-provider'
import { useUpdateProvider } from '@/hooks/mutations/providers/use-update-provider'
import { useMediaTypeMap } from '@/hooks/queries/media-types/use-media-type-map'
import { settingsCopy } from '@/routes/-settings.copy'
import type { CredentialState, Provider } from '@/services/providers'

const copy = settingsCopy.providers.sheet

/**
 * O nome da variável de ambiente de uma credencial.
 *
 * Derivado do par (slug, chave), como o servidor faz — e escrito à mão aqui
 * porque o valor não viaja no contrato: o `GET` diz que a credencial veio de
 * `env`, não de QUAL variável. Duplicar a regra é o menor dos males contra
 * inventar um campo na API só pra montar uma frase.
 */
function envVarFor(providerSlug: string, credentialKey: string): string {
  const part = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
  return `WATCHPILE_PROVIDER_${part(providerSlug)}_${part(credentialKey)}`
}

/**
 * O campo de uma credencial.
 *
 * **Ele nasce VAZIO mesmo com chave salva**, porque o `GET` nunca devolve o
 * segredo (brief, 3.10). O que volta é o *hint* — os últimos quatro caracteres —
 * como placeholder, o bastante pra reconhecer qual chave está lá.
 *
 * **Daí sai a regra que esta tela precisa desarmar: campo vazio não pode
 * significar "apague".** Não tocar no campo manda nada; apagar é o botão ao
 * lado. É a mesma distinção entre ausência e vazio que o `PATCH` do servidor
 * faz, e sem ela salvar o idioma dos metadados apagaria a chave junto.
 */
function CredentialField({
  providerSlug,
  credential,
  value,
  toDelete,
  onChange,
  onRemove,
  onUndoRemove,
}: {
  providerSlug: string
  credential: CredentialState
  value: string
  /** Marcada pra apagar, esperando o salvamento. */
  toDelete: boolean
  onChange: (next: string) => void
  onRemove: () => void
  onUndoRemove: () => void
}) {
  const id = `provider-${providerSlug}-${credential.key}`

  if (credential.overridden) {
    /**
     * Env ou arquivo venceram. **O campo se anuncia travado com o nome da
     * variável escrito** — se ele vence e a UI deixa digitar, a pessoa edita,
     * salva e nada acontece. Config em duas fontes sem indicação é a armadilha
     * clássica.
     */
    return (
      <div className="flex flex-col gap-2">
        <label className="text-muted text-xs" htmlFor={id}>
          {credential.label}
        </label>
        <div className="relative">
          <Input
            id={id}
            value=""
            placeholder={credential.hint ?? ''}
            disabled
            readOnly
            className="h-9 cursor-not-allowed pr-9 text-sm"
          />
          <Lock
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-faint"
            size={14}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </div>
        <p className="text-faint text-xs">
          {copy.lockedBy(envVarFor(providerSlug, credential.key))}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-muted text-xs" htmlFor={id}>
        {credential.label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={toDelete ? '' : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={toDelete ? '' : (credential.hint ?? copy.placeholder)}
          /**
           * Marcada pra apagar, o campo esvazia e trava: o `hint` no
           * placeholder diria que a chave continua lá, e digitar por cima de
           * uma remoção pendente é uma intenção ambígua. Desfazer primeiro.
           */
          disabled={toDelete}
          className="h-9 text-sm"
          autoComplete="off"
          spellCheck={false}
        />
        {/* Só existe quando há o que apagar — e apagar é o ÚNICO caminho pra
         * limpar, porque o campo vazio significa "não mexi". */}
        {credential.configured &&
          (toDelete ? (
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={onUndoRemove}
            >
              {copy.undoRemove}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-danger/50 text-danger hover:bg-danger/10"
              onClick={onRemove}
            >
              {copy.remove}
            </Button>
          ))}
      </div>
      {/* A remoção é PENDENTE, e dizer isso é o que separa "não fez nada" de
       * "vai fazer ao salvar". O aviso troca a linha de ajuda: as duas falam
       * do mesmo campo, e empilhá-las faria o texto competir consigo mesmo. */}
      {toDelete ? (
        <p className="text-danger text-xs">{copy.willRemove}</p>
      ) : (
        credential.help && (
          <p className="text-faint text-xs">{credential.help}</p>
        )
      )}
    </div>
  )
}

/**
 * A folha de configuração de um provedor.
 *
 * **Os campos são GERADOS da declaração** — `credentials[]` e `options[]` vêm do
 * servidor, e é isso que impede "provedor com opção nova" de virar migration
 * (brief, 3.10). Nada aqui sabe que o TMDB tem uma chave e duas opções.
 *
 * A ordem é: o que o provedor É (cobertura, a condição) → o que falta dele
 * (credencial) → como se comporta (opções) → provar (testar) → o que ele exige
 * de nós (atribuição). Da identidade pro ajuste, como a folha de tipo de mídia.
 */
export function ProviderSheet({
  provider,
  onOpenChange,
}: {
  provider: Provider | null
  onOpenChange: (open: boolean) => void
}) {
  /**
   * Só o que foi DIGITADO. Chave ausente aqui significa "não mexi", e é o que
   * faz o campo vazio não apagar a credencial.
   */
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  /** `''` explícito é o que APAGA — diferente de ausente. */
  const [deleted, setDeleted] = useState<string[]>([])
  const [options, setOptions] = useState<Record<string, string | boolean>>({})
  // Os NOMES dos tipos, não os slugs — a descrição da folha é texto de tela.
  const { map: types } = useMediaTypeMap()

  const slug = provider?.slug ?? ''
  const update = useUpdateProvider(slug)
  const test = useTestProvider(slug)

  /**
   * A identidade é o SLUG, não o objeto — que o componente de cima remonta a
   * cada render ao relê-lo do cache. Com o objeto na dependência, cada render
   * reescreveria o campo por cima do que estivesse sendo digitado, que é o
   * mesmo defeito que `edit-pile-sheet.tsx` e a folha de tipo já evitam.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: ver acima
  useEffect(() => {
    setCredentials({})
    setDeleted([])
    setOptions({})
    update.reset()
    test.reset()
  }, [slug])

  if (!provider) {
    return (
      <Sheet modal open={false} onOpenChange={onOpenChange}>
        <SheetContent side="right" aria-describedby={undefined}>
          <SheetTitle className="sr-only">{copy.save}</SheetTitle>
        </SheetContent>
      </Sheet>
    )
  }

  const condition = conditionOf(provider)
  const optionValue = (key: string) =>
    options[key] ?? provider.optionValues[key]

  /**
   * O que o formulário tem a dizer sobre credencial — o mesmo mapa pro
   * salvamento e pro teste.
   *
   * **Campo vazio significa "não mexi", nunca "apague"** (o `GET` nunca
   * devolveu o segredo, então o campo nasce vazio com a chave lá). Apagar é o
   * botão, e ele manda string vazia, que é o que o servidor lê como ausente —
   * a mesma semântica nos dois endpoints.
   */
  function formCredentials(): Record<string, string> {
    const typed = Object.fromEntries(
      Object.entries(credentials).filter(([, v]) => v.trim() !== ''),
    )
    for (const key of deleted) {
      typed[key] = ''
    }
    return typed
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!provider || update.isPending) {
      return
    }

    const typed = formCredentials()

    update.mutate(
      {
        ...(Object.keys(typed).length > 0 && { credentials: typed }),
        ...(Object.keys(options).length > 0 && { options: options }),
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const coverage =
    provider.mediaTypes.length > 0
      ? copy.body(
          provider.mediaTypes.map((t) => types.get(t)?.plural ?? t).join(', '),
        )
      : copy.noTypes

  return (
    <Sheet modal open onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-4" aria-describedby={undefined}>
        <SheetHeader className="pb-0">
          <SheetTitle>{provider.name}</SheetTitle>
          <SheetDescription>{coverage}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
        >
          <div className="scrollbar-styled flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4">
            {/* **Ponto de warning, nunca banner** (design system, seção 5):
             * rodar na chave embutida não é defeito, e caixa colorida mentiria
             * sobre o tamanho do fato — o custo seria o próximo aviso, o de
             * verdade, não ser lido. Fica no topo porque é condição do que está
             * abaixo dele. */}
            {condition === 'embedded-key' && (
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning"
                  aria-hidden="true"
                />
                <p className="text-faint text-xs leading-relaxed">
                  {settingsCopy.providers.embedded.sheet}
                </p>
              </div>
            )}

            {provider.credentials.length === 0 ? (
              /* Não vira caixa vazia nem some sem explicação: diz que não há o
               * que configurar. É o caso do AniList e do Open Library. */
              <p className="text-faint text-xs">{copy.noCredentials}</p>
            ) : (
              provider.credentials.map((credential) => (
                <CredentialField
                  key={credential.key}
                  providerSlug={provider.slug}
                  credential={credential}
                  value={credentials[credential.key] ?? ''}
                  onChange={(next) =>
                    setCredentials((current) => ({
                      ...current,
                      [credential.key]: next,
                    }))
                  }
                  toDelete={deleted.includes(credential.key)}
                  onRemove={() =>
                    setDeleted((current) =>
                      current.includes(credential.key)
                        ? current
                        : [...current, credential.key],
                    )
                  }
                  onUndoRemove={() =>
                    setDeleted((current) =>
                      current.filter((key) => key !== credential.key),
                    )
                  }
                />
              ))
            )}

            {provider.options.length > 0 && (
              <div className="flex flex-col gap-5 border-line border-t pt-5">
                {provider.options.map((option) =>
                  option.type === 'boolean' ? (
                    <div
                      key={option.key}
                      className="flex items-start justify-between gap-3"
                    >
                      <span className="flex min-w-0 flex-col gap-1">
                        <span
                          id={`option-${option.key}`}
                          className="text-ink text-sm"
                        >
                          {option.label}
                        </span>
                      </span>
                      <Switch
                        checked={Boolean(optionValue(option.key))}
                        onCheckedChange={(next) =>
                          setOptions((current) => ({
                            ...current,
                            [option.key]: next,
                          }))
                        }
                        aria-labelledby={`option-${option.key}`}
                      />
                    </div>
                  ) : (
                    <div key={option.key} className="flex flex-col gap-2">
                      <label
                        className="text-muted text-xs"
                        htmlFor={`option-${option.key}`}
                      >
                        {option.label}
                      </label>
                      <Input
                        id={`option-${option.key}`}
                        value={String(optionValue(option.key) ?? '')}
                        onChange={(event) =>
                          setOptions((current) => ({
                            ...current,
                            [option.key]: event.target.value,
                          }))
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  ),
                )}
              </div>
            )}

            {/* **Validar no salvamento, não na primeira searchQuery** (brief, 3.10):
             * chave errada que só aparece dentro de uma busca se lê como "o
             * provedor está quebrado", e manda procurar o defeito no lugar
             * errado. */}
            <div className="flex flex-col gap-2 border-line border-t pt-5">
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={test.isPending}
                onClick={() => test.mutate(formCredentials())}
              >
                {test.isPending ? copy.testing : copy.test}
              </Button>

              {test.isPending && (
                <span className="flex items-center gap-1.5 text-faint text-xs">
                  <LoaderCircle
                    className="shrink-0 animate-spin"
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {copy.testing}
                </span>
              )}

              {/* O servidor responde 200 mesmo quando o provedor refusal, então
               * `isError` aqui é falha de rede NOSSA — e a frase é outra. */}
              {test.isError && (
                <span className="flex items-center gap-1.5 text-danger text-xs">
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                  {copy.testFailed}
                </span>
              )}

              {test.data && (
                <span
                  className={`flex items-center gap-1.5 text-xs ${
                    test.data.ok ? 'text-success' : 'text-danger'
                  }`}
                >
                  {test.data.ok ? (
                    <Check
                      className="shrink-0"
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    <X
                      className="shrink-0"
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                  {test.data.message}
                </span>
              )}
            </div>

            {/**
             * **O que o PROVEDOR escreveu, cru e sem tradução** (08/09/2026,
             * decisão do dono). A linha acima é copy nossa e diz a categoria; o
             * 403 do AniList vinha com *"The AniList API has been temporarily
             * disabled"*, que explica o número de um jeito que nenhuma
             * categoria nossa explicaria.
             *
             * **Peça com contorno**, e é a régua de 07/09: quando uma peça
             * precisa ser lida como outra CLASSE de coisa, ela ganha contorno —
             * não mais cor, e não menos opacidade. Aqui isso faz o trabalho que
             * uma moldura verbal faria: o texto é de outra pessoa, e a caixa
             * diz isso sem precisar de uma frase por cima de cada palavra.
             *
             * **Sem `text-danger`**, mesmo saindo de uma recusa: a cor é da
             * gravidade, e quem já disse a gravidade é a linha acima. Pintar as
             * duas de vermelho dobraria o sinal.
             */}
            {test.data?.detail && (
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-faint text-xs">{copy.testDetail}</span>
                <p className="rounded-md px-2.5 py-2 text-muted text-xs leading-relaxed ring-1 ring-line">
                  {test.data.detail}
                </p>
              </div>
            )}

            {/* **Condição de uso, não cortesia** (brief, 3.10). Ela vem da
             * DEFINIÇÃO: a tela lê o campo em vez de saber de cor quais
             * provedores exigem atribuição. */}
            {provider.attribution && (
              <div className="flex flex-col gap-1 border-line border-t pt-5">
                <span className="text-muted text-xs">{copy.attribution}</span>
                <p className="text-faint text-xs leading-relaxed">
                  {provider.attribution}
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="border-line border-t">
            <Button
              type="submit"
              disabled={update.isPending}
              className="w-full"
            >
              {copy.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

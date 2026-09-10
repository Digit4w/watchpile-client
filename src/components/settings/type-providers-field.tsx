import { useState } from 'react'
import {
  ActionMenuBack,
  ActionMenuSeparator,
} from '@/components/menu/action-menu'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { MediaTypeInfo } from '@/domain/media-type'
import { linkableProviders, pairInUseCount } from '@/domain/provider-recipes'
import {
  useLinkProvider,
  useUnlinkProvider,
} from '@/hooks/mutations/media-types/use-link-provider'
import { useMediaTypes } from '@/hooks/queries/media-types/use-media-types'
import { useProviders } from '@/hooks/queries/providers/use-providers'
import { countOf } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'

const copy = settingsCopy.typeProviders

const ROW =
  'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
    </svg>
  )
}

/**
 * Quais provedores servem este tipo — o controle que faltava (brief, 3.10).
 *
 * ── O que ele destrava ──────────────────────────────────────────────────────
 * `media_type_providers` era **só lida**: um tipo criado pelo admin nascia sem
 * fonte para sempre — busca recusando com `no-provider`, sem arte, sem sinopse,
 * tudo digitado à mão. A promessa de "criar tipo próprio" estava construída
 * pela metade, e nada no app dizia isso a quem criava.
 *
 * ── Vincular é COPIAR uma receita, e a tela diz isso ────────────────────────
 * A junção carrega `search_body`, `field_map`, `detail_path` e o token do
 * provedor. Medido no servidor: **nenhum dos doze pares semeados funciona
 * vazio** — um `Light Novel` ligado ao AniList com a linha em branco herdaria
 * `anilistSearch('ANIME')` e devolveria **anime** para toda busca, sem erro.
 *
 * Por isso o controle tem **dois passos e não um**: o provedor, e de qual tipo
 * copiar. Esconder o segundo passo faria a pessoa achar que escolheu um
 * provedor quando escolheu um provedor **e um jeito de falar com ele**.
 *
 * ── Sub-vista no lugar, e não painel dentro de painel ──────────────────────
 * Mesma peça de `Add to pile`, do seletor de fonte de `/search` e do menu de
 * filtro: a lista abre **dentro** do próprio painel. Um submenu ancorado numa
 * linha teria conteúdo elástico acima — a nona leva do design system.
 */
export function TypeProvidersField({ type }: { type: MediaTypeInfo }) {
  const vocabulary = useMediaTypes()
  const providers = useProviders()
  const link = useLinkProvider(type.slug)
  const unlink = useUnlinkProvider(type.slug)

  const [open, setOpen] = useState(false)
  /** Qual provedor está com a lista de receitas aberta. Nulo = a raiz. */
  const [picking, setPicking] = useState<string | null>(null)
  const nameBySlug = new Map(
    (providers.data ?? []).map((provider) => [provider.slug, provider.name]),
  )
  const name = (slug: string) => nameBySlug.get(slug) ?? slug

  /**
   * A oferta sai do vocabulário INTEIRO, não da preferência de quem olha: isto
   * é Settings, e o admin não pode perder de vista um tipo por tê-lo escondido
   * para si (régua de 04/09).
   */
  const offer = linkableProviders(vocabulary.data ?? [], type.slug)

  const closeAll = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setPicking(null)
      link.reset()
    }
  }

  const active = offer.find((provider) => provider.slug === picking)
  const refused = pairInUseCount(unlink.error)

  return (
    <div className="flex flex-col gap-2 border-line border-t pt-5">
      <span className="text-muted text-xs">
        {settingsCopy.defaultProvider.providersLabel}
      </span>

      {type.providers.length > 0 && (
        <ul className="-mx-2 flex flex-col">
          {type.providers.map((slug) => (
            <li key={slug} className="flex flex-col">
              <div className="flex h-9 items-center gap-2 px-2">
                <span className="min-w-0 flex-1 truncate text-ink text-sm">
                  {name(slug)}
                </span>
                <button
                  type="button"
                  aria-label={copy.remove(name(slug))}
                  disabled={unlink.isPending}
                  onClick={() => {
                    unlink.reset()
                    unlink.mutate(slug)
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-faint transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-danger disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)] sm:size-8"
                >
                  <CloseIcon />
                </button>
              </div>
              {/* A recusa mora na PEÇA que a causou (décima quarta leva): o
               * alcance visual de uma recusa é o alcance real dela. */}
              {refused !== null && slug === unlink.variables && (
                <p className="px-2 pb-2 text-danger text-xs leading-relaxed">
                  {copy.inUse(
                    countOf(refused, settingsCopy.mediaTypes.titleCount),
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {type.providers.length === 0 && (
        <p className="text-faint text-xs leading-relaxed">
          {settingsCopy.defaultProvider.noProvider}
        </p>
      )}

      {/* **Affordance descreve o que existe:** sem provedor com receita a
       * emprestar não há o que oferecer, e o botão diz isso em vez de abrir um
       * painel vazio. */}
      {offer.length === 0 ? (
        <p className="text-faint text-xs">{copy.nothingToAdd}</p>
      ) : (
        <Popover open={open} onOpenChange={closeAll}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-fit text-xs"
            >
              {copy.add}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-64 p-2">
            {active ? (
              <div className="flex flex-col">
                <ActionMenuBack onClick={() => setPicking(null)} />
                <p className="px-2 pt-1 pb-1 text-faint text-xs">
                  {copy.copyFrom(name(active.slug))}
                </p>
                {active.sources.map((source) => (
                  <button
                    key={source.slug}
                    type="button"
                    className={ROW}
                    onClick={() =>
                      link.mutate(
                        { provider: active.slug, copyFrom: source.slug },
                        {
                          onSuccess: () => {
                            setPicking(null)
                            setOpen(false)
                          },
                        },
                      )
                    }
                  >
                    <span className="truncate">{source.label}</span>
                  </button>
                ))}
                <ActionMenuSeparator />
                <p className="px-2 pb-1 text-faint text-xs leading-relaxed">
                  {copy.copyHint}
                </p>
              </div>
            ) : (
              offer.map((provider) => (
                <button
                  key={provider.slug}
                  type="button"
                  className={ROW}
                  onClick={() => setPicking(provider.slug)}
                >
                  <span className="truncate">{name(provider.slug)}</span>
                </button>
              ))
            )}

            {link.isError && (
              <p className="px-2 pt-2 text-danger text-xs">{copy.failed}</p>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

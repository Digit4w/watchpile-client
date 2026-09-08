import { useState } from 'react'
import { RailBox } from '@/components/media/title-rail'
import { Button } from '@/components/ui/button'
import { useUnlinkEntry } from '@/hooks/mutations/entries/use-unlink-entry'
import { useEntryLinks } from '@/hooks/queries/entries/use-entry-links'
import { titleDetailCopy } from '@/routes/-title-detail.copy'
import type { EntryLink } from '@/services/entries'

const copy = titleDetailCopy.sources

/** O que a caixa está mostrando. `null` é a lista. */
type Vista =
  | { mode: 'actions'; link: EntryLink }
  | { mode: 'unlink'; link: EntryLink }
  | null

/**
 * De quais provedores a obra fala, qual deles manda, e o convite pra somar mais.
 *
 * ── Por que a caixa existe, e por que ela NÃO some quando está vazia ────────
 * `DetailsBox` e `LinksBox` somem sem conteúdo, e aqui seria errado: o estado
 * vazio é o mais comum que existe hoje — toda biblioteca montada antes de haver
 * provedor está assim —, e é exatamente ela que precisa do convite.
 *
 * ── Ela é o que torna a escolha da fonte ALCANÇÁVEL ─────────────────────────
 * Até 02/09/2026 quem decidia de qual vínculo saíam sinopse, ano e arte era o
 * provedor padrão do TIPO, que é do admin — e uma obra com dois vínculos não tinha
 * como discordar, o que deixava o segundo vínculo invisível. Agora a escolha é
 * da obra, e é aqui que ela se exerce.
 */
export function SourcesBox({
  entryId,
  previewing,
  onLink,
  onPreview,
}: {
  entryId: number
  /**
   * O vínculo que a PÁGINA está prevendo agora, se houver.
   *
   * A caixa não guarda esse estado nem o desenha: quem prevê é a tela inteira,
   * porque **o preview de uma tela é a tela** — a primeira versão tentou
   * mostrá-lo aqui dentro, em dois cartões de 200px, e o dono apontou que não
   * dava pra ver detalhe nenhum. O que a caixa faz é dizer qual é, pra não
   * contradizer a página ao lado.
   */
  previewing: string | null
  onLink: () => void
  /** Entrar em preview é decisão da PÁGINA; a caixa só pede. */
  onPreview: (link: EntryLink) => void
}) {
  const links = useEntryLinks(entryId)
  const [vista, setVista] = useState<Vista>(null)

  /**
   * A vista se fecha sozinha quando o vínculo que ela abriu deixa de existir.
   *
   * Sem isto, desvincular deixaria o painel aberto sobre um alvo que sumiu — e
   * o `Cancel` voltaria pra uma lista onde ele não está mais.
   */
  const current =
    vista &&
    links.data?.some((l) => l.provider.slug === vista.link.provider.slug)
      ? vista
      : null

  /**
   * Enquanto a página prevê, a caixa mostra a lista SEM ação: dois lugares
   * oferecendo escolher a fonte ao mesmo tempo — a barra e as linhas — seriam
   * dois controles pro mesmo gesto, e o de baixo estaria falando de um estado
   * que o de cima já trocou.
   */
  if (previewing) {
    return (
      <RailBox label={copy.label}>
        <div className="flex flex-col pb-2">
          {links.data?.map((link) => (
            <div
              key={link.provider.slug}
              className="flex items-baseline justify-between gap-2 px-3 py-2"
            >
              <span
                className={`truncate text-xs ${
                  link.provider.slug === previewing ? 'text-ink' : 'text-faint'
                }`}
              >
                {link.provider.name}
              </span>
              {link.provider.slug === previewing && (
                <span className="shrink-0 text-[0.6875rem] text-faint uppercase tracking-wide">
                  {copy.previewing('').trim()}
                </span>
              )}
            </div>
          ))}
        </div>
      </RailBox>
    )
  }

  if (current?.mode === 'unlink') {
    return (
      <UnlinkPanel
        entryId={entryId}
        target={current.link}
        onSair={() => setVista(null)}
      />
    )
  }

  if (current?.mode === 'actions') {
    return (
      <ActionsPanel
        link={current.link}
        onPromote={() => {
          onPreview(current.link)
          setVista(null)
        }}
        onUnlink={() => setVista({ mode: 'unlink', link: current.link })}
        onSair={() => setVista(null)}
      />
    )
  }

  return (
    <RailBox
      label={copy.label}
      extra={
        <button
          type="button"
          onClick={onLink}
          className="-mr-1 cursor-pointer rounded-sm px-1.5 py-0.5 text-[0.6875rem] text-muted uppercase tracking-wide outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          {copy.link}
        </button>
      }
    >
      <div className="flex flex-col pb-2">
        {links.data?.length === 0 && (
          <p className="px-3 py-1 text-faint text-xs">{copy.empty}</p>
        )}
        {links.data?.map((link) => (
          /**
           * **A linha inteira é o alvo, e ela abre um painel com as duas
           * ações** — decisão do dono, 02/09/2026. Com promover e desvincular
           * na mesma linha, um `×` de 28px no canto traria de volta a pergunta
           * em aberto #8 numa coluna de 200px, e poria a ação destrutiva colada
           * na não destrutiva. Um alvo por linha, e a escolha vem depois.
           */
          <button
            key={link.provider.slug}
            type="button"
            onClick={() => setVista({ mode: 'actions', link })}
            className="flex w-full cursor-pointer items-baseline justify-between gap-2 px-3 py-2 text-left outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised focus-visible:ring-[3px] focus-visible:ring-ink/50"
          >
            <span className="truncate text-ink text-xs">
              {link.provider.name}
            </span>
            {/* A marca do vínculo EFETIVO. Palavra e não símbolo: símbolo sem
             * legenda perde pra palavra, decidido em `/search` ao derrubar o
             * ponto oco de "sem fonte". */}
            {link.effective && (
              <span className="shrink-0 text-[0.6875rem] text-faint uppercase tracking-wide">
                {copy.effective}
              </span>
            )}
          </button>
        ))}
      </div>
    </RailBox>
  )
}

/** O painel de escolha. `Make source` some na linha que já É a fonte. */
function ActionsPanel({
  link,
  onPromote,
  onUnlink,
  onSair,
}: {
  link: EntryLink
  onPromote: () => void
  onUnlink: () => void
  onSair: () => void
}) {
  return (
    <RailBox label={copy.label}>
      <div className="flex flex-col gap-1.5 px-3 pt-1 pb-3">
        <p className="truncate text-ink text-xs">{link.provider.name}</p>
        {link.effective ? (
          // Affordance descreve o que existe: promover o que já é a fonte não
          // muda nada visível, então a linha diz o estado em vez de oferecer.
          <p className="text-faint text-xs leading-snug">
            {copy.alreadySource}
          </p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={onPromote}
          >
            {copy.make}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full text-danger text-xs hover:text-danger"
          onClick={onUnlink}
        >
          {copy.unlinkConfirm}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full text-xs"
          onClick={onSair}
        >
          {copy.cancel}
        </Button>
      </div>
    </RailBox>
  )
}

/** Desvincular. **Não apaga a obra**, e a copy diz o que sobrevive. */
function UnlinkPanel({
  entryId,
  target,
  onSair,
}: {
  entryId: number
  target: EntryLink
  onSair: () => void
}) {
  const unlink = useUnlinkEntry(entryId)

  return (
    <RailBox label={copy.label}>
      <div className="flex flex-col gap-2 px-3 pt-1 pb-3">
        <p className="text-ink text-xs leading-snug">
          {copy.unlink(target.provider.name)}
        </p>
        {/* O que SOBREVIVE, dito antes do clique: sem esta row `Unlink` lê
         * como o `Delete title` do menu logo acima. */}
        <p className="text-faint text-xs leading-snug">{copy.unlinkBody}</p>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={onSair}
          >
            {copy.cancel}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 flex-1 text-xs"
            disabled={unlink.isPending}
            onClick={() =>
              unlink.mutate(target.provider.slug, { onSuccess: onSair })
            }
          >
            {copy.unlinkConfirm}
          </Button>
        </div>
      </div>
    </RailBox>
  )
}

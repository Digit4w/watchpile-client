import { useState } from 'react'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { ActionMenuSeparator } from '@/components/menu/action-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { MediaTypeInfo } from '@/domain/media-type'
import {
  effectiveSource,
  type Source,
  type TypeSources,
} from '@/domain/search-scope'
import { searchCopy } from '@/routes/-search.copy'

function Chevron({
  size = 14,
  open = false,
}: {
  size?: number
  /** Gira 180° quando a lista abaixo está aberta — a única dica de estado. */
  open?: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-faint transition-transform duration-[var(--motion-micro)] ease-chrome ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    >
      <path d="M6.5 8.5 10 12l3.5-3.5" />
    </svg>
  )
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M4.5 10.5 8 14 15.5 6" />
    </svg>
  )
}

/**
 * Uma linha do menu — e ela tem DOIS alvos quando o tipo tem mais de uma fonte.
 *
 * **O nome do provedor deixou de ser rótulo morto e virou o controle**
 * (02/09/2026). Antes ele só informava, e trocar de fonte só existia no
 * cabeçalho dos resultados — invisível até a primeira busca voltar, e num
 * `<select>` que a guarda `sources.length > 1` nunca deixou aparecer, porque
 * nenhum tipo tinha duas fontes até o Kitsu entrar.
 *
 * A fonte mora aqui pelo mesmo motivo que o escopo mora dentro do campo: os
 * dois são **parâmetro da consulta**, não recorte do resultado (design system,
 * seção 5). Separá-los poria metade da pergunta antes de buscar e a outra
 * metade depois.
 *
 * **A lista de fontes abre NO LUGAR, não num painel flutuante**, e isso é
 * decisão. Um submenu ancorado nesta linha teria conteúdo elástico acima dele
 * — a lista de tipos varia com o vocabulário da instância —, que é exatamente
 * a forma que a nona leva do design system descreve como "o alvo se mexe sob a
 * mão". Abrindo no lugar, o painel cresce pra baixo a partir de uma âncora que
 * não se move, e o app segue com UMA camada flutuante em vez de duas.
 */
function Row({
  type,
  active,
  sources,
  selected,
  expanded,
  onSelect,
  onExpand,
  onSource,
}: {
  type: MediaTypeInfo
  active: boolean
  /** As fontes deste tipo, ou nulo quando não há onde buscar. */
  sources: TypeSources | null
  /** O slug da fonte que responde por este tipo agora. */
  selected: string | null
  expanded: boolean
  onSelect: () => void
  onExpand: () => void
  onSource: (source: string) => void
}) {
  const switchable = (sources?.options.length ?? 0) > 1
  const label = effectiveSource(sources, selected)?.name ?? null

  return (
    <div>
      <div
        className={`flex items-center rounded-sm ${active ? 'text-ink' : 'text-muted'}`}
      >
        <button
          type="button"
          onClick={onSelect}
          role="menuitemradio"
          aria-checked={active}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-sm py-2 pl-2 text-left text-sm ${
            active
              ? ''
              : 'transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
          }`}
        >
          <MediaTypeIcon type={type.slug} size={14} strokeWidth={1.7} />
          <span className="min-w-0 flex-1 truncate">{type.plural}</span>
        </button>

        {/* O name da source na própria row: é a informação que a bolinha
         * tentava dar com um glifo e não dava. Quem lê descobre ONDE cada tipo
         * busca sem sair do menu — e, quando há mais de uma, troca daqui.
         *
         * Com uma fonte só ele continua sendo texto: um controle de uma opção
         * é um controle que mente sobre ter escolha.
         *
         * **Ele cede espaço ANTES do tipo, e isso é hierarquia — 02/09/2026.**
         * Era `shrink-0`, então o tipo absorvia todo o aperto e a linha ativa
         * aparecia como `Ani...` com `Jikan (MyAnimeList)` inteiro ao lado: o
         * que se ESCOLHE abreviado pra caber uma propriedade do que se escolhe.
         * Quem identifica a linha é o tipo; a fonte reforça (design system,
         * seção 4) — e "dá pra reconhecer pelo ícone" é justamente o argumento
         * que a seção 5 recusou ao derrubar o ponto oco: **glifo entra onde a
         * palavra não cabe**, e aqui ela cabe.
         *
         * O teto é 45% em vez de um piso em px porque o que ele garante é uma
         * PROPORÇÃO — a identidade fica com a maioria da linha —, e porque nome
         * de tipo não tem teto: o usuário cria tipo desde 30/08, enquanto nome
         * de provedor é curto por natureza (28 a 73px medidos). Espremer o que
         * cresce sem limite pra caber o que não cresce é o mesmo erro de
         * dimensionamento que derrubou a fileira de chips de `/search`. */}
        {label &&
          (switchable ? (
            <button
              type="button"
              onClick={onExpand}
              aria-expanded={expanded}
              aria-label={searchCopy.scope.changeSourceOf(type.plural)}
              className="flex max-w-[45%] items-center gap-1 rounded-sm px-2 py-2 text-faint text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
            >
              <span className="min-w-0 truncate">{label}</span>
              <Chevron size={12} open={expanded} />
            </button>
          ) : (
            <span className="max-w-[45%] truncate px-2 text-faint text-xs">
              {label}
            </span>
          ))}

        {active && (
          <span className="shrink-0 pr-2">
            <Check />
          </span>
        )}
      </div>

      {expanded && sources && (
        <div className="pb-1">
          {sources.options.map((option) => (
            <button
              key={option.slug}
              type="button"
              onClick={() => onSource(option.slug)}
              role="menuitemradio"
              aria-checked={option.slug === selected}
              className={`flex w-full items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-left text-sm ${
                option.slug === selected
                  ? 'text-ink'
                  : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{option.name}</span>
              {option.slug === selected && <Check />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * A troca de fonte FORA do menu de escopo — a peça do cabeçalho de resultados.
 *
 * **Ela era um `<select>` NATIVO até 09/09/2026**, e foi o último do app a ser
 * desenhado pelo sistema operacional numa tela de lançamento: a lista abria
 * com a estética do SO no meio de um app que resolve escolha com popover em
 * todo lugar. Trocá-la aqui não é enfeite — é o mesmo controle passando a
 * aparecer também sob a RECUSA, que é onde ele mais importa.
 *
 * **Mora neste arquivo de propósito.** Ela e o menu de escopo escrevem o mesmo
 * par de parâmetros da consulta, e é aqui que o `Chevron`, o `Check` e o
 * desenho da linha de fonte já existem — copiá-los pra um arquivo vizinho é
 * como os cinco menus escritos à mão nasceram.
 *
 * Com uma fonte só ela continua sendo TEXTO: um seletor de uma opção é um
 * controle que mente sobre ter escolha.
 */
export function SourcePicker({
  sources,
  current,
  onSource,
}: {
  sources: readonly Source[]
  current: string
  onSource: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)
  const label = sources.find((source) => source.slug === current)?.name ?? ''

  if (sources.length <= 1) {
    return <span className="text-ink text-sm">{label}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={searchCopy.changeSource}
          className="flex h-9 cursor-pointer items-center gap-1 rounded-md px-2 text-ink text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          <span className="min-w-0 truncate">{label}</span>
          <Chevron size={12} open={open} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={4} className="w-48 p-1">
        {sources.map((source) => (
          <button
            key={source.slug}
            type="button"
            role="menuitemradio"
            aria-checked={source.slug === current}
            onClick={() => {
              onSource(source.slug)
              setOpen(false)
            }}
            className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm ${
              source.slug === current
                ? 'text-ink'
                : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{source.name}</span>
            {source.slug === current && <Check />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/**
 * O escopo da busca — e ele mora **dentro do campo**, não numa fileira de
 * chips (01/09/2026).
 *
 * A fileira foi construída primeiro e caiu por dois defeitos que só a tela
 * mostrou. O primeiro: os tipos sem fonte eram marcados com uma **bolinha**,
 * que é um símbolo sem legenda — o sistema já dizia esse tipo de coisa com
 * PALAVRA (em `/settings/media-types`, a recusa vem com o motivo escrito ao
 * lado), e um glifo mudo foi vocabulário inventado. O segundo: medindo, sete
 * chips ocupavam 794px numa fileira de 1216 — entre oito e dez tipos e ela
 * estoura, com transbordo em **rolagem horizontal silenciosa** no desktop.
 *
 * E o controle estava desenhado pra coisa errada. O que a fileira precisava
 * segurar não é o número de tipos: é o número de tipos **com fonte**, que é
 * pequeno por construção (o v1 tem dois). O que cresce sem teto é a cauda sem
 * fonte — e era ela que estourava a fileira.
 *
 * A régua que sai daí: **controle de escopo acompanha o inventário que ele
 * PODE servir, não o que existe** — e quando esse inventário não tem teto, ele
 * é menu, nunca fileira.
 *
 * O menu agrupa: primeiro quem tem fonte, com o nome dela na linha; depois,
 * sob um cabeçalho que diz isso em palavras, quem não tem. **Ninguém some** —
 * o que a fileira filtrada faria — e a explicação continua a um clique, que é
 * o que o brief 3.10 exige.
 */
export function SearchScope({
  scope,
  source,
  types,
  sourceByType,
  onScope,
  onSource,
}: {
  scope: string | null
  /** A fonte pedida na URL, quando alguém trocou. Nula = a que manda. */
  source: string | null
  types: MediaTypeInfo[]
  /** slug do tipo → as fontes dele. */
  sourceByType: Map<string, TypeSources>
  onScope: (next: string) => void
  onSource: (type: string, source: string) => void
}) {
  const [open, setOpen] = useState(false)
  /**
   * Qual linha está com as fontes abertas — uma só, e **zerada ao fechar o
   * menu**: reabrir com uma sublista aberta mostraria estado de uma visita
   * anterior, e o menu passaria a ter memória que ninguém pediu.
   */
  const [expanded, setExpanded] = useState<string | null>(null)

  const closeAll = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setExpanded(null)
    }
  }

  /**
   * A fonte selecionada de um tipo. O `provider` da URL só vale DENTRO do tipo
   * ativo — em qualquer outro, quem manda é o efetivo, porque trocar de tipo
   * limpa a fonte (ver `onEscopo` na rota).
   */
  const selectedFor = (slug: string) =>
    slug === scope
      ? (source ?? sourceByType.get(slug)?.current.slug ?? null)
      : (sourceByType.get(slug)?.current.slug ?? null)

  const active = types.find((type) => type.slug === scope)
  const withSource = types.filter((type) => sourceByType.has(type.slug))
  const withoutSource = types.filter((type) => !sourceByType.has(type.slug))

  return (
    <Popover open={open} onOpenChange={closeAll}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={searchCopy.scope.label}
          className="flex h-full shrink-0 items-center gap-1.5 rounded-l-md border-line border-r px-3 text-ink text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          {active && (
            <MediaTypeIcon type={active.slug} size={14} strokeWidth={1.7} />
          )}
          <span className="max-w-32 truncate">{active?.plural ?? ''}</span>
          <Chevron />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className="w-64 p-2">
        {withSource.map((type) => (
          <Row
            key={type.slug}
            type={type}
            active={type.slug === scope}
            sources={sourceByType.get(type.slug) ?? null}
            selected={selectedFor(type.slug)}
            expanded={expanded === type.slug}
            onSelect={() => {
              onScope(type.slug)
              closeAll(false)
            }}
            /* Abrir a lista de fontes NÃO fecha o menu: escolher fonte é o
             * segundo passo da mesma pergunta, não outra. */
            onExpand={() =>
              setExpanded((current) =>
                current === type.slug ? null : type.slug,
              )
            }
            onSource={(slug) => {
              onSource(type.slug, slug)
              closeAll(false)
            }}
          />
        ))}

        {/* O cabeçalho só existe quando há o que agrupar sob ele — uma seção
         * vazia com título é chrome que não faz nada. */}
        {withoutSource.length > 0 && (
          <>
            {withSource.length > 0 && <ActionMenuSeparator />}
            <p className="px-2 pt-1 pb-1 text-faint text-xs">
              {searchCopy.scope.noSource}
            </p>
            {withoutSource.map((type) => (
              <Row
                key={type.slug}
                type={type}
                active={type.slug === scope}
                sources={null}
                selected={null}
                expanded={false}
                onSelect={() => {
                  onScope(type.slug)
                  closeAll(false)
                }}
                onExpand={() => {}}
                onSource={() => {}}
              />
            ))}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

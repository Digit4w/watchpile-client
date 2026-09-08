import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ICON_SET } from '@/components/media/icon-set'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { IconName } from '@/domain/media-type'
import { settingsCopy } from '@/routes/-settings.copy'

/**
 * O acervo, como LISTA — e ela sai do mapa que já existe, não de uma segunda
 * cópia escrita aqui.
 *
 * `ICON_SET` é `Record<IconName, LucideIcon>`, e `IconName` deriva do `z.enum`
 * do contrato: o compilador já exige que o mapa cubra exatamente o acervo do
 * servidor (`icon-set.ts`). Escrever a lista de novo neste arquivo seria
 * justamente o que o brief 3.7 proíbe — e o item 10 do handoff descreve.
 *
 * A ordem é a do objeto literal, que é a da curadoria: os de tela primeiro, os
 * genéricos por último. Ordenar alfabeticamente perderia esse agrupamento.
 */
const ICON_NAMES = Object.keys(ICON_SET) as IconName[]

/**
 * O seletor de ícone: **botão com busca, não paleta visível** (design system,
 * seção 5).
 *
 * Com um acervo curado de 94 glifos a grade visível deixou de caber, e mesmo
 * com oito ela gastava duas fileiras da folha por uma escolha que se faz uma
 * vez na vida do tipo.
 *
 * **Popover do Radix, e não um bloco absoluto dentro da folha**: ele sai por
 * portal, então a rolagem da folha não o corta — que era o andaime declarado no
 * cabeçalho do mockup.
 *
 * **A busca é por nome em inglês**, e o glifo não se traduz — a frase de rodapé
 * diz isso em vez de deixar quem procura "livro" achar que o acervo não tem
 * livro. É uma das duas saídas registradas para a pergunta em aberto #12; a
 * outra (sinônimos por idioma) segue sem decisão.
 */
export function IconPicker({
  value,
  onChange,
}: {
  value: IconName | null
  onChange: (icon: IconName) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearch] = useState('')

  const found = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (term === '') {
      return ICON_NAMES
    }
    return ICON_NAMES.filter((name) => name.includes(term))
  }, [searchQuery])

  const Selected = value ? ICON_SET[value] : null

  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line text-ink">
        {Selected ? (
          <Selected size={20} strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <span className="size-5 rounded-sm bg-raised" aria-hidden="true" />
        )}
      </span>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          // A busca zera ao fechar: reabrir com o termo anterior mostraria um
          // acervo recortado sem que nada na tela dissesse por quê.
          if (!next) {
            setSearch('')
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md px-3 font-medium text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
          >
            {value
              ? settingsCopy.mediaTypes.sheet.changeIcon
              : settingsCopy.mediaTypes.iconPicker.empty}
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72 p-2">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={settingsCopy.mediaTypes.iconPicker.search}
                className="h-9 pl-8 text-sm"
                aria-label={settingsCopy.mediaTypes.iconPicker.search}
              />
            </div>

            {found.length === 0 ? (
              <p className="px-1 py-6 text-center text-faint text-sm">
                {settingsCopy.mediaTypes.iconPicker.noMatch}
              </p>
            ) : (
              // Seis colunas: 288px de popover menos o padding dão 256, e a
              // 40px isso é seis.
              <div className="scrollbar-styled grid max-h-48 grid-cols-6 gap-0.5 overflow-y-auto">
                {found.map((name) => {
                  const Glyph = ICON_SET[name]
                  const chosen = name === value
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        onChange(name)
                        setOpen(false)
                        setSearch('')
                      }}
                      // O nome do glifo é o único rótulo que ele tem, e o
                      // `title` é o que o torna descobrível com o ponteiro —
                      // sem isso a grade é 94 desenhos sem nome.
                      title={name}
                      aria-label={name}
                      aria-pressed={chosen}
                      className={
                        chosen
                          ? 'flex size-10 shrink-0 items-center justify-center rounded-md bg-ink text-surface'
                          : 'flex size-10 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
                      }
                    >
                      <Glyph size={18} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            )}

            <p className="px-1 pb-0.5 text-faint text-xs">
              {settingsCopy.mediaTypes.iconPicker.hint}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

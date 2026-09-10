import { ArrowRight } from 'lucide-react'
import { iconFor } from '@/components/media/icon-set'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { IconName } from '@/domain/media-type'
import type { NameDraftMap } from '@/domain/media-type-form'
import { useMediaTypeTemplates } from '@/hooks/queries/media-types/use-media-type-templates'
import { settingsCopy } from '@/routes/-settings.copy'
import type { MediaTypeTemplate } from '@/services/media-types'

const copy = settingsCopy.mediaTypes.templates

/**
 * `Add type` **oferece os templates antes do formulário em branco** (design
 * system, seção 5; brief, 3.9).
 *
 * A regra nasceu de uma consequência do wizard de primeiro uso: ele vai semear
 * só os tipos que o admin escolher, e **semear parcial não pode ser porta de
 * mão única** — quem nunca viu "Manga" não sabe que ele existia pra ser
 * recriado. Formulário em branco não é caminho de volta.
 *
 * Ela generaliza: onde o produto embarca conjunto pronto, criar mostra o
 * conjunto primeiro, com "do zero" como saída.
 *
 * **O template só PREENCHE a folha** — salvar passa pelo mesmo `POST` do
 * formulário em branco, e nada aqui cria tipo direto. Um atalho de criação faria
 * o caminho do usuário apodrecer, que é a régua que o brief 3.10 aplica a
 * provedor e que vale igual aqui.
 *
 * **Template já instalado nasce desabilitado com o motivo na própria linha**, e
 * não some da lista: some seria esconder que o produto embarca aquele tipo. É a
 * mesma forma da recusa de apagar — anunciada antes do clique, porque o app não
 * tem toast.
 */
export function TemplatePicker({
  open,
  onOpenChange,
  onPick,
  onScratch,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (draft: {
    icon: IconName
    countsProgress: boolean
    tracksTime: boolean
    names: NameDraftMap
  }) => void
  onScratch: () => void
}) {
  // Só pede quando abre: é resposta de admin, e a maioria das visitas a esta
  // seção não cria tipo nenhum.
  const templates = useMediaTypeTemplates(open)

  function pick(template: MediaTypeTemplate) {
    const names: NameDraftMap = {}
    for (const [locale, value] of Object.entries(template.names)) {
      names[locale] = {
        name: value.name,
        plural: value.plural,
        progressUnit: value.progressUnit ?? '',
      }
    }
    onPick({
      icon: template.icon,
      countsProgress: template.countsProgress,
      // O template PREENCHE o formulário, então ele traz o campo junto — sem
      // isto, escolher `Game` abriria a folha com o tempo desligado, que é o
      // oposto do que o produto embarca.
      tracksTime: template.tracksTime,
      names,
    })
  }

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-4" aria-describedby={undefined}>
        <SheetHeader className="pb-0">
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.body}</SheetDescription>
        </SheetHeader>

        <div className="scrollbar-styled flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4">
          {templates.data?.map((template) => {
            const Icon = iconFor(template.icon)
            // O nome em inglês: a folha é onde a tradução aparece, e aqui o
            // rótulo identifica QUAL template é. O mapa inteiro vai junto ao
            // preencher, então nada se perde.
            const label = template.names.en?.name ?? template.slug

            return (
              <button
                key={template.slug}
                type="button"
                disabled={template.installed}
                onClick={() => pick(template)}
                className="flex h-14 items-center gap-3 rounded-md px-3 text-left transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]"
              >
                <Icon
                  className="shrink-0 text-muted"
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-ink text-sm">
                  {label}
                </span>
                {template.installed && (
                  <span className="shrink-0 text-faint text-xs">
                    {copy.installed}
                  </span>
                )}
              </button>
            )
          })}

          {/* A saída, e ela é uma peça de outro peso: não é mais um template,
           * é o que fazer quando nenhum serve. */}
          <div className="mt-4 border-line border-t pt-4">
            <button
              type="button"
              onClick={onScratch}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-ink text-sm">
                  {copy.scratch}
                </span>
                <span className="text-faint text-xs">{copy.scratchBody}</span>
              </span>
              <ArrowRight
                className="shrink-0 text-faint"
                size={16}
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <SheetFooter className="border-line border-t">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {settingsCopy.mediaTypes.sheet.cancel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

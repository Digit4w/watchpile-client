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
import type { Pile } from '@/domain/media'
import { useUpdatePile } from '@/hooks/mutations/piles/use-update-pile'
import { pilesCopy } from '@/routes/-piles.copy'
import { PileCoverField } from './pile-cover-field'

/**
 * A folha de editar pilha: nome e descrição.
 *
 * **Editar ganha folha, criar ganha popover** — a mesma régua do peso do
 * formulário (brief, 3.17), lida na outra direção: aqui há dois campos, a arte
 * atual à vista, e a intenção é ajustar com calma, não despachar.
 *
 * **A capa entrou em 31/08/2026**, junto de `Remove when completed`. Os dois
 * moram aqui e não no popover de criar pela mesma régua: criar pede o mínimo,
 * customizar é outro momento (design system, seção 5, 29/08/2026).
 *
 * Eles têm naturezas diferentes, e por isso salvam diferente. Nome, descrição
 * e o toggle são FORMULÁRIO — esperam o `Save`. A capa é um arquivo, e sobe
 * assim que o enquadramento é confirmado: guardá-la até o `Save` obrigaria a
 * folha a segurar um `Blob` e a desfazer o upload se alguém cancelasse.
 *
 * **`Delete pile` não está aqui**, e a ausência é decisão: ele já mora no `⋯`
 * da pilha, e dois caminhos pra mesma coisa na mesma tela é onde a interface
 * começa a mentir sobre onde as coisas moram.
 *
 * `modal` explícito: o `Sheet` do projeto é não-modal por padrão, porque a
 * folha de widget existe pra se arrastar de dentro dela pra fora. Um formulário
 * quer o contrário — foco preso, `Esc` fecha, clique fora fecha.
 */
export function EditPileSheet({
  pile,
  onOpenChange,
}: {
  /** A pilha em edição, ou `null` quando a folha está fechada. */
  pile: Pile | null
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [removeWhenCompleted, setRemoveWhenCompleted] = useState(false)
  const update = useUpdatePile(pile?.id ?? 0)

  /**
   * Os campos recarregam quando a folha passa a editar OUTRA pilha, e a
   * dependência é o `id` — não o objeto.
   *
   * A pilha em edição é a mesma referência que está na lista em cache, e o
   * remendo de `patch-pile.ts` a substitui a cada salvamento: com o objeto na
   * dependência, salvar reescreveria o campo por cima do que estivesse sendo
   * digitado logo depois.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: ver acima
  useEffect(() => {
    setName(pile?.name ?? '')
    setDescription(pile?.description ?? '')
    setRemoveWhenCompleted(pile?.removeWhenCompleted ?? false)
    update.reset()
  }, [pile?.id])

  const trimmed = name.trim()
  const canSubmit = pile !== null && trimmed !== '' && !update.isPending

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    // Manda os três campos porque os três estão na tela e qualquer um pode ter
    // mudado. A descrição vazia vira `null` no servidor, que é o que apaga.
    //
    // A CAPA não vai aqui: ela já subiu no momento em que o enquadramento foi
    // confirmado. Um arquivo não é campo de formulário — segurá-lo até o
    // `Save` obrigaria a folha a carregar um `Blob` e a desfazer o upload se
    // alguém cancelasse.
    update.mutate(
      { name: trimmed, description, removeWhenCompleted },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Sheet modal open={pile !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-4" aria-describedby={undefined}>
        <SheetHeader className="pb-0">
          <SheetTitle>{pilesCopy.edit.title}</SheetTitle>
          <SheetDescription>{pilesCopy.edit.body}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
        >
          <div className="scrollbar-styled flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4">
            {pile && <PileCoverField pile={pile} />}

            <div className="flex flex-col gap-2">
              <label className="text-muted text-xs" htmlFor="edit-pile-name">
                {pilesCopy.edit.name}
              </label>
              <Input
                id="edit-pile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-muted text-xs"
                htmlFor="edit-pile-description"
              >
                {pilesCopy.edit.description}
              </label>
              {/* `textarea` e não `Input`: a descrição é frase, às vezes duas,
               * e um campo de uma linha esconderia o fim do que se escreveu.
               * `resize-none` porque a folha tem 288px e o punho do resize
               * arrastaria o campo pra fora dela. */}
              <textarea
                id="edit-pile-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={pilesCopy.edit.descriptionPlaceholder}
                className="w-full resize-none rounded-md border border-line bg-raised px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-faint focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
              />
            </div>

            <div className="flex flex-col gap-2 border-line border-t pt-4">
              <span className="text-muted text-xs">
                {pilesCopy.behavior.label}
              </span>
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span
                    id="pile-auto-remove-label"
                    className="text-ink text-sm"
                  >
                    {pilesCopy.behavior.removeWhenCompleted}
                  </span>
                  <span className="text-faint text-xs leading-relaxed">
                    {pilesCopy.behavior.removeWhenCompletedBody}
                  </span>
                </span>
                <Switch
                  checked={removeWhenCompleted}
                  onCheckedChange={setRemoveWhenCompleted}
                  aria-labelledby="pile-auto-remove-label"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="border-line border-t">
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {pilesCopy.edit.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {pilesCopy.edit.cancel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

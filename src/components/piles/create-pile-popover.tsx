import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCreatePile } from '@/hooks/mutations/piles/use-create-pile'
import { pilesCopy } from '@/routes/-piles.copy'

/**
 * Criar pilha: **um campo, num popover**.
 *
 * A régua é o peso do objeto (brief, 3.17): obra tem cinco campos e ganha folha
 * lateral; pilha tem um e ganha popover. Criar pilha é gesto de MEIO de tarefa
 * — você está guardando uma obra e precisa de um lugar —, e não pode custar um
 * formulário.
 *
 * Capa e descrição não estão aqui, e a frase de rodapé diz isso: elas são
 * EDIÇÃO, na folha que sai do `⋯`. Sem a frase, quem procura a capa acha que
 * ela foi esquecida.
 */
export function CreatePilePopover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const create = useCreatePile()

  const trimmed = name.trim()
  // O servidor exige nome com pelo menos um caractere; barrar aqui é o que
  // evita um 400 previsível numa tela onde a pessoa vê o campo vazio.
  const canSubmit = trimmed !== '' && !create.isPending

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    create.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setName('')
          setOpen(false)
        },
      },
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setName('')
          create.reset()
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 p-4">
        {/* `form` de verdade: é o que faz Enter no campo criar a pile, sem um
         * `onKeyDown` escrito à mão — e num popover de um campo o Enter é o
         * gesto principal, não um atalho. */}
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-muted text-xs" htmlFor="new-pile-name">
              {pilesCopy.create.name}
            </label>
            <Input
              id="new-pile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={pilesCopy.create.placeholder}
              className="h-9 text-sm"
              autoFocus
            />
          </div>

          <p className="text-faint text-xs">{pilesCopy.create.hint}</p>

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {pilesCopy.create.submit}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

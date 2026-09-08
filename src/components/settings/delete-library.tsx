import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useDeleteAllEntries } from '@/hooks/mutations/entries/use-delete-all-entries'
import { useEntries } from '@/hooks/queries/entries/use-entries'
import { countOf } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'

const copy = settingsCopy.danger.deleteLibrary

/**
 * A zona de perigo de `YOU / Account` — apagar todas as obras.
 *
 * **Ela mora aqui e não numa seção própria** (decisão do dono, 07/09/2026): a
 * seção já é "você neste servidor", e uma quarta linha em `YOU` para uma ação
 * de conveniência faria a coluna crescer por um botão.
 *
 * ── A promessa se lê ANTES do clique ────────────────────────────────────────
 * O corpo enumera o que vai junto — progresso, histórico, vínculo, posição em
 * cada pilha — porque `cascade` é invisível e o nome da ação só menciona as
 * obras. E diz o que **fica**: as pilhas, vazias. É a régua de *promessa de
 * escrita destrutiva se lê antes do clique* (design system, seção 5), com a
 * contagem ao lado como no apagar de tipo de mídia.
 *
 * ── E há uma saída, que existe de verdade desde hoje ────────────────────────
 * A linha aponta o export. Ela só se justifica porque a seção irmã existe: uma
 * frase que sugerisse "faça backup antes" sem dizer como seria conselho, não
 * affordance.
 *
 * ── Popover e não modal, como o remover widget ──────────────────────────────
 * A pergunta sai de dentro do botão que a provocou. Ela é mais grave que
 * aquela, e o que carrega a gravidade é a copy e a contagem — não uma segunda
 * camada de chrome. O app não tem diálogo modal e adotar um por causa de um
 * botão decidiria esse padrão pelo caminho errado.
 */
export function DeleteLibrary() {
  const [open, setOpen] = useState(false)
  const entries = useEntries()
  const remove = useDeleteAllEntries()

  const total = entries.data?.length ?? 0
  /**
   * **A recusa se anuncia antes do clique**, e aqui ela é a única que existe: o
   * servidor aceita apagar um acervo vazio e responde `0`. Desabilitar é o que
   * impede o gesto de parecer que fez alguma coisa.
   *
   * Enquanto a contagem não chegou o botão fica desabilitado também: sem saber
   * o tamanho, a confirmação não teria o que prometer.
   */
  const canDelete = entries.isSuccess && total > 0 && !remove.isPending

  return (
    <div className="mt-6 border-line border-t pt-5">
      <p className="font-medium text-ink text-sm">
        {settingsCopy.danger.title}
      </p>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-ink text-sm">{copy.title}</p>
          <p className="mt-1 max-w-prose text-muted text-sm">{copy.body}</p>
          {/* A promessa, com a contagem DENTRO dela. Enquanto o número não
           * chegou a frase não aparece: prometer sem dizer quanto é a metade
           * que não protege ninguém. */}
          {entries.isSuccess && (
            <p className="mt-1 max-w-prose text-faint text-xs">
              {total === 0
                ? copy.empty
                : copy.warning(countOf(total, copy.count))}
            </p>
          )}
          {/* O resultado mora na peça que a pessoa acabou de tocar — o app não
           * tem toast, e o número apagado é a única confirmação que existe. */}
          {remove.isSuccess && (
            <p className="mt-2 text-faint text-xs">
              {copy.done(countOf(remove.data.deleted, copy.count))}
            </p>
          )}
          {remove.isError && (
            <p className="mt-2 text-danger text-xs">{copy.failed}</p>
          )}
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={
                canDelete
                  ? 'shrink-0 border-danger/50 text-danger hover:bg-danger/10'
                  : 'shrink-0'
              }
              disabled={!canDelete}
            >
              {copy.action}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" sideOffset={8} className="w-72 p-3">
            <PopoverHeader>
              <PopoverTitle>{copy.confirmTitle}</PopoverTitle>
              <PopoverDescription className="text-xs">
                {copy.confirmBody(countOf(total, copy.count))}
              </PopoverDescription>
            </PopoverHeader>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm px-2.5 py-1.5 text-muted text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
              >
                {copy.cancel}
              </button>
              {/* Danger como TEXTO sobre véu da própria cor, e não sólido:
               * dentro de um popover de vidro o preenchimento opaco anula a
               * translucidez (`tokens.css`, 01/09/2026). */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  remove.mutate()
                }}
                className="rounded-sm bg-danger/10 px-2.5 py-1.5 font-medium text-danger text-xs transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-danger/20"
              >
                {copy.confirm}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

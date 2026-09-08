import { useState } from 'react'
import {
  ActionMenu,
  ActionMenuConfirm,
  ActionMenuItem,
  ActionMenuSeparator,
  MoreIcon,
} from '@/components/menu/action-menu'
import { EditIcon, TrashIcon } from '@/components/menu/menu-icons'
import type { Pile } from '@/domain/media'
import { useDeletePile } from '@/hooks/mutations/piles/use-delete-pile'
import { pilesCopy } from '@/routes/-piles.copy'

type PileActionsProps = {
  pile: Pile
  onEdit: () => void
  /** A classe do gatilho — o ladrilho e a linha o desenham diferente. */
  triggerClassName: string
}

/**
 * O `⋯` da pilha: editar e apagar.
 *
 * **Sem `Duplicate`**, que o mockup listava. Ele estava lá porque a grade
 * pedia um terceiro item entre editar e apagar — motivo de layout, não de
 * produto —, e não havia rota. Decisão do dono do projeto em 30/08/2026: sai.
 *
 * A forma do painel é a do app inteiro (`menu/action-menu.tsx`) — este arquivo
 * era o mais distante dela: `w-56`, sem ícone nenhum, e o `Delete pile` só
 * ficava vermelho no hover. Nada disso tinha sido decidido.
 *
 * A confirmação sai de dentro do botão que a provocou, e não de um diálogo
 * modal, pelo mesmo motivo de `home/widget-remove.tsx`. Só que aqui ela pesa
 * mais — apagar pilha não tem volta —, e por isso a frase precisa dizer o que
 * a ação **não** faz: a obra fica na biblioteca.
 */
export function PileActions({
  pile,
  onEdit,
  triggerClassName,
}: PileActionsProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const remove = useDeletePile()

  function close() {
    setOpen(false)
    // O passo de confirmação se desfaz ao fechar: reabrir o menu no meio da
    // pergunta reabriria com o "Delete" armado, e ninguém pediu isso.
    setConfirming(false)
  }

  return (
    <ActionMenu
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      trigger={
        <button
          type="button"
          className={triggerClassName}
          aria-label={pilesCopy.actions.menu}
        >
          <MoreIcon />
        </button>
      }
    >
      {confirming ? (
        <ActionMenuConfirm
          title={pilesCopy.remove.title}
          body={pilesCopy.remove.body}
          confirmLabel={pilesCopy.remove.confirm}
          pending={remove.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={() => remove.mutate(pile.id, { onSuccess: close })}
        />
      ) : (
        <>
          <ActionMenuItem
            icon={<EditIcon />}
            onClick={() => {
              close()
              onEdit()
            }}
          >
            {pilesCopy.actions.edit}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={<TrashIcon />}
            tone="danger"
            onClick={() => setConfirming(true)}
          >
            {pilesCopy.actions.delete}
          </ActionMenuItem>
        </>
      )}
    </ActionMenu>
  )
}

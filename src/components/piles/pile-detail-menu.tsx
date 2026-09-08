import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  ActionMenu,
  ActionMenuConfirm,
  ActionMenuItem,
  ActionMenuSeparator,
} from '@/components/menu/action-menu'
import { PinIcon, TrashIcon } from '@/components/menu/menu-icons'
import type { Pile } from '@/domain/media'
import { useDeletePile } from '@/hooks/mutations/piles/use-delete-pile'
import { useUpdatePile } from '@/hooks/mutations/piles/use-update-pile'
import { pileDetailCopy } from '@/routes/-pile-detail.copy'
import { pilesCopy } from '@/routes/-piles.copy'

type PileDetailMenuProps = {
  pile: Pile
  onDeleted: () => void
  children: ReactNode
  align?: 'start' | 'center' | 'end'
}

/**
 * O `⋯` da tela da pilha: **fixar e apagar, e nada além**.
 *
 * `Edit` não está aqui, e a ausência é a regra: ele já é um botão ao lado, e
 * dois caminhos pra mesma coisa na mesma tela é onde a interface começa a
 * mentir sobre onde as coisas moram (design system, seção 5). Pelo mesmo
 * motivo `Add titles` também fica fora — a caixa tem dois itens porque são
 * duas as ações que só existem aqui, não porque coubessem quatro.
 *
 * **Fixar é gesto, não campo de formulário** — por isso mora num menu e não na
 * folha de edição, ao contrário de `Remove when completed`, que é ajuste. A
 * régua é a de 30/08/2026: item de menu nasce de ação.
 *
 * A confirmação de apagar é um segundo popover dentro do primeiro, como em
 * `pile-actions.tsx`. A frase precisa dizer o que a ação **não** faz: a obra
 * fica na biblioteca.
 */
export function PileDetailMenu({
  pile,
  onDeleted,
  children,
  align = 'end',
}: PileDetailMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const update = useUpdatePile(pile.id)
  const remove = useDeletePile()

  const pinned = pile.pinnedAt !== null

  function close() {
    setOpen(false)
    setConfirming(false)
  }

  return (
    <ActionMenu
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      align={align}
      trigger={children}
    >
      {confirming ? (
        <ActionMenuConfirm
          title={pilesCopy.remove.title}
          body={pilesCopy.remove.body}
          confirmLabel={pilesCopy.remove.confirm}
          pending={remove.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={() =>
            remove.mutate(pile.id, {
              onSuccess: () => {
                close()
                // A tela que se estava vendo deixou de existir: sair é a
                // única saída honesta, e quem decide pra onde é a rota.
                onDeleted()
              },
            })
          }
        />
      ) : (
        <>
          <ActionMenuItem
            icon={<PinIcon />}
            disabled={update.isPending}
            onClick={() =>
              // O cliente manda a INTENÇÃO; o instante é do servidor — mesma
              // divisão que `position` já tem (brief, 3.14).
              update.mutate({ pinned: !pinned }, { onSuccess: close })
            }
          >
            {pinned ? pileDetailCopy.actions.unpin : pileDetailCopy.actions.pin}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={<TrashIcon />}
            tone="danger"
            onClick={() => setConfirming(true)}
          >
            {pileDetailCopy.actions.delete}
          </ActionMenuItem>
        </>
      )}
    </ActionMenu>
  )
}

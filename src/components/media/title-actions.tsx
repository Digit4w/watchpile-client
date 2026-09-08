import { useState } from 'react'
import { EntryPiles } from '@/components/media/entry-piles'
import {
  ActionMenu,
  ActionMenuBack,
  ActionMenuConfirm,
  ActionMenuItem,
  ActionMenuPanel,
  ActionMenuSeparator,
  MoreIcon,
} from '@/components/menu/action-menu'
import { PileAddIcon, TrashIcon } from '@/components/menu/menu-icons'
import type { Entry } from '@/domain/media'
import { useDeleteEntry } from '@/hooks/mutations/entries/use-delete-entry'
import { appCopy } from '@/lib/copy'

/**
 * O `⋯` ao lado do título.
 *
 * ── Por que ele existe ─────────────────────────────────────────────────────
 * Tirar da biblioteca só se fazia voltando pra listagem, e o dono chamou isso
 * de "pé no saco" com razão: a ação é sobre a obra que está na tela.
 *
 * **Aqui os 44px saem de graça**, e por isso esta peça NÃO herda a decisão em
 * aberto #8 — lá o `⋯` briga com a densidade de uma linha de listagem; num
 * cabeçalho de página não há densidade a defender. O alvo é de 44; o que ele
 * ABRE é o menu da carta, sem alteração nenhuma.
 *
 * ── É o mesmo menu de todo `⋯` do app ──────────────────────────────────────
 * A forma vem de `menu/action-menu.tsx`, e este arquivo foi o gatilho pra ela
 * existir: o dono apontou que o menu daqui não parecia o da carta, e ao ir
 * conferir havia CINCO menus escritos à mão, todos diferentes entre si.
 *
 * A copy também é a mesma (`appCopy.entry.*`): a tela tinha um segundo texto
 * pro mesmo diálogo ("Delete this title?" contra "Remove this work?"), e dois
 * catálogos dizendo a mesma coisa com palavras diferentes é o defeito que
 * aparece inteiro no dia da tradução.
 *
 * ── As pilhas aparecem NOS DOIS lugares, de propósito ──────────────────────
 * Elas continuam na coluna esquerda **e** entram aqui, a pedido do dono, pra
 * comparar as duas formas antes de escolher uma. Duplicidade consciente e
 * temporária — não é o estado final da tela.
 *
 * **E cada lugar usa o componente que foi desenhado pra ele.** Aqui é o
 * `EntryPiles`, o mesmo do hover da carta: ele nasceu pra POPOVER — cabeçalho
 * próprio, lista sempre aberta, busca a partir da quinta pilha. Na coluna ele
 * duplicava rótulo e comia meia tela, e lá o `PilePicker` de chips é que serve.
 */
export function TitleActions({
  entry,
  onDeleted,
}: {
  entry: Entry
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [vista, setVista] = useState<'menu' | 'piles' | 'confirmar'>('menu')
  const remove = useDeleteEntry()

  return (
    <ActionMenu
      open={open}
      onOpenChange={(next) => {
        // Fechar volta ao menu: reabrir no meio de uma sub-vista faria o
        // popover lembrar de um caminho que quem fechou já abandonou.
        if (!next) {
          setVista('menu')
        }
        setOpen(next)
      }}
      trigger={
        <button
          type="button"
          aria-label={appCopy.entry.moreActions}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          <MoreIcon size={18} />
        </button>
      }
    >
      {vista === 'piles' ? (
        <ActionMenuPanel>
          <div className="flex flex-col gap-2">
            <ActionMenuBack onClick={() => setVista('menu')} />
            <EntryPiles entry={entry} />
          </div>
        </ActionMenuPanel>
      ) : vista === 'confirmar' ? (
        /**
         * Tirar da biblioteca APAGA a obra, com progresso, nota e log junto —
         * não é o `Remove from pile` de `/piles/:id`, e a copy diz isso com
         * todas as letras (design system, seção 5).
         */
        <ActionMenuConfirm
          title={appCopy.entry.removeTitle}
          body={appCopy.entry.removeBody}
          confirmLabel={appCopy.entry.removeConfirm}
          pending={remove.isPending}
          onCancel={() => setVista('menu')}
          onConfirm={() => remove.mutate(entry.id, { onSuccess: onDeleted })}
        />
      ) : (
        <>
          <ActionMenuItem
            icon={<PileAddIcon />}
            submenu
            onClick={() => setVista('piles')}
          >
            {appCopy.entry.addToPile}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={<TrashIcon />}
            tone="danger"
            onClick={() => setVista('confirmar')}
          >
            {appCopy.entry.remove}
          </ActionMenuItem>
        </>
      )}
    </ActionMenu>
  )
}

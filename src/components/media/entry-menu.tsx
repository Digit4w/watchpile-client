import { useState } from 'react'
import { EditEntrySheet } from '@/components/library/edit-entry-sheet'
import {
  ActionMenu,
  ActionMenuBack,
  ActionMenuConfirm,
  ActionMenuItem,
  ActionMenuLink,
  ActionMenuPanel,
  ActionMenuSeparator,
  MoreIcon,
} from '@/components/menu/action-menu'
import {
  EditIcon,
  OpenIcon,
  PileAddIcon,
  PileRemoveIcon,
  ReorderIcon,
  TrashIcon,
} from '@/components/menu/menu-icons'
import type { Entry } from '@/domain/media'
import { useDeleteEntry } from '@/hooks/mutations/entries/use-delete-entry'
import { useRemovePileEntry } from '@/hooks/mutations/piles/use-remove-pile-entry'
import { appCopy } from '@/lib/copy'
import { EntryPiles } from './entry-piles'
import './entry-menu.css'

type MenuVariant = 'card' | 'row' | 'corner'

/**
 * O botão redondo de vidro da camada de atalhos da carta.
 *
 * Exportado porque o lápis (`entry-actions.tsx`) é irmão dele na mesma camada e
 * tinha a string repetida — que é como dois botões lado a lado começam a
 * divergir. Mora aqui e não lá pra não fechar um ciclo de import.
 *
 * **Ele fica em 32px, e a decisão #8 não o alcança:** a carta tem 133px de
 * largura, e dois alvos de 44 mais o contador não cabem.
 */
/**
 * `wp-card-shortcut` e `pointer-events` gatilhados pelo hover — 07/09/2026,
 * quando a carta inteira virou link.
 *
 * Antes quem ligava e desligava `pointer-events` era a CAMADA (`inset-0`), e
 * era isso que impedia um link esticado de funcionar: no hover ela absorvia o
 * clique da carta inteira, que é justamente quando alguém clica. Agora a camada
 * fica `pointer-events: none` para sempre e quem captura são os DOIS botões,
 * que juntos ocupam ~76×32 no centro.
 *
 * O gatilho por hover é obrigatório: botão invisível com `pointer-events: auto`
 * é um alvo transparente no meio da carta, comendo o clique do link.
 *
 * No toque não há hover, e a classe `wp-card-shortcut` é o que
 * `home-motion.css` usa para religá-los ali.
 */
export const CARD_SHORTCUT =
  'wp-card-shortcut pointer-events-none flex h-8 w-8 items-center justify-center rounded-full bg-glass text-ink backdrop-blur-md transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised group-hover:pointer-events-auto group-focus-within:pointer-events-auto'

/**
 * O `⋯` de uma linha de lista, e ele resolve a **decisão em aberto #8**
 * (07/09/2026, decisão do dono): **44px no toque, 32px no ponteiro**.
 *
 * A regra dos ≥44px da seção 9 é sobre TOQUE. Num ponteiro, 44px numa linha de
 * lista destrói a densidade que a seção 1 chama de feature — e o alvo variar
 * com o breakpoint não tira função de ninguém, que é o que derrubou a outra
 * saída proposta (esconder o `⋯` no toque): a Home não tem modo de exibição pra
 * trocar, então lá a obra ficaria sem ação nenhuma no celular.
 *
 * **`sm:` e não `@media (hover: none)`, de propósito.** O vizinho desta peça na
 * mesma linha é o contador de `entry-progress.tsx`, que já troca de alvo por
 * largura — e dois alvos lado a lado que mudam de tamanho por critérios
 * diferentes discordariam num tablet com mouse. **A VISIBILIDADE é a outra
 * pergunta, e essa é do apontador** (`entry-menu.css`).
 *
 * **A CARTA fica de fora e continua em 32px**, porque ali não há como cumprir:
 * a carta tem 133px de largura, e dois alvos de 44 mais o contador não cabem.
 * Isso está registrado como o resto que a decisão #8 não fecha.
 */
/**
 * O `⋯` da carta COMPACTA, no canto de cima à esquerda.
 *
 * A grade compacta trocava ação por densidade e ficou **sem ação nenhuma** — a
 * decisão registrada era sobre o `+`/`−`, que de fato não cabe em 100px de
 * largura, e o menu nunca foi discutido: ele simplesmente não estava lá. Sem
 * ele não havia como abrir a obra, pô-la numa pilha nem apagá-la sem trocar de
 * modo, e a carta não é link.
 *
 * **32px, e a decisão #8 não o alcança pelo mesmo motivo da carta cheia:** a
 * carta compacta tem 100–112px de largura. Alvo de 44 ali seria 40% da carta.
 */
const TRIGGER_CORNER =
  'wp-corner-menu absolute top-1.5 left-1.5 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm bg-glass text-ink opacity-0 outline-none backdrop-blur-md transition-opacity duration-[var(--motion-chrome)] ease-chrome hover:bg-raised focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ink/50 group-hover:opacity-100'

const TRIGGER_ROW =
  'wp-row-menu flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-faint opacity-0 outline-none transition-[opacity,color,background-color] duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ink/50 group-hover/row:opacity-100 sm:h-8 sm:w-8'

const TRIGGER: Record<MenuVariant, string> = {
  card: CARD_SHORTCUT,
  corner: TRIGGER_CORNER,
  row: TRIGGER_ROW,
}

/**
 * O `⋯` de uma obra — **um só, em três formas**.
 *
 * ── Por que ele é um só ────────────────────────────────────────────────────
 * Ele nasceu na carta e a linha da pilha tinha o dela, com **um item** contra
 * quatro: quem estava no modo de lista não conseguia apagar a obra nem pô-la em
 * outra pilha sem trocar de modo. As listas de `/library` não tinham menu
 * nenhum. Três lugares, três conjuntos de ação diferentes para o mesmo objeto —
 * e nenhuma dessas diferenças tinha sido decidida.
 *
 * A régua é a de `menu/action-menu.tsx`, um nível acima: **peça que aparece em
 * três telas para de ser markup e vira componente**. Aqui o que se unifica não
 * é a forma do painel — aquela já era compartilhada — e sim O QUE ele oferece.
 *
 * ── Em dois níveis ─────────────────────────────────────────────────────────
 * A estrutura do Spotify **desktop**: o menu oferece as ações, e "adicionar à
 * pilha" abre a lista dentro do mesmo painel em vez de empilhar um segundo
 * popover por cima.
 *
 * Remover é destrutivo de verdade: apagar a obra leva junto o log de progresso,
 * que é o histórico inteiro (brief, 3.11). Por isso fica separado por uma
 * divisória, em `danger`, e a confirmação diz isso com todas as letras —
 * diferente da de remover widget, onde nada se perde.
 *
 * `Remove from pile` **não** é `danger` e **não** pede confirmação: ela desfaz
 * com dois cliques (`Add titles`) e não perde dado nenhum. Pedir confirmação
 * pra ação reversível ensina a clicar "sim" sem ler, que é o que torna a
 * confirmação da irreversível inútil.
 *
 * ── O que muda entre as formas é o GATILHO ─────────────────────────────────
 * `card` é o botão redondo de vidro da camada de atalhos da carta cheia;
 * `corner` é o quadrado de vidro no alto à esquerda da carta compacta; `row` é
 * o `⋯` que aparece no hover da linha. O painel e os itens são idênticos.
 */
export function EntryMenu({
  entry,
  pileId,
  reorder,
  variant = 'card',
}: {
  entry: Entry
  /**
   * A pilha em que a obra está sendo mostrada, quando há uma. É o que
   * acrescenta `Remove from pile` — e a ausência dele é o que mantém o item
   * fora da Home e de `/library`, onde não há pilha de onde tirar.
   */
  pileId?: number
  /**
   * Reordenar esta obra dentro do widget que a contém — 10/09/2026, decisão do
   * dono (design system, decisão em aberto 16).
   *
   * **Ausente é o caso comum**, e o item some: em `/library` e na grade de
   * `/piles/:id` não há ordem manual a mexer, e um item que não faz nada é pior
   * que um item a menos. **O precedente já estava neste menu** — `Remove from
   * pile` só existe dentro de uma pilha —, e a régua é *item de menu nasce de
   * ação, não de simetria de layout*.
   *
   * `on` diz se o modo já está ligado, porque **sair é tão explícito quanto
   * entrar**: o mesmo item alterna, em vez de a pessoa ter que adivinhar que
   * clicar fora resolve.
   */
  reorder?: { on: boolean; toggle: () => void }
  variant?: MenuVariant
}) {
  /**
   * O hook roda sempre, com `pileId ?? 0` quando não há pilha — hook não pode
   * ser condicional, e a mutação só é DISPARADA pelo botão, que por sua vez só
   * existe quando `pileId` existe. O `0` nunca chega ao servidor.
   */
  const removeFromPile = useRemovePileEntry(pileId ?? 0)
  const remove = useDeleteEntry()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'piles' | 'confirm'>('menu')
  /**
   * A folha de editar é IRMÃ do menu, não uma vista dentro dele: três campos
   * não cabem num painel de 256px, e o peso do formulário acompanha o objeto —
   * obra ganha folha (design system, seção 5). Abrir uma FECHA o outro, senão
   * o popover fica de pé atrás da folha modal, ancorado num gatilho que a
   * folha cobriu.
   */
  const [editing, setEditing] = useState(false)

  return (
    <>
      <ActionMenu
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setView('menu')
          }
          setOpen(next)
        }}
        align={variant === 'row' ? 'end' : 'center'}
        trigger={
          <button
            type="button"
            className={TRIGGER[variant]}
            aria-label={appCopy.entry.moreActions}
            title={appCopy.entry.moreActions}
          >
            <MoreIcon size={variant === 'row' ? 16 : 14} />
          </button>
        }
      >
        {view === 'piles' ? (
          <ActionMenuPanel>
            <div className="flex flex-col gap-2">
              <ActionMenuBack onClick={() => setView('menu')} />
              <EntryPiles entry={entry} />
            </div>
          </ActionMenuPanel>
        ) : view === 'confirm' ? (
          <ActionMenuConfirm
            title={appCopy.entry.removeTitle}
            body={appCopy.entry.removeBody}
            confirmLabel={appCopy.entry.removeConfirm}
            pending={remove.isPending}
            onCancel={() => setView('menu')}
            onConfirm={() => remove.mutate(entry.id)}
          />
        ) : (
          <>
            {/* **Primeiro, e é um LINK** (pedido do dono, 07/09/2026).
             *
             * A carta salva linka só pelo TÍTULO, porque a camada de atalhos é
             * `inset-0` e usa `opacity` — um link esticado por baixo dela seria
             * bloqueado no clique. A carta de resultado de busca, que não tem
             * essa camada, é link inteiro. **As duas se comportam diferente, e
             * este item é o que dá à salva um caminho até o detalhe que não seja
             * um alvo de texto pequeno** — no toque, onde os atalhos aparecem sem
             * hover, ele é o caminho mais óbvio que existe.
             *
             * Ele passa no teste que derrubou o `Duplicate` de `/piles`: item de
             * menu nasce de ação, não de simetria de layout. E vem antes da
             * divisória de tudo, porque ir a um lugar não é agir sobre a obra. */}
            <ActionMenuLink
              icon={<OpenIcon />}
              to="/library/$entryId"
              params={{ entryId: String(entry.id) }}
            >
              {appCopy.entry.viewDetails}
            </ActionMenuLink>

            <ActionMenuSeparator />

            {/* Editar vem antes de empilhar porque fala da OBRA, e empilhar fala
             * de onde ela está. Não é `submenu`: ela abre uma folha, não uma
             * vista deste painel. */}
            <ActionMenuItem
              icon={<EditIcon />}
              onClick={() => {
                setOpen(false)
                setEditing(true)
              }}
            >
              {appCopy.entry.edit}
            </ActionMenuItem>

            <ActionMenuItem
              icon={<PileAddIcon />}
              submenu
              onClick={() => setView('piles')}
            >
              {appCopy.entry.addToPile}
            </ActionMenuItem>

            {/* Depois de `Add to pile` porque as duas falam de ONDE a obra
             * está — uma de qual caixa, outra de que lugar dentro dela. */}
            {reorder && (
              <ActionMenuItem
                icon={<ReorderIcon />}
                onClick={() => {
                  setOpen(false)
                  reorder.toggle()
                }}
              >
                {reorder.on
                  ? appCopy.entry.reorderDone
                  : appCopy.entry.reorderInWidget}
              </ActionMenuItem>
            )}

            {/* Só existe DENTRO de uma pile, e some outside dela — item de menu
             * nasce de ação, não de simetria de layout (design system, seção 5).
             * Na Home e em `/library` não há pilha de onde tirar. */}
            {pileId !== undefined && (
              <ActionMenuItem
                icon={<PileRemoveIcon />}
                disabled={removeFromPile.isPending}
                onClick={() => removeFromPile.mutate(entry.id)}
              >
                {appCopy.entry.removeFromPile}
              </ActionMenuItem>
            )}

            <ActionMenuSeparator />

            <ActionMenuItem
              icon={<TrashIcon />}
              tone="danger"
              onClick={() => setView('confirm')}
            >
              {appCopy.entry.remove}
            </ActionMenuItem>
          </>
        )}
      </ActionMenu>

      <EditEntrySheet entry={entry} open={editing} onOpenChange={setEditing} />
    </>
  )
}

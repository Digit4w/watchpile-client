import { useEffect, useState } from 'react'
import type { ViewMode } from '@/domain/library-view'
import { DEFAULT_VIEW, VIEW_MODES } from '@/domain/library-view'
import type { PileViewMode } from '@/domain/pile-view'
import { DEFAULT_PILE_VIEW, PILE_VIEW_MODES } from '@/domain/pile-view'

/**
 * O modo de exibição de uma tela de listagem.
 *
 * Mora em `localStorage`, e **não na URL** como o recorte — a diferença é de
 * natureza, não de gosto (client/CLAUDE.md, tabela de estado). Filtro, busca e
 * ordenação são o que se está vendo, e um link com eles diz algo a quem
 * recebe; modo de exibição é **densidade**, preferência daquele aparelho.
 * Escolher lista compacta no monitor grande não deve virar lista compacta no
 * telefone da mesma conta.
 *
 * A leitura acontece num efeito e não no `useState` inicial, mesmo motivo de
 * `use-collapsed-sidebar.ts`: no Electron e num SSR futuro não há `window` no
 * primeiro render. O primeiro quadro mostra o default, que é honesto.
 *
 * **Uma chave por tela, e não uma só pro app.** O inventário de modos é do
 * objeto (design system, seção 5): `/library` tem quatro e `/piles` três, e
 * uma chave compartilhada guardaria `compact-grid` numa tela que não o
 * oferece — o `includes` abaixo cairia no default e a escolha da outra tela
 * pareceria esquecida.
 */
export function useStoredViewMode<Mode extends ViewMode>(
  storageKey: string,
  allowed: readonly Mode[],
  fallback: Mode,
): [Mode, (next: Mode) => void] {
  const [mode, setMode] = useState<Mode>(fallback)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey)
      // Validado contra a lista, não confiado: o valor vem de um storage que o
      // usuário edita e que sobrevive a uma versão em que o modo deixou de
      // existir. Sem isto, um valor velho renderiza nada.
      if (stored && (allowed as readonly string[]).includes(stored)) {
        setMode(stored as Mode)
      }
    } catch {
      // modo privado ou storage bloqueado: segue com o default
    }
    // `allowed` e `fallback` são constantes de módulo; o efeito depende só da
    // chave, que é o que muda entre uma tela e outra.
  }, [storageKey, allowed])

  function choose(next: Mode) {
    setMode(next)
    try {
      window.localStorage.setItem(storageKey, next)
    } catch {
      // não poder lembrar não é motivo pra não obedecer agora
    }
  }

  return [mode, choose]
}

/**
 * `/piles/:id` chama `useStoredViewMode` direto, com chave própria — os quatro
 * modos dela são os MESMOS de `/library` (o inventário é do objeto, e o objeto
 * é obra), mas a preferência não: quem lê a biblioteca em lista compacta pode
 * querer a pilha em grade, e uma chave compartilhada colaria as duas.
 */
export function useViewMode() {
  return useStoredViewMode<ViewMode>(
    'watchpile:library-view',
    VIEW_MODES,
    DEFAULT_VIEW,
  )
}

export function usePileViewMode() {
  return useStoredViewMode<PileViewMode>(
    'watchpile:piles-view',
    PILE_VIEW_MODES,
    DEFAULT_PILE_VIEW,
  )
}

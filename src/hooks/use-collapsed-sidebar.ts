import { useState } from 'react'

const KEY = 'watchpile:sidebar-collapsed'

/**
 * Lida no primeiro render, e não num efeito — 07/09/2026.
 *
 * **`AppShell` é montado DENTRO de cada rota**, então toda navegação o remonta.
 * Com a leitura num efeito o primeiro quadro saía sempre em `w-60`, e a barra
 * recolhida ANIMAVA de 240px até 64 a cada ida e volta entre a Home e a
 * `/library` — os 220ms de `--motion-chrome` fazendo questão de mostrar o
 * defeito. Estado que já se conhece antes de pintar não se descobre depois.
 *
 * **A justificativa antiga era falsa**: dizia que o Electron não tem `window`
 * no primeiro render. Tem — o renderer é Chromium, e é ele que carrega esta
 * SPA. O que não teria é um SSR, que este projeto não tem e que o
 * `typeof window` abaixo cobre de qualquer forma.
 */
function readCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(KEY) === 'true'
  } catch {
    // modo privado ou storage bloqueado: segue com o default
    return false
  }
}

/**
 * Se a sidebar está recolhida.
 *
 * Mora em `localStorage` e não na URL nem no servidor: é **preferência daquele
 * aparelho** (client/CLAUDE.md, tabela de estado). Recolher no notebook de
 * 13" não deve recolher no monitor grande da mesma conta, e ninguém
 * compartilha um link esperando que o outro veja a barra do mesmo jeito.
 *
 * O gatilho é manual, nunca automático por breakpoint (decidido em
 * `design/mockups/home.html`, 23/08/2026): barra que se recolhe sozinha ao
 * redimensionar a janela desfaz a escolha de quem a abriu.
 */
export function useCollapsedSidebar(): [boolean, () => void] {
  // Inicializador preguiçoso: a função roda uma vez, no primeiro render, em vez
  // de a cada um deles.
  const [collapsed, setCollapsed] = useState(readCollapsed)

  function toggle() {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(KEY, String(next))
      } catch {
        // não poder lembrar não é motivo pra não obedecer agora
      }
      return next
    })
  }

  return [collapsed, toggle]
}

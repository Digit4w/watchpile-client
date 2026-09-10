import { useState } from 'react'
import type { RememberedScope } from '@/domain/search-memory'
import { rememberedScope } from '@/domain/search-memory'
import type { TypeSources } from '@/domain/search-scope'

const KEY = 'watchpile:search-scope'

/**
 * O escopo com que `/search` abre quando a URL não diz — 10/09/2026.
 *
 * **Preferência daquele APARELHO**, então `localStorage`, como a sidebar
 * recolhida e o modo de exibição (client/CLAUDE.md, tabela de estado). A URL
 * continua dona: isto só semeia o padrão, e escolher escopo continua escrevendo
 * nela.
 *
 * ── Por que a leitura é SÍNCRONA, ao contrário de `useStoredViewMode` ───────
 * Aquele hook lê num efeito de propósito, e o motivo dele é bom (sem `window`
 * no primeiro render de um SSR futuro). Aqui a conta é outra, e por isso o
 * `typeof window` aparece explícito em vez de o efeito resolvê-lo: **modo de
 * exibição é densidade, escopo é o que a tela vai PERGUNTAR**. Lido num efeito,
 * o primeiro quadro renderiza `movie`/TMDB e o segundo troca pra `anime`/Jikan
 * — e *peça que sai sozinha se lê como defeito* (04/09). O caso não é teórico:
 * chegando de `/library`, o vocabulário já está em cache e o primeiro quadro
 * tem tudo de que precisa pra decidir errado.
 *
 * ── Só GESTO escreve, nunca chegada ────────────────────────────────────────
 * Quem grava são `onScope` e `onSource`, e não o escopo com que a tela abriu:
 * um link compartilhado carrega o escopo de **outra pessoa**, e deixá-lo gravar
 * faria um link recebido reescrever a preferência de quem o abriu. É a régua do
 * chip ativo lida do outro lado — o que a pessoa escolheu é dela, e o que veio
 * de fora vale só pela visita.
 *
 * O valor guardado **não é confiável sozinho** e nunca é usado cru: quem o
 * valida contra o vocabulário de agora é `rememberedScope`, que é regra pura e
 * tem spec.
 */
export function useRememberedScope(
  sourceByType: ReadonlyMap<string, TypeSources>,
): [RememberedScope | null, (next: RememberedScope) => void] {
  /**
   * Guardado como estado, e o inicializador roda **uma vez**: reler o storage a
   * cada render faria a escrita de baixo voltar como leitura no mesmo quadro, e
   * o valor da URL — que é quem manda — perderia a corrida contra o próprio
   * eco.
   */
  const [raw, setRaw] = useState<string | null>(read)

  function remember(next: RememberedScope) {
    const value = JSON.stringify(next)
    setRaw(value)
    try {
      window.localStorage.setItem(KEY, value)
    } catch {
      // não poder lembrar não é motivo pra não obedecer agora
    }
  }

  return [rememberedScope(raw, sourceByType), remember]
}

function read(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    // modo privado ou storage bloqueado: segue com o padrão da tela
    return null
  }
}

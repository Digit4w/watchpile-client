/**
 * Em qual faixa de idade uma notificação cai — `today`, `week` ou `earlier`.
 *
 * **Devolve a CHAVE, nunca o rótulo.** Traduzir é da tela, e uma regra de
 * domínio que devolvesse "Today" seria copy nascendo fora do catálogo — o mesmo
 * erro que o servidor não comete ao devolver `kind` em vez de frase.
 *
 * O agrupamento existe porque oito datas relativas seguidas não dizem onde o
 * dia de ontem acaba. Ele **não é controle**: não liga nem desliga, então não
 * gasta chrome.
 *
 * Formatar continua sendo de `lib/format.ts` — a primeira versão disto trazia
 * um `relativeTime` próprio, que era a segunda cópia de uma peça que já existia
 * lá desde `/piles`. Foi ela que fez a data sair em português numa tela cuja
 * copy é inglesa, porque a cópia nova não passava pelo `LOCALE`.
 */
export type AgeBucket = 'today' | 'week' | 'earlier'

const DAY_MS = 1000 * 60 * 60 * 24

export function ageBucket(iso: string, now = Date.now()): AgeBucket {
  const at = new Date(iso).getTime()
  /**
   * Carimbo ilegível cai em `earlier`, e não em `today`: o fundo da lista é
   * onde ele estraga menos — no topo, empurraria o que de fato é de hoje pra
   * baixo de uma linha que nem data tem.
   */
  if (Number.isNaN(at)) {
    return 'earlier'
  }

  const age = now - at
  if (age < DAY_MS) {
    return 'today'
  }
  return age < DAY_MS * 7 ? 'week' : 'earlier'
}

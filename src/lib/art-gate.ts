/**
 * Quantas imagens da nossa origem carregam ao mesmo tempo — 15/09/2026.
 *
 * ── Por que isto existe ─────────────────────────────────────────────────────
 * O servidor fala HTTP/1.1, e o navegador abre no máximo **seis conexões por
 * origem**. Arte fria segura a conexão enquanto o servidor espera cota do
 * provedor — medido com o aquecimento rodando: **p50 10 s, p90 14 s**. Uma
 * grade de cartas ocupava as seis, e o chunk da próxima rota ficava na fila
 * atrás delas: a URL trocava, a sidebar acendia a rota nova, e a tela seguia na
 * antiga por 9 a 30 s. Era o bug "a URL troca e a rota não" (HANDOFF).
 *
 * **Quatro, e o número é o que SOBRA:** seis conexões menos duas livres para o
 * que a navegação precisa — o chunk da rota e a consulta dela. Com quatro
 * imagens lentas em voo, a próxima tela nunca espera por imagem.
 *
 * ── Por que fila e não prioridade ───────────────────────────────────────────
 * O Chrome já despacha script e `fetch` antes de imagem — mas só quando uma
 * conexão LIBERA. Prioridade não adianta nada se as seis estão presas por dez
 * segundos; o que adianta é nunca deixar as seis serem de imagem.
 */

export const ART_SLOTS = 4

export type ArtGate = {
  /**
   * Pede uma vaga. `onGranted` roda quando ela sai — na hora, se houver vaga.
   *
   * Devolve a função que **devolve a vaga ou desiste da fila**, conforme o
   * caso: quem chama não precisa saber se chegou a ser atendido, e é isso que
   * deixa o `cleanup` de um efeito ser uma linha só.
   */
  request: (onGranted: () => void) => () => void
}

export function createArtGate(slots = ART_SLOTS): ArtGate {
  let active = 0
  const waiting: Array<{ grant: () => void }> = []

  const next = () => {
    while (active < slots && waiting.length > 0) {
      const ticket = waiting.shift()
      if (ticket) {
        active += 1
        ticket.grant()
      }
    }
  }

  return {
    request(onGranted) {
      let state: 'waiting' | 'granted' | 'done' = 'waiting'
      const ticket = {
        grant: () => {
          state = 'granted'
          onGranted()
        },
      }
      waiting.push(ticket)
      next()

      return () => {
        if (state === 'granted') {
          active -= 1
          state = 'done'
          next()
          return
        }
        if (state === 'waiting') {
          const index = waiting.indexOf(ticket)
          if (index >= 0) {
            waiting.splice(index, 1)
          }
          state = 'done'
        }
      }
    },
  }
}

/**
 * A fila do app — uma só, porque as seis conexões são uma só por origem.
 * Duas filas seriam oito imagens em voo.
 */
export const artGate = createArtGate()

/**
 * A imagem compete pelas nossas conexões?
 *
 * **O critério é a ORIGEM, não o tipo de arte**, e isso preserva o que
 * `RemoteArt` sempre foi: ele não sabe se a arte é emprestada (hotlink da CDN
 * do provedor) ou adquirida (nossa rota de cache), e continua não sabendo. O
 * que ele passa a saber é um fato do NAVEGADOR — requisição para a própria
 * origem divide a fila de conexões com o resto do app —, e a CDN de terceiro
 * tem as seis dela.
 */
export function sharesOurConnections(src: string, base: string): boolean {
  try {
    return new URL(src, base).origin === new URL(base).origin
  } catch {
    return false
  }
}

import { useEffect, useRef, useState } from 'react'

/**
 * Um número que SOBE até o valor recebido, em vez de saltar até ele.
 *
 * ── Por que isto não é enfeite, e por que não é mentira ─────────────────────
 * O contador do import vem de um poll de 2s, e o executor escreve os contadores
 * uma vez por lote de 200 obras. Na tela isso é `0`, dois segundos parado,
 * `400`, dois segundos parado. O trabalho é contínuo e a leitura dele é aos
 * trancos — o número certo, com o ritmo errado.
 *
 * **Ele nunca afirma progresso que não aconteceu**, e é isso que o autoriza: a
 * animação vai do valor ANTERIOR ao ATUAL, os dois já confirmados pelo
 * servidor, e todos os valores no meio já foram verdade em algum instante entre
 * as duas respostas. Ele re-temporiza números que já existiram; não adivinha os
 * que virão.
 *
 * Por isso também **não extrapola**: chegando ao alvo, ele para e espera. Uma
 * animação que continuasse subindo "porque provavelmente continua" mostraria
 * obra importada que não foi, e o número deixaria de ser conferível contra a
 * fonte — que é o defeito que este ciclo encontrou do jeito difícil.
 *
 * ── Movimento reduzido ─────────────────────────────────────────────────────
 * Isto é ambiente, não transição de estado: quem pede menos movimento recebe o
 * número direto (design system, seção 11).
 */
export function useClimbingNumber(target: number, durationMs = 2000): number {
  const [value, setValue] = useState(target)
  const frame = useRef<number | null>(null)
  const from = useRef(target)
  /**
   * O que está NA TELA agora, num ref.
   *
   * Sem ele a limpeza leria o `value` do estado, e a regra de dependências
   * exigiria `value` na lista — o que reiniciaria a animação a cada quadro. Um
   * ref é a resposta certa, não uma supressão: o valor é lido, nunca observado.
   */
  const shown = useRef(target)

  useEffect(() => {
    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    /**
     * Andar pra trás não se anima: um contador que desce é outra coisa
     * acontecendo (um job novo começou, a tela trocou de job), e deslizar até lá
     * contaria uma história falsa sobre a mesma importação.
     */
    if (reduced || target <= from.current) {
      from.current = target
      shown.current = target
      setValue(target)
      return
    }

    const startedAt = performance.now()
    const origin = from.current
    const distance = target - origin

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs)
      const current = Math.round(origin + distance * t)
      shown.current = current
      setValue(current)

      if (t < 1) {
        frame.current = requestAnimationFrame(step)
        return
      }
      from.current = target
    }

    frame.current = requestAnimationFrame(step)

    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current)
      }
      /**
       * Desmontar no meio da subida deixa o ponto de partida onde a animação
       * parou, e não onde ela ia chegar: remontar depois recomeça do que a
       * pessoa viu por último, sem um salto que ninguém pediu.
       */
      from.current = shown.current
    }
  }, [target, durationMs])

  return value
}

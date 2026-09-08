import { useEffect, useState } from 'react'

/**
 * Segura um valor até ele parar de mudar.
 *
 * Existe pela busca de `/library`: sem isso cada tecla vira um `GET`, e o que
 * chega de volta são respostas de prefixos já obsoletos disputando a lista. O
 * valor da CAIXA continua imediato — quem espera é só a consulta.
 *
 * O atraso é curto de propósito: o servidor é local (brief, 3.1), então o
 * custo de errar pra mais é sensação de lentidão numa tela onde não há
 * latência de rede pra justificá-la.
 */
export function useDebounced<T>(value: T, delayMs = 250): T {
  const [delayed, setDelayed] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDelayed(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return delayed
}

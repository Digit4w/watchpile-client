import { useEffect, useRef, useState } from 'react'

/**
 * Quanto tempo de espera precisa passar antes de valer a pena admitir que se
 * está esperando. Abaixo disso ninguém percebe demora, então o esqueleto não
 * informa nada — só inventa movimento.
 *
 * O número importa mais aqui do que num app de rede: o Watchpile é
 * self-hosted, o SQLite é um arquivo (brief, 3.1), e a resposta típica volta
 * em poucos milissegundos. O caso COMUM é a espera que não se vê.
 */
const ATRASO_MS = 200

/**
 * E, uma vez que apareceu, quanto tempo ele fica no mínimo.
 *
 * Sem este segundo número o limiar só muda o endereço da piscada: uma resposta
 * que chega em 210ms mostraria o esqueleto por 10ms. Quem passou do limiar
 * merece ver o estado inteiro, não um relance dele.
 */
const MINIMO_MS = 300

/**
 * Segura o estado de carregando até ele valer a pena.
 *
 * Não é animação, e por isso não sai dos tokens de movimento (design system,
 * seção 11): aqueles são a DURAÇÃO de uma transição, estes são o limiar de
 * percepção que decide se a transição acontece. São dois números novos, e o
 * lugar deles no design system ainda precisa ser decidido — por ora moram aqui,
 * num arquivo só, em vez de espalhados por componente.
 */
export function useDelayedPending(pending: boolean): boolean {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef<number | null>(null)

  useEffect(() => {
    if (pending) {
      const id = setTimeout(() => {
        shownAt.current = Date.now()
        setVisible(true)
      }, ATRASO_MS)
      // Se a resposta chegar antes, o timer morre aqui e o esqueleto nunca
      // existiu — que é o caminho que quase toda requisição local percorre.
      return () => clearTimeout(id)
    }

    if (shownAt.current === null) {
      setVisible(false)
      return
    }

    const remaining = MINIMO_MS - (Date.now() - shownAt.current)
    if (remaining <= 0) {
      shownAt.current = null
      setVisible(false)
      return
    }

    const id = setTimeout(() => {
      shownAt.current = null
      setVisible(false)
    }, remaining)
    return () => clearTimeout(id)
  }, [pending])

  return visible
}

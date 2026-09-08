import { useState } from 'react'
import { ArtTile } from './entry-art'

/**
 * Uma imagem com o ladrilho da inicial como chão, venha ela de onde vier.
 *
 * **Serve as DUAS artes, e a diferença não está aqui** (brief, 3.10): a
 * EMPRESTADA, do resultado de busca, é hotlink direto da CDN do provedor; a
 * ADQUIRIDA, da obra que a pessoa tem, vem da nossa rota de cache. Quem decide
 * qual é o servidor, que manda o endereço pronto — este componente só desenha
 * o que recebe, e é por isso que ele não precisou mudar quando o cache nasceu.
 *
 * `no-referrer` porque no caso emprestado o navegador de quem usa fala direto
 * com a CDN, e o referer seria informação a mais de graça. No caso adquirido é
 * mesma origem e não custa nada — o atributo não distingue os dois porque o
 * componente também não distingue.
 *
 * **Erro cai no ladrilho, não em ícone quebrado.** URL que envelheceu, CDN
 * fora do ar e provedor sem molde chegam todos aqui como a mesma coisa: não há
 * imagem, e o fallback do sistema é a inicial sobre o degradê.
 */
export function RemoteArt({
  src,
  title,
  className,
  eager = false,
}: {
  src: string | null
  title: string
  className?: string
  /**
   * Carregar já, sem esperar a rolagem.
   *
   * **Obrigatório onde o `src` PODE TROCAR com o elemento montado** — e não é
   * otimização, é correção: `loading="lazy"` num `<img>` que o navegador já
   * resolveu **não reavalia quando o `src` muda**, e a imagem nova fica pendente
   * pra sempre. Medido em 02/09/2026 no preview de troca de fonte: uma
   * `new Image()` com a mesma URL carregava em 11ms enquanto o `<img>` da
   * página seguia em `complete: false` depois de seis segundos; trocar o
   * atributo pra `eager` resolveu na hora.
   *
   * Fora daí o padrão continua sendo preguiçoso, que é o certo numa grade de
   * dezenas de cartas.
   */
  eager?: boolean
}) {
  /**
   * QUAL `src` falhou, e não SE falhou.
   *
   * Como booleano ele nunca voltava atrás: uma URL que falhasse marcava o
   * componente pra sempre, e todo `src` seguinte caía no ladrilho sem sequer
   * ser tentado. Guardando a URL, a comparação se desfaz sozinha quando ela
   * muda — sem efeito e sem `key` no chamador.
   */
  const [failed, setFailed] = useState<string | null>(null)

  if (!src || failed === src) {
    return <ArtTile title={title} className={className} />
  }

  return (
    <img
      src={src}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(src)}
      className={`object-cover ${className ?? ''}`}
    />
  )
}

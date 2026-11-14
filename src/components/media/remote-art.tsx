import { useEffect, useRef, useState } from 'react'
import { artGate, sharesOurConnections } from '@/lib/art-gate'
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
 *
 * **Imagem da nossa origem espera vaga — 15/09/2026** (`lib/art-gate.ts`).
 * Arte fria segura conexão por 10–15 s, e uma grade delas ocupava as seis que o
 * navegador abre por origem: o chunk da próxima rota ficava na fila e a tela não
 * trocava. Continua valendo que este componente não sabe se a arte é emprestada
 * ou adquirida — o critério é a origem, que é fato do navegador.
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

  const gated =
    typeof window !== 'undefined' &&
    sharesOurConnections(src, window.location.href)

  if (!gated) {
    return (
      <ArtImage
        src={src}
        loading={eager ? 'eager' : 'lazy'}
        className={className}
        onError={() => setFailed(src)}
      />
    )
  }

  /**
   * **`key={src}`** é o que refaz a espera quando o endereço troca: a vaga e o
   * download eram do `src` antigo, e o componente novo começa do zero — o que
   * também cobre o caso de `eager`, sem depender do `loading` do navegador.
   */
  return (
    <GatedArt
      key={src}
      src={src}
      eager={eager}
      className={className}
      onError={() => setFailed(src)}
    />
  )
}

/**
 * A imagem da nossa origem: perto da tela, com vaga, baixada por `fetch`.
 *
 * **Perto da tela antes de pedir vaga**, porque a fila sem isso seria pior que
 * o `lazy` que ela substitui: a grade virtualizada monta quatro linhas acima e
 * quatro abaixo da dobra (`domain/grid-window.ts`), e as de cima nascem PRIMEIRO
 * no DOM — pediriam vaga antes das que a pessoa está olhando.
 *
 * **`fetch` e não `<img src>`, e é o que faz a vaga valer.** A primeira versão
 * desta fila punha o `src` no `<img>` ao ganhar a vaga e a devolvia ao
 * desmontar — supondo que tirar o `<img>` da tela cancelasse o download. **Não
 * cancela**, e isso foi medido no mesmo dia: com a arte presa 10 s por um proxy,
 * as quatro imagens da tela anterior terminaram os 10 s inteiros depois de a
 * rota trocar, somaram-se às quatro da tela nova, e o chunk de `/piles` esperou
 * 9,5 s na fila de novo. A vaga era devolvida; a conexão, não. `AbortController`
 * cancela a requisição de verdade, e é por isso que desmontar agora libera as
 * duas coisas juntas.
 *
 * O `fetch` passa pelo cache HTTP do navegador como o `<img>` passaria, então a
 * arte quente continua chegando do cache. O que muda é que a imagem é desenhada
 * a partir de um `blob:` — revogado ao desmontar, senão cada carta que a
 * virtualização tira deixaria os bytes presos na memória.
 *
 * **Sem `src` enquanto espera:** o lugar fica vazio como ficava durante o
 * carregamento de antes — nada de inicial piscando antes da arte, que numa arte
 * quente (11 ms) seria só ruído.
 */
function GatedArt({
  src,
  eager,
  className,
  onError,
}: {
  src: string
  eager: boolean
  className?: string
  onError: () => void
}) {
  const holder = useRef<HTMLDivElement | null>(null)
  const [near, setNear] = useState(eager)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  // `onError` muda de identidade a cada render do pai; o download não pode
  // recomeçar por isso.
  const reportError = useRef(onError)
  reportError.current = onError

  useEffect(() => {
    if (near) {
      return
    }
    const element = holder.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    /**
     * `200px` de margem é a folga do `lazy` do Chrome em conexão rápida, na
     * mesma ordem de grandeza: a arte começa a vir um pouco antes de a carta
     * entrar, e não uma dobra inteira antes.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [near])

  useEffect(() => {
    if (!near) {
      return
    }

    const controller = new AbortController()
    let created: string | null = null

    /**
     * **Declarado ANTES de pedir a vaga, e não é estilo.** Com vaga livre a
     * fila chama o callback DENTRO de `request()`, antes de ela devolver — e
     * `const release = artGate.request(...)` ainda não existe nesse instante.
     * A primeira versão lia `release` ali e derrubava a tela inteira com
     * "Cannot access before initialization", no build de produção.
     */
    let release = () => {}
    release = artGate.request(() => {
      fetch(src, { signal: controller.signal, referrerPolicy: 'no-referrer' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`art ${response.status}`)
          }
          return response.blob()
        })
        .then((blob) => {
          created = URL.createObjectURL(blob)
          setObjectUrl(created)
        })
        .catch(() => {
          // Abortar é desmontar: não há tela a quem avisar.
          if (!controller.signal.aborted) {
            reportError.current()
          }
        })
        // A vaga sai quando os BYTES chegaram (ou falharam), não quando o
        // `<img>` decodifica — decodificar não ocupa conexão. Arrow e não
        // `.finally(release)`: aqui dentro, com vaga concedida na hora,
        // `release` ainda é o no-op de cima, e passá-lo direto nunca
        // devolveria a vaga.
        .finally(() => release())
    })

    return () => {
      controller.abort()
      release()
      if (created) {
        URL.revokeObjectURL(created)
      }
    }
  }, [near, src])

  if (!objectUrl) {
    return (
      <div
        ref={holder}
        aria-hidden="true"
        className={className}
        data-art-waiting=""
      />
    )
  }

  return (
    <ArtImage
      src={objectUrl}
      loading="eager"
      className={className}
      onError={onError}
    />
  )
}

function ArtImage({
  src,
  loading,
  className,
  onError,
}: {
  src: string
  loading: 'eager' | 'lazy'
  className?: string
  onError: () => void
}) {
  return (
    <img
      src={src}
      alt=""
      loading={loading}
      /**
       * **Decodificar fora da tarefa que renderiza** — 13/09/2026.
       *
       * O padrão é `auto`, e nele o navegador pode decodificar de forma
       * síncrona enquanto monta a página — com uma grade inteira chegando de
       * uma vez, isso entra na mesma tarefa que já está criando as cartas.
       *
       * O peso é real e foi medido: os pôsteres chegam em 315×450 a 422×600 e
       * aparecem em 147×210, o que dá **66 MB de bitmap** para 70 cartas. Não
       * é o número de pixels que isto conserta — é o momento em que eles são
       * pagos, que deixa de ser o quadro em que a pessoa está olhando.
       */
      decoding="async"
      referrerPolicy="no-referrer"
      onError={onError}
      className={`object-cover ${className ?? ''}`}
    />
  )
}

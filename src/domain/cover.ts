/**
 * O recorte quadrado da capa de pilha, em regra pura.
 *
 * **Quem redimensiona é o navegador, e isso é decisão de empacotamento**
 * (brief, 3.17, 31/08/2026): `sharp` no servidor seria um segundo módulo
 * nativo além do `better-sqlite3`, dobrando a superfície do
 * `electron:rebuild` a cada release. O servidor valida tipo e tamanho em
 * bytes; a dimensão é responsabilidade daqui.
 *
 * O que mora neste arquivo é só a aritmética — o `canvas` e o `Blob` ficam em
 * `lib/`, porque geometria se testa sem DOM e desenho não.
 */

/**
 * 400 e não os 300 que o design system chutava.
 *
 * O chute é de quando o maior uso era o ladrilho de 150px. O cabeçalho de
 * `/piles/:id` mostra a capa a **200px de lado**, e num display 2× isso são
 * 400 pixels reais — a 300 ela chega mole exatamente onde aparece maior.
 */
export const COVER_SIZE = 400

/** O que o servidor aceita (`piles.cover.routes.ts`). Lista de permissão. */
export const COVER_MAX_BYTES = 2 * 1024 * 1024

export type Rect = {
  x: number
  y: number
  size: number
}

/**
 * O quadrado inicial: o maior que cabe, centrado no eixo que sobra.
 *
 * É o "corta pelo centro" que a folha promete em "Square works best" — e é o
 * ponto de partida do ajuste, não o resultado final: quem arrasta o
 * enquadramento move este quadrado, nunca o redimensiona.
 */
export function centeredSquare(width: number, height: number): Rect {
  const size = Math.min(width, height)
  return {
    x: Math.round((width - size) / 2),
    y: Math.round((height - size) / 2),
    size,
  }
}

/**
 * Mantém o quadrado inteiramente dentro da imagem depois de um arrasto.
 *
 * Prender em vez de recusar: quem arrasta até a borda quer o canto, e um
 * enquadramento que trava um pixel antes dele parece defeito. No eixo em que
 * a imagem já é do tamanho do quadrado o resultado é sempre 0 — não há folga,
 * e não há o que escolher.
 */
export function clampSquare(rect: Rect, width: number, height: number): Rect {
  const size = Math.min(rect.size, width, height)
  return {
    x: Math.min(Math.max(rect.x, 0), width - size),
    y: Math.min(Math.max(rect.y, 0), height - size),
    size,
  }
}

/**
 * Quanto o enquadramento anda na imagem quando o dedo anda na tela.
 *
 * A prévia é sempre um quadrado de lado fixo; a imagem por trás pode ser muito
 * maior ou menor. Sem esta conversão, arrastar 10px numa foto de 4000px moveria
 * o recorte 10 pixels de imagem — um movimento que não sai do lugar.
 */
export function dragToImageScale(rect: Rect, previewSize: number): number {
  return rect.size / previewSize
}

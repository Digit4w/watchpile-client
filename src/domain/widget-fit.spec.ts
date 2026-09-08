import { describe, expect, it } from 'vitest'
import type { GridBox } from './widget-fit'
import {
  clampResize,
  freeSpans,
  placeInRow,
  pushAfterResize,
  resizeRoom,
  snapToRow,
} from './widget-fit'

const COLS = 12
const MIN_W = 2
const MIN_H = 3

const box = (
  i: string,
  x: number,
  y: number,
  w: number,
  h: number,
): GridBox => ({ i, x, y, w, h })

const place = (
  origin: GridBox,
  dragged: GridBox,
  others: GridBox[],
  minW = MIN_W,
) => placeInRow({ origin, dragged, others, cols: COLS, minW })

describe('snapToRow', () => {
  it('gruda na linha cujo alcance vertical contém o y', () => {
    const others = [box('a', 0, 0, 6, 3)]

    expect([0, 1, 2].map((y) => snapToRow(y, others))).toEqual([0, 0, 0])
  })

  it('mede o alcance pelo membro mais baixo, em qualquer ordem', () => {
    // A linha só está inteira enquanto o membro mais baixo dura. Passado isso,
    // o que sobra ao lado do alto é espaço livre e merece linha própria —
    // medir pelo mais alto engolia essa faixa e criava zona morta.
    //
    // As duas ordens importam: com o mais baixo por último, "mais baixo" e
    // "último" dão o mesmo número e o teste não distingue as duas regras.
    const lowLast = [box('alto', 0, 0, 2, 5), box('baixo', 6, 0, 4, 3)]
    const lowFirst = [box('baixo', 6, 0, 4, 3), box('alto', 10, 0, 2, 5)]

    for (const others of [lowLast, lowFirst]) {
      expect([0, 1, 2, 3, 4].map((y) => snapToRow(y, others))).toEqual([
        0, 0, 0, 3, 4,
      ])
    }
  })

  it('devolve o próprio y quando ele não alcança linha nenhuma', () => {
    const others = [box('a', 0, 0, 6, 3)]

    expect(snapToRow(3, others)).toBe(3)
    expect(snapToRow(20, others)).toBe(20)
  })

  it('não inventa linha quando não há widget nenhum', () => {
    expect(snapToRow(7, [])).toBe(7)
  })
})

describe('freeSpans', () => {
  it('acha a lacuna à direita do que está ocupado', () => {
    expect(freeSpans([box('a', 0, 0, 8, 3)], COLS)).toEqual([
      { start: 8, end: 12 },
    ])
  })

  it('acha a lacuna no meio', () => {
    const row = [box('a', 0, 0, 3, 3), box('b', 7, 0, 5, 3)]

    expect(freeSpans(row, COLS)).toEqual([{ start: 3, end: 7 }])
  })

  it('não devolve lacuna quando a linha está cheia', () => {
    const row = [box('a', 0, 0, 5, 3), box('b', 5, 0, 7, 3)]

    expect(freeSpans(row, COLS)).toEqual([])
  })

  it('funde ocupações que se sobrepõem em vez de contar duas vezes', () => {
    const row = [box('a', 0, 0, 6, 3), box('b', 4, 0, 4, 3)]

    expect(freeSpans(row, COLS)).toEqual([{ start: 8, end: 12 }])
  })

  it('a linha inteira é lacuna quando não há ninguém', () => {
    expect(freeSpans([], COLS)).toEqual([{ start: 0, end: 12 }])
  })
})

describe('placeInRow — linha vazia', () => {
  it('ocupa a largura inteira', () => {
    const loose = box('n', 3, 9, 5, 3)

    expect(place(loose, loose, [box('outro', 0, 0, 6, 3)])).toEqual([
      { i: 'n', x: 0, y: 9, w: 12 },
    ])
  })
})

describe('placeInRow — vindo de outra linha', () => {
  const target = [box('a', 6, 0, 4, 3), box('b', 10, 0, 2, 5)]

  it('preenche a lacuna sem tocar em ninguém', () => {
    const origin = box('n', 0, 9, 3, 3)

    expect(place(origin, box('n', 1, 1, 3, 3), target)).toEqual([
      { i: 'n', x: 0, y: 0, w: 6 },
    ])
  })

  it('dá a mesma largura em toda a extensão da linha — sem fronteira fantasma', () => {
    // A regressão do bug relatado em 28/08/2026: o preview piscava entre 6 e
    // 10 colunas dentro da própria linha, conforme o y cruzava o fim do
    // vizinho mais baixo.
    const origin = box('n', 0, 9, 6, 3)
    const widths = [0, 1, 2].map(
      (y) => place(origin, box('n', 0, y, 6, 3), target)?.[0]?.w,
    )

    expect(widths).toEqual([6, 6, 6])
  })

  it('abre linha própria no espaço em L, com as colunas que sobram', () => {
    // A zona morta relatada em 28/08/2026: `y=3` e `y=4` estão embaixo do
    // vizinho de altura 3 e ao lado do de altura 5. Não dá pra ser linha cheia
    // (passaria por cima do alto) nem pra ser engolido pela linha de cima.
    const origin = box('n', 0, 9, 6, 3)
    const gaps = [3, 4].map((y) => place(origin, box('n', 0, y, 6, 3), target))

    expect(gaps).toEqual([
      [{ i: 'n', x: 0, y: 3, w: 10 }],
      [{ i: 'n', x: 0, y: 4, w: 10 }],
    ])
  })

  it('volta a ser largura cheia depois do fim do vizinho alto', () => {
    const origin = box('n', 0, 9, 6, 3)

    expect(place(origin, box('n', 0, 5, 6, 3), target)).toEqual([
      { i: 'n', x: 0, y: 5, w: 12 },
    ])
  })

  it('divide em partes iguais quando não há lacuna', () => {
    const full = [box('f', 0, 0, 12, 4)]
    const origin = box('n', 0, 9, 5, 3)

    expect(place(origin, box('n', 8, 1, 5, 3), full)).toEqual([
      { i: 'f', x: 0, y: 0, w: 6 },
      { i: 'n', x: 6, y: 0, w: 6 },
    ])
  })

  it('recusa quando dividir deixaria alguém abaixo do mínimo', () => {
    const crowded = Array.from({ length: 6 }, (_, k) =>
      box(`w${k}`, k * 2, 0, 2, 3),
    )
    const origin = box('n', 0, 9, 4, 3)

    expect(place(origin, box('n', 4, 1, 4, 3), crowded)).toBeNull()
  })

  it('ignora a lacuna que o cursor não alcança e divide a linha', () => {
    // Lacuna existe em [0,4), mas o widget está solto lá na direita, em cima
    // de quem já ocupa — a intenção aí é dividir, não escorregar pro outro lado.
    const row = [box('a', 4, 0, 8, 3)]
    const origin = box('n', 0, 9, 4, 3)

    expect(place(origin, box('n', 8, 1, 4, 3), row)).toEqual([
      { i: 'a', x: 0, y: 0, w: 6 },
      { i: 'n', x: 6, y: 0, w: 6 },
    ])
  })
})

describe('placeInRow — reordenando dentro da própria linha', () => {
  const a = box('a', 0, 0, 6, 3)
  const b = box('b', 6, 0, 4, 3)
  const c = box('c', 10, 0, 2, 3)

  it('leva pro fim preservando a largura de cada um', () => {
    expect(place(a, { ...a, x: 11 }, [b, c])).toEqual([
      { i: 'b', x: 0, y: 0, w: 4 },
      { i: 'c', x: 4, y: 0, w: 2 },
      { i: 'a', x: 6, y: 0, w: 6 },
    ])
  })

  it('leva pro meio', () => {
    expect(place(a, { ...a, x: 5 }, [b, c])).toEqual([
      { i: 'b', x: 0, y: 0, w: 4 },
      { i: 'a', x: 4, y: 0, w: 6 },
      { i: 'c', x: 10, y: 0, w: 2 },
    ])
  })

  it('usa o centro do widget, não a borda esquerda', () => {
    // Um widget de 6 colunas com a borda em 5 cobre até 11: já passou o `b`
    // inteiro. Comparar a borda o devolvia pra antes dele.
    const byTheEdge = place(a, { ...a, x: 5 }, [b, c])?.map(({ i }) => i)

    expect(byTheEdge).toEqual(['b', 'a', 'c'])
  })

  it('parado no lugar não muda nada', () => {
    expect(place(a, a, [b, c])).toEqual([
      { i: 'a', x: 0, y: 0, w: 6 },
      { i: 'b', x: 6, y: 0, w: 4 },
      { i: 'c', x: 10, y: 0, w: 2 },
    ])
  })

  it('reordenar não redimensiona ninguém', () => {
    const widths = place(a, { ...a, x: 11 }, [b, c])?.map(({ w }) => w)

    expect(widths?.reduce((total, w) => total + w, 0)).toBe(COLS)
    expect([...(widths ?? [])].sort()).toEqual([2, 4, 6])
  })
})

describe('clampResize — para a direita', () => {
  const target = box('n', 0, 0, 6, 3)
  const room = (requested: GridBox, others: GridBox[]) =>
    clampResize({
      box: requested,
      others,
      cols: COLS,
      minW: MIN_W,
      minH: MIN_H,
      towards: 'right',
      edge: target.x,
    })

  it('empurra o companheiro de linha enquanto ele couber', () => {
    // Companheiro de 4 colunas numa linha de 12: o alvo pode ir até 8 e o
    // companheiro escorrega pro fim da linha.
    expect(room({ ...target, w: 12 }, [box('a', 6, 0, 4, 3)]).w).toBe(8)
  })

  it('para quando a linha não tem mais folga', () => {
    const full = [box('a', 6, 0, 4, 3), box('b', 10, 0, 2, 3)]

    expect(room({ ...target, w: 12 }, full).w).toBe(6)
  })

  it('trata quem está ACIMA como parede, não como empurrável', () => {
    // Mesmo `y` seria empurrável; `y` MENOR cruzando a faixa é parede — a
    // compactação já encostou esse widget no que vem antes dele.
    expect(room(box('n', 0, 2, 12, 3), [box('a', 8, 0, 4, 5)]).w).toBe(8)
  })

  it('limita eixo a eixo: travar a largura não trava a altura', () => {
    // Sem isso o gesto inteiro era rejeitado, e encostar no vizinho impedia de
    // crescer pra baixo, que é espaço livre.
    const full = [box('a', 6, 0, 4, 3), box('b', 10, 0, 2, 3)]

    expect(room({ ...target, w: 12, h: 8 }, full)).toEqual({ w: 6, h: 8 })
  })

  /**
   * 29/08/2026: quem está abaixo deixou de ser teto e passou a descer — o
   * empurrão vertical é da compactação (`fit-compactor.ts`), e aqui o que
   * muda é a ausência da parede.
   */
  it('cresce pra baixo por cima de quem está embaixo — ele desce', () => {
    expect(room({ ...target, h: 9 }, [box('a', 0, 5, 6, 3)]).h).toBe(9)
  })

  it('quem está abaixo também não vira parede LATERAL no gesto diagonal', () => {
    // A regressão que isto tranca: com a faixa vertical crescendo junto com o
    // gesto, o widget de baixo entrava nela e, sendo de outra linha, era lido
    // como parede — a largura despencava pra `minW` no meio do arrasto.
    expect(room({ ...target, w: 12, h: 9 }, [box('a', 0, 5, 12, 3)])).toEqual({
      w: 12,
      h: 9,
    })
  })

  it('cresce até a borda da grade quando não há ninguém', () => {
    expect(room({ ...target, w: 20, h: 7 }, [])).toEqual({ w: 12, h: 7 })
  })
})

describe('clampResize — para a esquerda (handle sw)', () => {
  // Cresce pra esquerda: a borda parada é a direita, em x + w = 12.
  const target = box('n', 6, 0, 6, 3)
  const room = (requested: GridBox, others: GridBox[]) =>
    clampResize({
      box: requested,
      others,
      cols: COLS,
      minW: MIN_W,
      minH: MIN_H,
      towards: 'left',
      edge: target.x + target.w,
    })

  it('empurra o companheiro da esquerda enquanto ele couber', () => {
    expect(room({ ...target, w: 12 }, [box('a', 2, 0, 4, 3)]).w).toBe(8)
  })

  it('cresce até a borda esquerda quando não há ninguém', () => {
    expect(room({ ...target, w: 12 }, []).w).toBe(12)
  })

  it('trata quem está ACIMA como parede', () => {
    expect(
      room({ ...box('n', 6, 2, 6, 3), w: 12 }, [box('a', 0, 0, 3, 5)]).w,
    ).toBe(9)
  })

  it('quem está abaixo não é parede: ele desce', () => {
    expect(room({ ...target, w: 12 }, [box('a', 0, 1, 3, 5)]).w).toBe(12)
  })

  it('a borda parada vem do widget original, não da largura pedida', () => {
    // O bug de 28/08/2026: derivando a borda de `x + w` do pedido, ela fugia
    // junto com o mouse e o limite deixava de limitar.
    expect(room({ ...target, w: 99 }, [box('a', 2, 0, 4, 3)]).w).toBe(8)
  })
})

describe('pushAfterResize', () => {
  const from = box('n', 0, 0, 6, 3)

  it('empurra pra direita quem foi alcançado, na ordem e sem redimensionar', () => {
    const mates = [box('a', 6, 0, 4, 3), box('b', 10, 0, 2, 3)]

    expect(
      pushAfterResize({ resized: box('n', 0, 0, 8, 3), from, others: mates }),
    ).toEqual([
      { i: 'a', x: 8, y: 0, w: 4 },
      { i: 'b', x: 12, y: 0, w: 2 },
    ])
  })

  it('não emite patch para quem não foi alcançado', () => {
    const mates = [box('a', 8, 0, 4, 3)]

    expect(
      pushAfterResize({ resized: box('n', 0, 0, 7, 3), from, others: mates }),
    ).toEqual([])
  })

  it('devolve todo mundo ao encolher, sem caso especial', () => {
    const mates = [box('a', 6, 0, 4, 3)]

    expect(
      pushAfterResize({ resized: box('n', 0, 0, 4, 3), from, others: mates }),
    ).toEqual([])
  })

  it('não mexe em quem está do outro lado', () => {
    const middle = box('n', 3, 0, 4, 3)
    const mates = [box('esq', 0, 0, 3, 3), box('dir', 9, 0, 3, 3)]

    expect(
      pushAfterResize({
        resized: box('n', 3, 0, 8, 3),
        from: middle,
        others: mates,
      }),
    ).toEqual([{ i: 'dir', x: 11, y: 0, w: 3 }])
  })

  it('ignora quem não é da linha', () => {
    const others = [box('outra', 6, 5, 4, 3)]

    expect(
      pushAfterResize({ resized: box('n', 0, 0, 8, 3), from, others: others }),
    ).toEqual([])
  })

  it('empurra pra esquerda quando o crescimento foi pra esquerda', () => {
    const middle = box('n', 6, 0, 6, 3)
    const mates = [box('a', 2, 0, 4, 3)]

    expect(
      pushAfterResize({
        resized: box('n', 4, 0, 8, 3),
        from: middle,
        others: mates,
      }),
    ).toEqual([{ i: 'a', x: 0, y: 0, w: 4 }])
  })
})

/**
 * `resizeRoom` vira o `maxW` do item, e a lib o converte em limite de pixel no
 * elemento arrastado. É o que faz o widget parar no vizinho junto com o
 * preview, em vez de passar por cima dele. Só largura: desde 29/08/2026 a
 * altura não tem teto de espaço.
 */
describe('resizeRoom', () => {
  const room = (target: GridBox, others: GridBox[]) =>
    resizeRoom({ box: target, others, cols: COLS, minW: MIN_W, minH: MIN_H })

  it('sem vizinho, a largura vai até o fim da grade', () => {
    expect(room(box('a', 0, 0, 4, 3), []).maxW).toBe(COLS)
  })

  it('não mede altura: o teto de altura é do TIPO, não do espaço', () => {
    // 29/08/2026: quem está embaixo desce, então não existe `maxH` de espaço
    // pra medir. O `maxH` que o layout informa vem de `metricsFor`.
    expect(
      Object.keys(room(box('a', 0, 0, 4, 3), [box('b', 0, 5, 4, 3)])),
    ).toEqual(['maxW'])
  })

  it('o widget de baixo não encolhe a largura de quem está no topo', () => {
    expect(room(box('a', 0, 0, 4, 3), [box('b', 0, 5, 4, 3)]).maxW).toBe(COLS)
  })

  /**
   * O erro que este teste tranca (29/08/2026): a primeira versão inflava a
   * altura da caixa pra "medir o máximo possível", e com isso a faixa vertical
   * do `clampResize` passava a alcançar a grade inteira — o widget largo lá
   * embaixo virava parede LATERAL, e o teto de largura de quem estava no topo
   * despencava pra `minW`. Na tela, a lista encolheu sozinha de 5 colunas
   * para 2.
   */
  it('widget largo LÁ EMBAIXO não limita a largura de quem está no topo', () => {
    const { maxW } = room(box('a', 0, 0, 5, 5), [
      box('b', 5, 0, 7, 4),
      box('c', 0, 5, 12, 7),
    ])

    // o companheiro de linha (7 colunas) é empurrável, então sobram 5
    expect(maxW).toBe(5)
    expect(maxW).toBeGreaterThan(MIN_W)
  })

  it('mede as duas direções e fica com a maior', () => {
    // parede colada à esquerda, espaço livre à direita
    const { maxW } = room(box('b', 4, 0, 4, 3), [box('a', 0, 0, 4, 3)])

    expect(maxW).toBe(8)
  })
})

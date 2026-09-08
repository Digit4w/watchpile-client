/**
 * Encaixe de widget na linha de destino ao arrastar (brief, 3.15).
 *
 * O modelo, decidido em 28/08/2026: **a linha se divide entre quem está
 * nela**. Sozinho, o widget ocupa a largura inteira; ao receber outro, os dois
 * dividem; dentro da linha, arrastar pros lados reordena. O resize é o ajuste
 * fino manual, e mora em `clampResize`, no fim do arquivo.
 *
 * **Linha é grupo explícito: widgets com o mesmo `y`.** Isso não é detalhe de
 * implementação, é o que faz o modelo funcionar. A primeira versão definia
 * linha por sobreposição de faixa vertical, e com vizinhos de alturas
 * diferentes isso cria fronteiras fantasma: um widget de altura 3 ao lado de
 * um de altura 5 deixava de ser vizinho ao passar de `y=3`, a lacuna dobrava
 * de tamanho, e o preview piscava entre 6 e 10 colunas com o mouse parado na
 * fronteira. Altura não decide vizinhança — `y` decide.
 *
 * O preço é que `y` não é totalmente livre: ao cair dentro do alcance vertical
 * de uma linha existente, ele gruda nela (`snapToRow`). Longe de todas, o
 * widget fica exatamente onde foi solto e abre linha própria.
 *
 * **A largura de uma linha é o espaço livre na altura dela, nem sempre as 12
 * colunas** (`rowSpan`). Alturas diferentes deixam espaço livre em forma de L —
 * um widget alto à direita, e vazio embaixo do baixo da esquerda. Se linha
 * fosse sempre largura cheia, esse L seria inalcançável: a faixa embaixo do
 * widget baixo virava zona morta, porque uma linha nova ali passaria por cima
 * do alto. Com a largura vindo do espaço livre, o L é usável e o layout
 * escalonado continua possível.
 */

/** Retângulo em unidades de grade — o mínimo que o encaixe precisa saber. */
export type GridBox = {
  i: string
  x: number
  y: number
  w: number
  h: number
}

/** Intervalo de colunas, fim exclusivo: `{ start: 8, end: 12 }` são 4 colunas. */
export type ColumnSpan = {
  start: number
  end: number
}

/** Nova posição de um widget da linha. */
export type RowPatch = {
  i: string
  x: number
  y: number
  w: number
}

/**
 * `y` da linha em que o widget cai, ou o próprio `y` quando ele não alcança
 * nenhuma.
 *
 * O alcance vai do `y` da linha até o fim do membro **mais baixo**, não do mais
 * alto: passado esse ponto a linha não está inteira ali, e o que sobra ao lado
 * do membro alto é espaço livre que merece linha própria. Medir pelo mais alto
 * criava zona morta — a faixa embaixo do membro baixo era engolida pela linha
 * de cima, e não dava pra soltar nada nela.
 */
export function snapToRow(y: number, others: readonly GridBox[]): number {
  const rows = [...new Set(others.map((other) => other.y))].sort(
    (a, b) => a - b,
  )

  for (const rowY of rows) {
    const height = others
      .filter((other) => other.y === rowY)
      .reduce(
        (shortest, other) => Math.min(shortest, other.h),
        Number.POSITIVE_INFINITY,
      )

    if (y >= rowY && y < rowY + height) {
      return rowY
    }
  }

  return y
}

/** As lacunas livres da linha, da esquerda pra direita. */
export function freeSpans(
  occupied: readonly GridBox[],
  cols: number,
): ColumnSpan[] {
  const taken = occupied
    .map(({ x, w }) => ({ start: Math.max(0, x), end: Math.min(cols, x + w) }))
    .filter(({ start, end }) => end > start)
    .sort((a, b) => a.start - b.start)

  const spans: ColumnSpan[] = []
  let cursor = 0

  for (const { start, end } of taken) {
    if (start > cursor) {
      spans.push({ start: cursor, end: start })
    }
    cursor = Math.max(cursor, end)
  }
  if (cursor < cols) {
    spans.push({ start: cursor, end: cols })
  }

  return spans
}

function overlap(span: ColumnSpan, box: GridBox): number {
  return Math.min(span.end, box.x + box.w) - Math.max(span.start, box.x)
}

/** Divide `cols` em `count` partes o mais iguais possível — o resto vai pras
 * primeiras, que é o que mantém a soma exata em 12 com 5 widgets. */
function equalWidths(cols: number, count: number): number[] {
  const base = Math.floor(cols / count)
  const remainder = cols % count
  return Array.from({ length: count }, (_, index) =>
    index < remainder ? base + 1 : base,
  )
}

/**
 * Onde o recém-chegado entra: antes do primeiro membro cujo centro está à
 * direita do centro dele.
 *
 * Centro contra centro, não borda contra centro: um widget de 6 colunas com a
 * borda esquerda em 7 cobre de 7 a 13, e comparar a borda o colocava antes de
 * um vizinho que ele já tinha ultrapassado inteiro.
 */
function insertByCursor(
  members: readonly GridBox[],
  center: number,
  box: GridBox,
): GridBox[] {
  const at = members.findIndex((member) => center < member.x + member.w / 2)
  const ordered = [...members]
  ordered.splice(at === -1 ? members.length : at, 0, box)
  return ordered
}

/** Coloca a linha lado a lado dentro do vão dela, com as larguras dadas. */
function sequential(
  ordered: readonly GridBox[],
  y: number,
  widths: readonly number[],
  from: number,
): RowPatch[] {
  let x = from
  return ordered.map((member, index) => {
    const patch = { i: member.i, x, y, w: widths[index] as number }
    x += patch.w
    return patch
  })
}

function bandsOverlap(
  a: { y: number; h: number },
  b: { y: number; h: number },
): boolean {
  return b.y < a.y + a.h && a.y < b.y + b.h
}

/**
 * As colunas que a linha tem à disposição: o que sobra depois dos widgets de
 * FORA dela que cruzam a faixa vertical dela.
 *
 * É isto que faz o espaço em L ser usável. Uma linha nova aberta ao lado de um
 * widget alto não recebe as 12 colunas — recebe o que existe ali, e o alto
 * segue intocado.
 */
function rowSpan(
  band: { y: number; h: number },
  members: readonly GridBox[],
  others: readonly GridBox[],
  cols: number,
  anchor: GridBox,
): ColumnSpan | null {
  const inRow = new Set(members.map(({ i }) => i))
  const intruders = others.filter(
    (other) => !inRow.has(other.i) && bandsOverlap(band, other),
  )
  const spans = freeSpans(intruders, cols)

  if (members.length > 0) {
    // A linha já vive num vão: é o que contém os membros dela.
    const left = Math.min(...members.map(({ x }) => x))
    const right = Math.max(...members.map(({ x, w }) => x + w))
    return (
      spans.find((span) => span.start <= left && right <= span.end) ??
      spans.at(0) ??
      null
    )
  }

  return (
    spans
      .filter((span) => overlap(span, anchor) > 0)
      .sort((a, b) => overlap(b, anchor) - overlap(a, anchor))
      .at(0) ?? null
  )
}

type PlaceOptions = {
  /** O widget arrastado como estava ANTES do gesto — é a largura dele que vale
   * ao reordenar, não a que um tick anterior possa ter mexido. */
  origin: GridBox
  /** Onde o cursor o colocou agora. */
  dragged: GridBox
  /** Os outros widgets, nas posições de antes do gesto. */
  others: readonly GridBox[]
  cols: number
  minW: number
}

/**
 * Como a linha de destino fica depois de receber o widget arrastado.
 *
 * `null` significa que não dá pra colocá-lo ali — a linha já tem gente demais
 * pra que todo mundo fique acima de `minW`. Quem chama trata isso como recusa,
 * não como "sem mudança".
 */
export function placeInRow({
  origin,
  dragged,
  others,
  cols,
  minW,
}: PlaceOptions): RowPatch[] | null {
  const y = snapToRow(dragged.y, others)
  const members = others
    .filter((other) => other.y === y)
    .sort((a, b) => a.x - b.x)

  // Faixa vertical da linha: a dos membros quando ela existe, a do próprio
  // widget quando ele está abrindo linha nova.
  const height = members.reduce(
    (tallest, member) => Math.max(tallest, member.h),
    origin.h,
  )
  const span = rowSpan({ y, h: height }, members, others, cols, dragged)

  if (!span || span.end - span.start < minW) {
    return null
  }

  if (members.length === 0) {
    return [{ i: origin.i, x: span.start, y, w: span.end - span.start }]
  }

  // Já era desta linha: o gesto é reordenar, e reordenar não redimensiona
  // ninguém — cada um leva a própria largura pro novo lugar.
  if (origin.y === y) {
    const ordered = insertByCursor(members, dragged.x + dragged.w / 2, origin)
    return sequential(
      ordered,
      y,
      ordered.map((member) => member.w),
      span.start,
    )
  }

  // Veio de fora: se há lacuna que sirva, ele preenche e ninguém é tocado. Os
  // intrusos entram como ocupados pra que a lacuna não invada a coluna deles.
  const inRow = new Set(members.map(({ i }) => i))
  const occupied = [
    ...members,
    ...others.filter(
      (other) => !inRow.has(other.i) && bandsOverlap({ y, h: height }, other),
    ),
  ]
  const gap = freeSpans(occupied, cols)
    .filter(
      (free) => free.end - free.start >= minW && overlap(free, dragged) > 0,
    )
    .sort((a, b) => overlap(b, dragged) - overlap(a, dragged))
    .at(0)

  if (gap) {
    return [{ i: origin.i, x: gap.start, y, w: gap.end - gap.start }]
  }

  const ordered = insertByCursor(members, dragged.x + dragged.w / 2, origin)
  const widths = equalWidths(span.end - span.start, ordered.length)

  return Math.min(...widths) < minW
    ? null
    : sequential(ordered, y, widths, span.start)
}

/** Direção em que o resize cresce. São os dois handles habilitados. */
export type ResizeTowards = 'right' | 'left'

type ClampOptions = {
  /** O widget com o tamanho que o usuário está pedindo. */
  box: GridBox
  /** Os outros widgets — valem as posições de antes do gesto. */
  others: readonly GridBox[]
  cols: number
  minW: number
  minH: number
  towards: ResizeTowards
  /**
   * A borda que NÃO se move — `x` quando cresce pra direita, `x + w` quando
   * cresce pra esquerda. Vem do widget como ele estava antes do gesto, não do
   * tamanho pedido: derivá-la da largura pedida faz a borda fugir junto com o
   * mouse, e o limite deixa de limitar.
   */
  edge: number
}

/**
 * Maior tamanho que o resize alcança.
 *
 * **Só a largura tem parede — a altura é livre** (29/08/2026). Crescer pra
 * baixo empurra quem está no caminho, e a compactação devolve todo mundo pro
 * lugar ao encolher. Antes o primeiro widget de baixo era teto duro, e mudar a
 * altura de um widget no meio da tela obrigava a tirar os de baixo do caminho
 * primeiro — o gesto manual que o modelo existe pra poupar.
 *
 * Na horizontal, três espécies de vizinho:
 *
 * - **Companheiro de linha** (mesmo `y`) é empurrável. O widget pode tomar o
 *   espaço dele desde que o companheiro ainda caiba na linha — ou seja, o
 *   limite desconta a largura de quem vai ser empurrado, não a posição atual
 * - **Quem começa ACIMA** (`y` menor) e cruza a faixa vertical é parede dura.
 *   Empurrar pra cima não existe — a compactação já encostou todo mundo —, e
 *   pro lado seria mexer em layout de outra linha
 * - **Quem começa ABAIXO** não limita nada: desce. É o mesmo movimento da
 *   altura, e é o que impede o gesto diagonal de se sabotar — a faixa do widget
 *   cresce pra baixo, o de baixo entraria nela como parede lateral, e a largura
 *   despencava pra `minW` no meio do arrasto
 *
 * A sobreposição de faixa É o teste certo pra achar quem está no caminho,
 * diferente do arrasto: encostar em alguém é geometria. Quem decide o que fazer
 * com o encontrado é o `y` — esse sim, pertencimento.
 */
export function clampResize({
  box,
  others,
  cols,
  minW,
  minH,
  towards,
  edge,
}: ClampOptions): { w: number; h: number } {
  const band = others.filter(
    (other) => other.y < box.y + box.h && box.y < other.y + other.h,
  )
  const mates = band.filter((other) => other.y === box.y)
  const walls = band.filter((other) => other.y < box.y)
  const totalWidth = (boxes: readonly GridBox[]) =>
    boxes.reduce((total, other) => total + other.w, 0)

  let w: number
  if (towards === 'right') {
    const wall = walls
      .filter((other) => other.x >= edge)
      .reduce((limit, other) => Math.min(limit, other.x), cols)
    const pushable = mates.filter((other) => other.x >= edge)
    w = Math.max(minW, Math.min(box.w, wall - totalWidth(pushable) - edge))
  } else {
    const wall = walls
      .filter((other) => other.x + other.w <= edge)
      .reduce((limit, other) => Math.max(limit, other.x + other.w), 0)
    const pushable = mates.filter((other) => other.x + other.w <= edge)
    w = Math.max(minW, Math.min(box.w, edge - wall - totalWidth(pushable)))
  }

  // A altura não encontra teto: quem estiver embaixo é empurrado pela
  // compactação vertical (`fit-compactor.ts`). O piso é o mínimo do tipo, e o
  // topo, quando existe, é o `maxH` do próprio tipo — nunca o vizinho.
  return { w, h: Math.max(minH, box.h) }
}

/**
 * Até onde o resize pode ir na horizontal, em unidades de grade — o `maxW` que
 * vira limite de PIXEL no elemento arrastado.
 *
 * ── Por que isto existe (29/08/2026) ────────────────────────────────────────
 * O `clampResize` já limitava o resize, mas só o **placeholder** obedecia: o
 * elemento em si acompanha o cursor em pixels, por design da lib
 * (`resizePositionRef` alimenta o estilo direto, sem passar por constraint
 * nenhuma). O resultado era o preview parando certo no vizinho enquanto o
 * widget passava por cima dele — duas verdades na tela ao mesmo tempo.
 *
 * A lib converte `maxW`/`maxH` do item em `maxConstraints` de pixel para o
 * `react-resizable`, e ESSE limite o elemento respeita. Então o conserto não é
 * mexer no gesto: é dizer ao item, antes do gesto, qual é o teto dele.
 *
 * **Só a largura, e isso é a mudança de 29/08/2026:** a altura não tem teto de
 * vizinho — quem está embaixo desce (ver `clampResize`). O único `maxH` que
 * sobra é o do TIPO do widget (`metricsFor`), e esse é o layout que informa
 * direto, sem passar por aqui.
 *
 * Reusa o próprio `clampResize` em vez de reescrever a regra — pedir um tamanho
 * absurdo devolve exatamente o teto. Duas chamadas porque o limite é por
 * direção (crescer pra direita não encontra os mesmos vizinhos que crescer pra
 * esquerda); fica o maior dos dois, e a precisão continua sendo do
 * `constrainSize` durante o gesto. Errar para o lado permissivo aqui só devolve
 * um pedaço do problema antigo; errar para o restritivo travaria um resize
 * legítimo.
 */
export function resizeRoom({
  box,
  others,
  cols,
  minW,
  minH,
}: {
  box: GridBox
  others: readonly GridBox[]
  cols: number
  minW: number
  minH: number
}): { maxW: number } {
  /**
   * Pede as 12 colunas: o teto é o que o `clampResize` devolve. Duas chamadas
   * porque o limite é por direção, e fica o maior dos dois.
   *
   * **A altura de `box` fica como está.** Inflá-la pra medir "o máximo
   * possível" alarga a faixa vertical sem motivo, e a faixa é o que decide
   * quem é companheiro de linha e quem é parede de cima.
   */
  const common = { others, cols, minW, minH }
  const widthToTheRight = clampResize({
    ...common,
    box: { ...box, w: cols },
    towards: 'right',
    edge: box.x,
  }).w
  const widthToTheLeft = clampResize({
    ...common,
    box: { ...box, w: cols },
    towards: 'left',
    edge: box.x + box.w,
  }).w

  return { maxW: Math.max(widthToTheRight, widthToTheLeft) }
}

type PushOptions = {
  /** O widget já com a posição e o tamanho finais deste tick. */
  resized: GridBox
  /** Como ele estava antes do gesto — define quem estava de cada lado. */
  from: GridBox
  /** Os demais widgets, nas posições de antes do gesto. */
  others: readonly GridBox[]
}

/**
 * Como os companheiros de linha se acomodam depois do resize: quem está do
 * lado que cresceu escorrega, na ordem e com a largura de cada um preservadas.
 *
 * Ninguém é puxado pra trás — cada companheiro só se move se o widget o
 * alcançou. É isso que faz encolher devolver todo mundo pro lugar sem precisar
 * de caso especial: sem alcance, sem patch, e quem chama já reconstrói a
 * partir das posições de antes do gesto.
 *
 * Só companheiros de linha (mesmo `y`) — o limite em `clampResize` já garante
 * que eles cabem.
 */
export function pushAfterResize({
  resized,
  from,
  others,
}: PushOptions): RowPatch[] {
  const mates = others
    .filter((other) => other.y === from.y && other.i !== from.i)
    .sort((a, b) => a.x - b.x)

  const patches: RowPatch[] = []

  let cursor = resized.x + resized.w
  for (const mate of mates.filter((other) => other.x >= from.x + from.w)) {
    const x = Math.max(mate.x, cursor)
    if (x !== mate.x) {
      patches.push({ i: mate.i, x, y: mate.y, w: mate.w })
    }
    cursor = x + mate.w
  }

  let edge = resized.x
  const toTheLeft = mates.filter((other) => other.x + other.w <= from.x)
  for (const mate of [...toTheLeft].reverse()) {
    const x = Math.min(mate.x, edge - mate.w)
    if (x !== mate.x) {
      patches.push({ i: mate.i, x, y: mate.y, w: mate.w })
    }
    edge = x
  }

  return patches
}

import type { components } from '@/infra/lib/api-types'

/**
 * As entidades vêm do CONTRATO, não são escritas aqui (brief, 3.7).
 *
 * Elas moraram aqui à mão até 04/09/2026, e o tipo estava certo — o que ele
 * não tinha era como continuar certo: nada quebrava no dia em que o servidor
 * acrescentasse um campo, tirasse outro ou trocasse um `null` de lugar. Escrever
 * a entidade dos dois lados é exatamente o que o brief recusa, e o silêncio é o
 * defeito, não a divergência.
 *
 * Elas chegam por `components`, e não pelo caminho longo por `paths[…]` que
 * `services/` usa pro resto: o nome existe no contrato desde 04/09/2026 (o
 * servidor registra `Entry`, `Pile` e `PilePreview`), e um caminho por rota
 * nomearia a ROTA e não a coisa — ele passaria a mentir no dia em que duas
 * rotas devolvessem formas diferentes.
 *
 * **É um `import type`, e é por isso que ele cabe em `domain/`.** A regra da
 * camada é sobre dependência de RUNTIME — nada de React, Router, Query ou
 * `fetch`, pra que ela siga testável sem mock nenhum. Um `import type` some na
 * compilação: não há import no bundle, e o `biome.json` lista este arquivo
 * como a exceção explícita com esse motivo.
 */
export type Entry = components['schemas']['Entry']

/**
 * Uma pilha: agrupamento **manual** e opcional (brief, 3.15). Não tem filtro e
 * não tem regra — quem tem filtro é o widget da Home. Copy ou código que trate
 * pilha como "filtro salvo" está contra o modelo.
 */
export type Pile = components['schemas']['Pile']

/**
 * As primeiras obras de uma pilha, o mínimo pra desenhar o mosaico 2×2 do
 * ladrilho. Não é uma `Entry` recortada: é outra coisa, com outro uso — quem
 * recebe isto desenha uma inicial, não uma carta.
 */
export type PilePreview = components['schemas']['PilePreview']

/**
 * O tipo de mídia é um SLUG, não uma união fechada — 31/08/2026 (brief, 3.12).
 *
 * A lista de seis morava aqui e sustentava tanto o tipo quanto os `.map()` das
 * telas. Ela saiu junto com o enum do servidor: o vocabulário passou a ser dado
 * da instância, e o admin cria tipo próprio.
 *
 * **Não foi trocar a fonte da união, foi a união deixar de existir.** O contrato
 * diz `string`, e afirmar seis valores era o cliente mentir sobre o que o
 * servidor devolve — e mentia calado: tipo criado pelo admin sumia dos chips e
 * a carta renderizava sem ícone nenhum, sem erro.
 *
 * Quem precisa da lista pede a ela: `useMediaTypes()`. Quem precisa do nome
 * pede a `useMediaTypeName()`.
 */
export type MediaType = Entry['mediaType']

/**
 * O status, ao contrário do tipo, **é** união fechada (brief, 3.16) — e por
 * isso ele vem do contrato inteiro, valor a valor.
 */
export type EntryStatus = Entry['status']

/**
 * Os mesmos valores, em ordem de tela, pra quem precisa iterar — um tipo não
 * sobrevive à compilação e um `.map()` precisa de array.
 *
 * O `satisfies` recusa valor inventado ou renomeado; a guarda abaixo recusa
 * valor que o contrato ganhou e esta lista não. **Sem as duas, a cópia só
 * cobre metade**: uma lista que erra pra menos compila calada, e o sintoma é um
 * filtro que nunca oferece o status novo.
 */
export const ENTRY_STATUSES = [
  'watching',
  'completed',
  'dropped',
  'planned',
  'on-hold',
] as const satisfies readonly EntryStatus[]

/**
 * Se o contrato ganhar um status que a lista acima não tem, isto deixa de ser
 * `true` e o build para — com o valor que falta no texto do erro.
 */
type MissingStatus = Exclude<EntryStatus, (typeof ENTRY_STATUSES)[number]>
const _everyStatusIsListed: [MissingStatus] extends [never]
  ? true
  : MissingStatus = true
void _everyStatusIsListed

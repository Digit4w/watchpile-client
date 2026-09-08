/**
 * A chave do detalhe é a do PROVEDOR, não a da obra — mesmo quando se chega
 * pela biblioteca.
 *
 * O que a rota devolve é o que o provedor sabe, e isso não muda porque a obra
 * passou a ser sua: as duas telas veriam a mesma resposta. Keyar por `entryId`
 * guardaria duas cópias do mesmo JSON e faria a segunda tela buscar de novo o
 * que a primeira acabou de trazer.
 */
export const titleKeys = {
  all: ['titles'] as const,
  ofEntry: (id: number) => ['titles', 'entry', id] as const,
  ofProvider: (provider: string, externalId: string) =>
    ['titles', provider, externalId] as const,
}

/** As unidades são de (obra ou provedor) × grupo — trocar de temporada é outra chave. */
export const unitKeys = {
  ofEntry: (id: number, group: number | null) =>
    ['titles', 'entry', id, 'units', group] as const,
  ofProvider: (provider: string, externalId: string, group: number | null) =>
    ['titles', provider, externalId, 'units', group] as const,
}

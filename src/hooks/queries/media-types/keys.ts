export const mediaTypeKeys = {
  all: ['media-types'] as const,
  list: (locale?: string) => [...mediaTypeKeys.all, { locale }] as const,
  /**
   * Fora de `list`: o que os templates descrevem é o BINÁRIO do servidor, não a
   * instalação. Invalidar as listas ao salvar um tipo não deve arrastar esta
   * chave junto — só criar mexe nela, e mexe num campo só (`installed`).
   */
  templates: () => [...mediaTypeKeys.all, 'templates'] as const,
}

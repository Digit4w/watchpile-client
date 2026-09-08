/**
 * Quais tipos de mídia um controle OFERECE.
 *
 * A preferência do usuário (brief, 3.12) recorta o que o app oferece como
 * escolha — os chips de `/library`, o filtro de widget, o escopo da busca, o
 * seletor da folha de criar obra. Ela **não** recorta o que existe: a obra de um
 * tipo escondido continua na biblioteca, na pilha e no widget.
 *
 * **O que já está ESCOLHIDO nunca sai da oferta**, e é a regra que este módulo
 * existe pra guardar. Um filtro ligado que some da fileira é o defeito que a
 * decisão de 29/08/2026 já proíbe — filtro invisível é filtro esquecido —, e
 * aqui ele teria uma segunda cara: a URL é compartilhável, então `?type=game`
 * chega de fora, e esconder o chip deixaria a tela mostrando um recorte que
 * ninguém consegue ver nem desfazer.
 *
 * `keep` aceita lista porque o filtro de widget guarda vários tipos ao mesmo
 * tempo.
 */
export function offeredTypes<T extends { slug: string }>(
  types: T[],
  hidden: string[],
  keep?: string | string[] | null,
): T[] {
  const off = new Set(hidden)
  const chosen = new Set(
    keep === null || keep === undefined ? [] : [keep].flat(),
  )

  return types.filter(({ slug }) => !off.has(slug) || chosen.has(slug))
}

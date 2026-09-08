// Copy de `/setup` — o wizard de primeiro uso, nível de instância (brief, 3.9).
// Catálogo de i18n ainda não decidido; nenhuma string nasce solta no JSX.
export const setupCopy = {
  title: 'Set up this server',
  /**
   * "This happens once" é a frase que justifica a tela existir, e "can change
   * later" é o que tira o peso de decidir agora — sem ela, desligar um tipo se
   * lê como escolha irreversível, e a pessoa deixa tudo ligado por medo em vez
   * de por vontade.
   */
  body: 'This happens once. Everything here can change later in Settings.',

  language: {
    label: 'Server language',
    /**
     * A frase descreve o EFEITO da coluna, não o nome dela. `instance_language`
     * é o degrau 2 da queda de idioma (brief, 3.12) — ela **não** troca a
     * língua da interface, e um rótulo `Language` sozinho prometeria o i18n que
     * o produto ainda não tem.
     */
    hint: 'Falls back to this when something has no name in the language you read.',
  },

  types: {
    label: 'Media types',
    /**
     * "Turn off", não "pick" — o verbo segue o mecanismo. Os seis já existem no
     * banco desde a migration, e o wizard APAGA o que ficou de fora (brief,
     * 3.9). Copy que dissesse "choose what to install" descreveria uma tela que
     * não é esta.
     */
    hint: "Turn off what you don't track. You can add them back in Settings.",
    /** Filme não conta nada; jogo conta sem unidade natural (brief, 3.12). */
    noUnit: 'No unit',
    /** Rótulo acessível do toggle: ícone e nome sozinhos não dizem o que ele faz. */
    toggle: (type: string) => `Track ${type}`,
  },

  submit: 'Finish setup',
  submitting: 'Saving…',
  /**
   * A recusa se anuncia ANTES do clique (design system, seção 5): o botão nasce
   * desabilitado com o motivo abaixo. Aceitar o clique e falhar precisaria de
   * toast, que o app não tem.
   *
   * Neutro, nunca `danger` — é campo que falta, não defeito.
   */
  needsOne: 'Pick at least one media type',

  error: {
    /**
     * `Try again` é a saída certa aqui, ao contrário do 404 de tela de detalhe:
     * o servidor não respondeu, e ele pode responder na próxima.
     */
    title: "Couldn't load the media types",
    body: "The server didn't answer. Nothing has been set up yet, so it's safe to try again.",
    retry: 'Try again',
    /** A escrita falhou. Diz o que sobrevive, porque nada foi aplicado pela metade. */
    saveFailed: "Couldn't save. Nothing was changed — try again.",
  },
}

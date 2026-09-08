import type { Provider } from '@/services/providers'

/**
 * A condição de um provedor — o que a segunda linha dele diz, e o que o contador
 * da coluna conta.
 *
 * **Condição é ESTADO, não evento** (design system, seção 5): ela não se
 * dispensa, e some sozinha quando deixa de ser verdade. Por isso vive aqui como
 * uma função do provedor, e não como um aviso guardado em algum lugar.
 */
export type ProviderCondition =
  /** Falta credencial que a definição declara precisar. */
  | 'needs-credential'
  /** Roda na chave que vem no produto — não é defeito, é ambiente. */
  | 'embedded-key'
  | null

export function conditionOf(provider: Provider): ProviderCondition {
  if (!provider.ready) {
    return 'needs-credential'
  }
  return provider.credentials.some((c) => c.source === 'embedded')
    ? 'embedded-key'
    : null
}

/**
 * Quantas pendências a seção tem — o número do selo da coluna.
 *
 * **Só conta provedor que SERVE algum tipo**, e esse recorte é a regra toda
 * (design system, seção 5, 01/09/2026). Provedor sem tipo é *ocioso, não
 * quebrado* (brief, 3.10): ele não afeta a busca de ninguém, então uma chave que
 * falta nele não é pendência — é um provedor fora de uso.
 *
 * Sem o recorte o número nunca chegaria a zero: toda instalação semeia provedor
 * que o dono não usa, e sinal permanentemente aceso ensina a ignorá-lo. **Um
 * contador que não zera não é contador, é enfeite.**
 */
export function pendingCount(providers: readonly Provider[]): number {
  return providers.filter(
    (p) => p.mediaTypes.length > 0 && conditionOf(p) !== null,
  ).length
}

/**
 * A severidade do selo.
 *
 * **Não há função que a calcule, e a ausência é decisão.** Hoje só existe
 * `warning` — `danger` seria "o provedor PAROU de responder", que exige detecção
 * que não existe (só há o testar conexão, manual). Uma função que percorresse a
 * lista pra sempre devolver `warning` seria código morto fingindo ser lógica, e
 * o tipo já deixa o segundo valor pronto pro dia em que houver o que detectar.
 *
 * Quando esse dia chegar, a regra é: **a PIOR severidade presente**, nunca uma
 * soma nem uma média — o número diz quanto, a cor diz quão grave.
 */
export type Severity = 'warning' | 'danger'

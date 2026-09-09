import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * O que todo teste de componente ganha antes de rodar.
 *
 * `jest-dom/vitest` traz os matchers de DOM (`toBeDisabled`, `toBeVisible`,
 * `toHaveTextContent`), que são o que faz a asserção falar de COMPORTAMENTO em
 * vez de estrutura — `expect(botão).toBeDisabled()` afirma o que a pessoa vive;
 * `expect(node.getAttribute('disabled')).toBe('')` afirma como o React escreveu.
 *
 * `cleanup` explícito porque a suíte não roda com `globals: true`: sem
 * `expect`/`afterEach` no escopo global, o auto-cleanup do Testing Library não
 * se instala sozinho, e um teste passaria a ver o DOM montado pelo anterior.
 *
 * ── Duas coisas que o jsdom não implementa e o app usa ─────────────────────
 * `matchMedia` e `ResizeObserver` não existem ali, e não é falta do jsdom: os
 * dois dependem de layout, que ele não faz. Sem os stubs, montar qualquer
 * componente sob o shell explode antes da primeira asserção
 * (`useCompactViewport` chama um, `chip-fit` chama o outro).
 *
 * **`matchMedia` responde `false` por padrão** — o app é desktop-first (design
 * system, seção 1), e um teste que não diz nada sobre viewport deve ver a forma
 * de desktop. Quem testa o celular sobrescreve no próprio arquivo, e o fato de
 * precisar dizer isso é o ponto: viewport é premissa, não acidente.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

afterEach(cleanup)

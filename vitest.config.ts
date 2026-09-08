import { defineConfig } from 'vitest/config'

/**
 * Config própria em vez de reusar `vite.config.ts`: os testes de hoje são de
 * `domain/`, que é puro por regra (`biome.json` bloqueia React ali dentro), e
 * carregar os plugins do React e do TanStack Router pra rodá-los só custa
 * tempo. Precisa testar componente um dia? Aí sim entra `environment: 'jsdom'`
 * e os plugins.
 *
 * `.spec.ts` é o sufixo de teste unitário, mesma convenção do server, onde
 * `.test.ts` fica reservado pro e2e que sobe a app de verdade.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * DOIS projetos, e a divisão é a mesma que sempre existiu — o que mudou é que
 * agora os dois rodam.
 *
 * ── Por que não é uma config só ────────────────────────────────────────────
 * Os testes de `domain/` são puros por regra (`biome.json` bloqueia React,
 * Router, Query e o `httpClient` lá dentro), e carregar o plugin do React e um
 * DOM inteiro pra rodá-los só custa tempo. Os de componente precisam dos dois.
 * Uma config só serviria mal aos dois lados: ou o domínio paga o `jsdom`, ou o
 * componente não tem onde renderizar.
 *
 * ── O SUFIXO já separava os dois, e ninguém precisou inventar um ───────────
 * `.spec.ts` é regra pura; `.spec.tsx` é componente. A extensão que o JSX já
 * obriga é o glob — não há convenção nova a lembrar, e um arquivo não tem como
 * cair no projeto errado. `.test.ts` continua reservado pro e2e que sobe a
 * app, como no `server/`.
 *
 * ── O `tsc` cobre os dois, e isso NÃO é de graça ───────────────────────────
 * `tsconfig.app.json` inclui `src` inteiro, sem excluir teste — então
 * `bun run build` typecheca os specs junto com o código. É a rede que o
 * `server/` descobriu não ter em 07/09/2026, quando uma coluna nova passou
 * pelo `tsc` porque o `tsconfig` de lá exclui `*.test.ts` e os seis `insert`
 * de teste falharam só em runtime. Se algum dia alguém excluir teste daqui,
 * está tirando essa rede.
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: { '@': `${import.meta.dirname}/src` } },
        test: {
          name: 'domain',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        plugins: [react()],
        resolve: { alias: { '@': `${import.meta.dirname}/src` } },
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.spec.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
})

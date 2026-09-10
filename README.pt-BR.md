# Watchpile — cliente web

*[Read in English](README.md)*

| Build | Licença |
| --- | --- |
| [![CI](https://github.com/Digit4w/watchpile-client/actions/workflows/check.yml/badge.svg)](https://github.com/Digit4w/watchpile-client/actions/workflows/check.yml) | ![License](https://img.shields.io/badge/license-AGPL--3.0-blue) |

O cliente web oficial do [Watchpile](https://github.com/Digit4w/watchpile-server),
um tracker de mídia self-hosted para filmes, séries, anime, mangá, jogos e
livros.

**Este repositório não roda nada sozinho.** Ele é uma SPA que conversa com o
servidor do Watchpile por HTTP, e não sabe quem o está servindo — Docker no
homelab, o app Electron ou o dev server do Vite são a mesma coisa pra ele. **Se
você quer instalar o Watchpile, você quer o
[servidor](https://github.com/Digit4w/watchpile-server)**: ele já traz este
cliente embutido, buildado.

## Por que é um repositório separado

Não há monorepo, e isso é decisão, não acidente. O que atravessa entre os dois
repositórios é um **contrato gerado**: os schemas Zod do servidor produzem um
`openapi.json`, e esse arquivo produz os tipos que este cliente consome. Nenhuma
interface de entidade é escrita à mão dos dois lados, e regerar é parte da
mudança e não tarefa separada — `api-types.ts` é versionado e nunca editado à
mão.

A consequência prática, e vale saber antes de abrir um bug: este repositório
**não quebra em build** quando o servidor muda o contrato. Ele quebra em
runtime, depois do deploy, na instalação que atualizou só um dos dois lados.

## Desenvolvendo

Você precisa de um servidor Watchpile de pé — veja o
[repositório do servidor](https://github.com/Digit4w/watchpile-server) para
subir um.

```bash
bun install
bun run dev          # Vite na :5173, com /api por proxy pra localhost:3210
```

| Comando | O que faz |
| --- | --- |
| `bun run dev` | dev server com hot reload |
| `bun run build` | build de produção em `dist/` — é isto que o servidor serve |
| `bun run test` | Vitest: regra pura de domínio, mais os componentes que decidem |
| `bun run lint` | Biome, a única ferramenta de lint e formato aqui |
| `bun run api-types:generate` | regera os tipos do contrato a partir de `../server/openapi.json` |

`bun run build` também faz o typecheck. Repare que `tsc --noEmit` sozinho **não
checa nada** neste repositório — o `tsconfig.json` usa project references, então
o typecheck de verdade é `tsc -b`, que é o que o build roda.

## Publicando

Você não faz deploy deste cliente sozinho. O `dist/` é copiado pra dentro do
servidor, que serve a API e esses estáticos no mesmo processo — é a promessa de
"um servidor, um container, um arquivo de banco" em que o projeto inteiro se
apoia.

## Licença

[AGPL-3.0](LICENSE), a mesma do servidor.

# Watchpile — web client

*[Leia em português](README.pt-BR.md)*

| Build | License |
| --- | --- |
| [![CI](https://github.com/Digit4w/watchpile-client/actions/workflows/check.yml/badge.svg)](https://github.com/Digit4w/watchpile-client/actions/workflows/check.yml) | ![License](https://img.shields.io/badge/license-AGPL--3.0-blue) |

The official web client for [Watchpile](https://github.com/Digit4w/watchpile-server),
a self-hosted media tracker for films, series, anime, manga, games and books.

**This repository does not run anything on its own.** It is a single-page app
that talks to the Watchpile server over HTTP, and it does not know who is
serving it — Docker on a homelab, the Electron app, or the Vite dev server look
the same to it. **If you want to install Watchpile, you want the
[server](https://github.com/Digit4w/watchpile-server)**: it ships this client
inside, already built.

## Why it is a separate repository

There is no monorepo, and that is a decision rather than an accident. What
crosses between the two repositories is a **generated contract**: Zod schemas on
the server produce an `openapi.json`, and that file produces the types this
client consumes. No entity interface is ever written by hand on both sides, and
regenerating is part of the change, not a separate chore — `api-types.ts` is
versioned but never edited by hand.

The practical consequence is the one worth knowing before you file a bug: this
repository **does not break at build time** when the server changes the
contract. It breaks at runtime, after a deploy, on the installation that updated
only one of the two sides.

## Developing

You need a Watchpile server running — see the
[server repository](https://github.com/Digit4w/watchpile-server) for how to
start one.

```bash
bun install
bun run dev          # Vite on :5173, proxying /api to localhost:3210
```

| Command | What it does |
| --- | --- |
| `bun run dev` | dev server with hot reload |
| `bun run build` | production build into `dist/` — this is what the server serves |
| `bun run test` | Vitest: pure domain rules, plus components that decide |
| `bun run lint` | Biome, the only lint and format tool here |
| `bun run api-types:generate` | regenerates the contract types from `../server/openapi.json` |

`bun run build` also type-checks. Note that `tsc --noEmit` on its own checks
**nothing** in this repository — `tsconfig.json` uses project references, so the
real type-check is `tsc -b`, which is what the build runs.

## Shipping it

You do not deploy this client by itself. `dist/` is copied into the server,
which serves the API and these static files from the same process — that is the
"one server, one container, one database file" promise the project is built on.

## License

[AGPL-3.0](LICENSE), the same as the server.

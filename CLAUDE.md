# Watchpile — Client

SPA que consome a API do Watchpile. Não sabe quem a está servindo: Docker no homelab, Electron numa máquina de trabalho ou o dev server do Vite — para o React é tudo a mesma API HTTP.

Guia da pasta macro: `../CLAUDE.md`. Fontes da verdade: `../watchpile-design-brief.md` (arquitetura) e `../watchpile-design-system.md` (aparência) — este segundo é o que manda em tudo o que se vê.

## Estado: scaffold com a primeira tela de verdade

Iniciado em 24/08/2026: `git init`, `package.json`, Vite + React + TypeScript + Tailwind v4 + TanStack Router (file-based, em `src/routes/`) + TanStack Query + `nuqs`, Biome e lefthook espelhando `server/`, `LICENSE` (AGPL-3.0) desde o primeiro arquivo. Estrutura em clean architecture enxuta (ver "Arquitetura" abaixo), absorvida do `negocia/mobile`, adotada no mesmo dia. Os três primeiros commits foram **direto em `main` e `dev`**, sem branch própria e sem PR — feito fora do fluxo normal do projeto, numa sessão anterior, não reescrito. Todo o resto listado abaixo já entrou pelo fluxo normal (branch + PR).

Em 25/08/2026: `src/infra/lib/api-types.ts` gerado (o servidor já publicava `openapi.json`, faltava rodar o gerador deste lado), a tela de login/setup (`routes/login.tsx`) consumindo a API de verdade — não é mais vitrine de componente —, um esqueleto de home pra onde o login redireciona, e favicon/ícones (`design/brand/icon.svg`, o símbolo final da marca, seção 10 do design system). `tokens.css` deixou de ser importado direto de `../design/` e virou cópia versionada em `src/styles/` — ver "Toda tela nasce como mockup" mais abaixo.

Em 28/08/2026 o esqueleto virou tela: `routes/index.tsx` é a **Home customizável** (brief, 3.15), com `components/home/`, `react-grid-layout`, e a camada de service/hook de `piles`, `entries` e `home-widgets`. O que o usuário arruma ali é widget — fonte, filtro, tamanho, posição —, e qualquer um pode ser removido.

Ainda em 28/08/2026, dois ciclos longos em cima dela. **Comportamento de grade:** o modelo de layout foi reescrito três vezes até fechar (ver "O modelo de layout da Home", abaixo), e nasceram `domain/widget-fit.ts` — regra pura, com Vitest — mais os dois adaptadores da lib, `components/home/fit-compactor.ts` (arrasto) e `resize-constraint.ts` (resize). **Chrome:** `Log out` saiu da barra de cima e virou menu no rodapé da sidebar; os controles de layout viraram uma barra flutuante de vidro; e `Add widget` abre uma folha lateral com miniaturas animadas, de onde se arrasta ou clica (`components/home/widget-picker.tsx`, `layout-toolbar.tsx`, `home-motion.css`). A barra de topo do celular nasceu aí também — antes o telefone não tinha identidade nem sessão, porque a sidebar é `md:hidden`.

Em 29/08/2026 dois ciclos curtos. **Ações do widget:** as configurações saíram do painel inline e viraram popover flutuante (`components/ui/popover`), e remover ganhou confirmação mais saída animada (`components/home/widget-remove.tsx`, `home-motion.css`). **Carta de mídia:** a carta rica de `design/mockups/home.html` chegou à Home — arte ocupando a carta inteira, nota, título e contador sobre o degradê (`components/home/entry-card.tsx`) —, e com ela o **encaixe** de altura, resumido em "A carta encaixa na grade" mais abaixo. **Resize:** crescer pra baixo deixou de parar no vizinho e passou a empurrá-lo — ver o modelo de layout logo abaixo.

Já existe, portanto, uma carta de mídia — e desde 30/08/2026 ela vale também em `/library`, **que está construída**: quatro modos de exibição (grade, grade compacta, lista, lista compacta), busca, chips de tipo, menu de status/ordenação/exibição, os quatro estados e a folha de criar obra. A carta é a mesma da Home, sem uma alteração, e ganhou o **selo de tipo de mídia** em vidro no canto superior direito (design system, seção 2) — que a Home passou a mostrar junto. O mockup morreu no mesmo movimento, e o que ele ensinou está no design system.

Ainda em 29/08/2026, a nav ganhou **Library** ao lado de Piles (brief, 6): as duas listam objetos diferentes — `/library` lista obras, `/piles` lista pilhas. Desde 30/08/2026 a nav **navega de verdade**, e só onde há tela: item sem rota continua um `<span>` inerte, porque destino que abre tela em branco parece defeito e item que não reage parece o que é. **`/piles` foi construída em 30/08/2026, e o mockup dela morreu junto** — três modos de exibição (grade, lista, lista compacta), busca e ordenação na URL, popover de criar, folha de editar e apagar com confirmação. Três coisas vieram do design system e não se reinventam: o ladrilho é **quadrado** com o nome **sob** ele, a identidade cai em quatro níveis (capa subida > mosaico 2×2 > uma peça > vazio, em `domain/pile-view.ts` com spec), e criar pilha é **popover de um campo** — capa e descrição são edição. **A capa em BLOB e a busca que também acha obras ficaram fora, por decisão de escopo**, e a copy da tela não promete nenhuma das duas.

Fechando o dia, o **chrome ganhou as duas formas**. No desktop a sidebar recolhe pra um rail de 64px (`hooks/use-collapsed-sidebar.ts`, preferência no `localStorage`), com a alça de recolher **na borda** e não dentro da coluna. No celular a sidebar dá lugar a uma **barra de abas** com os quatro destinos diários, `Settings` migra pro menu de conta, e a Home deixa de ser grade: vira pilha vertical (`components/home/home-stack.tsx`), sem Edit Layout. As duas decisões revertem `design/mockups/home.html` e estão registradas na seção 5 do design system.

Fechando 31/08/2026, **Settings nasceu como MODO e `/settings/media-types` foi construída** — o mockup dela morreu no mesmo dia em que foi desenhado. Entrar em `/settings` troca a sidebar pela coluna de seções (`components/chrome/settings-shell.tsx`), e as três que existem são `Account`, `Media types` e `About`. A seção de tipos lista o vocabulário da instalação e abre uma **folha** por linha, com alternador de idioma (nome, plural e unidade vão por idioma; ícone e "conta progresso" não), seletor sobre os 94 glifos do contrato num popover, e apagar desabilitado com a contagem de obras ao lado. `Add type` oferece os **templates embarcados** antes do formulário em branco. A regra de quando o formulário pode salvar é pura e testada (`domain/media-type-form.ts`), porque ela decide as duas recusas e o app não tem toast pra explicá-las depois do clique.

Em 01/09/2026 entrou **`/settings/providers`**, e com ela a segunda seção do modo — o que fez o shell de Settings provar que aguenta mais de uma. A tela tem **dois lados, e é uma decisão só**: no provedor a cobertura é LEITURA ("pra que serve este?"), no tipo mora a escolha do **provedor padrão** ("qual deles responde a busca?"). A escolha fica no tipo porque escolher pelo lado do provedor faria marcar um tipo **roubá-lo** do provedor anterior — efeito colateral num objeto fora da tela. O mockup morreu junto.

Três coisas dela viajam pra qualquer tela que consuma a API:

- **O campo de credencial nasce VAZIO mesmo com chave salva**, porque o `GET` nunca devolve o segredo. Daí a regra que a tela precisa desarmar: **campo vazio não pode significar "apague"** — não tocar manda nada, e apagar é ação nomeada. Sem isso, salvar o idioma dos metadados apagaria a chave junto
- **Identificador do contrato não vai pra tela.** A linha mostrava `movie, tv` no lugar de `Movies, Series`: slug é chave, não rótulo. Onde o contrato devolve chave, a tela resolve — e usa o **plural** quando descreve conjunto
- **Artigo dentro de copy interpolada é armadilha de i18n.** "Needs a API key" errava porque `a`/`an` depende da primeira letra de um dado; em pt-BR o problema é gênero e número. Frase nominal atravessa os dois
- **A copy do CANÔNICO descrevia o que ele ainda não faz — corrigido em
  02/09/2026.** Ela dizia "Titles and fields come from here", que é a intenção do
  brief (3.10) e não o efeito: dos dois consumidores de `default_provider_slug`,
  o que decide de qual vínculo saem arte e sinopse só age quando a obra tem mais
  de um, e **nada criava o segundo**. O consumidor vivo é a BUSCA, e é dela que a
  copy fala agora — e **desde 02/09 é dela que ele fala pra sempre**: construir
  "vincular obra existente" acordou o consumidor dormente sem que a promessa
  voltasse, e o dono tirou o segundo consumidor do campo em vez de reescrever a
  frase (brief, 3.10) — então **não há "outra metade" a voltar: esta copy é a
  copy inteira**. O `noneBody` era pior: "cada obra guarda a fonte de onde veio"
  era verdade nas TRÊS opções, então o contraste era falso. E o rótulo virou
  **`Search source`** em 02/09, porque `Canonical source` era jargão de contrato
  num rótulo de tela — a regra de 01/09 vale nos dois sentidos, chave não sobe
  pra tela e rótulo não desce pro contrato. O componente é
  `settings/default-provider-field.tsx`: **lê `effectiveProvider`, escreve
  `defaultProvider`**

**Em 01/09/2026 `/search` foi construída, e o mockup morreu junto** — desenhada
e construída no mesmo dia. Rota própria (`routes/search.tsx`), e o item da nav
deixou de ser inerte. A folha de criar obra **continua sendo a mesma**: o
resultado a preenche (`EntryPick`), nunca cria direto.

Cinco coisas dela viajam:

- **O escopo mora DENTRO do campo** (`components/search/search-scope.tsx`), e a
  primeira versão era uma fileira de chips que caiu no mesmo dia. Medido: sete
  chips em 794px de uma fileira de 1216 — entre oito e dez tipos e ela estoura,
  em rolagem horizontal silenciosa no desktop. **Escopo é parâmetro da consulta,
  filtro é recorte do resultado**, e por isso `/search` tem uma faixa só. A de
  baixo volta quando houver filtro de verdade; o escopo não volta pra ela
- **`sr-only` dentro de container que rola precisa de `relative` no item.** Sendo
  `position: absolute`, o containing block vira o `<header>` `sticky`, que está
  FORA do `overflow-x-auto` — o rótulo invisível escapa do recorte e empurra a
  página 65px. Corrigido em `library-chips.tsx` no mesmo ciclo
- **Atribuição é do provedor que respondeu**, nunca uma constante da tela:
  `attribution` é campo da definição, e AniList e Open Library não exigem nenhuma
- **A tela responde sozinha o que ela já sabe.** Tipo sem fonte não chama a API:
  `useSearch` fica desabilitado e o painel de `no-provider` sai de conhecimento
  local. As duas regras decidíveis moram em `domain/` com spec —
  `search-refusal.ts` (a gravidade de cada motivo) e `search-scope.ts` (qual
  fonte serve cada tipo, qual delas responde, e onde a tela abre)
- **A FONTE mora no mesmo menu que o escopo — 02/09/2026.** Trocar de provedor
  existia só no cabeçalho dos resultados, invisível até a primeira busca voltar e
  atrás de uma guarda de "mais de uma fonte" que nenhum tipo satisfazia até o
  Kitsu entrar: **controle vivo e inalcançável**. Fonte é parâmetro da consulta
  como o escopo, então mora junto, e a lista abre **no lugar** — submenu ancorado
  numa linha teria conteúdo elástico acima, que é o que o seletor de pilhas já
  ensinou. Três regras que saíram daí e valem em qualquer tela:
  **(a) onde o servidor decide, a tela LÊ a decisão** — `sourcesByType` escolhia
  por ordem alfabética "pela mesma ordem que o servidor usa", e no dia em que
  nasceu o primeiro provedor padrão as duas ordens divergiram: o menu prometia
  Jikan e o Kitsu respondia. `effectiveProvider` já vinha resolvido no contrato;
  **(b) duas contas da mesma coisa é como uma fica pra trás** — a fonte efetiva
  foi corrigida no cabeçalho e esquecida no estado vazio, e a tela dizia Jikan no
  campo e Kitsu na frase abaixo. Virou `fonteEfetiva()`, uma função só, testada;
  **(c) quem identifica a linha cede espaço por último** — o nome do provedor era
  `shrink-0` e o tipo aparecia como `Ani...`. O tipo identifica, a fonte reforça,
  e o teto do provedor é **proporção (45%), não piso em px**, porque nome de tipo
  não tem teto e nome de provedor é curto por natureza
- **A recusa separa `4xx` de `5xx`, e a régua da gravidade mudou de eixo —
  02/09/2026.** `provider-error` deu lugar a `provider-refused` e
  `provider-down`, e **o que separa `condition` de `failure` é se há o que
  ARRUMAR**, não quem falhou: o provedor cair do lado dele é falha dele e mesmo
  assim fica neutro, porque a resposta de quem lê é a mesma do `rate-limited` —
  esperar. Na prática o `5xx` perdeu o botão `Open providers`, que mandava o
  admin consertar uma configuração que está certa. **A lista de motivos deixou
  de ser cópia à mão do enum do servidor**: uma checagem nas duas direções
  contra o tipo gerado faz mudança de contrato quebrar o BUILD, em vez de a tela
  cair calada no estado de erro (brief, 3.7)

**Em 04/09/2026 nasceu `YOU / Preferences`, a quarta seção do modo Settings** — e com
ela o OUTRO objeto de "tipo de mídia" (brief, 3.9 e 3.12): o admin define o vocabulário
da instalação, cada pessoa escolhe qual parte dele este app lhe oferece. A seção é uma
lista de toggles (`components/settings/preferences-section.tsx`), **sem `Save`**, e a
linha saiu de `/setup` ao ganhar o segundo uso (`components/media/media-type-toggle-row.tsx`).
Ela **não passou por mockup**, por decisão do dono: o shell, a coluna, a linha de
configuração e o toggle já estavam todos decididos, e desenhar repetiria uma tela que já
roda.

O que estiver escrito abaixo é **intenção registrada** para o que ainda não foi construído — a stack já instalada é a que a tabela abaixo descreve.

## Stack

| Camada | Escolha |
| --- | --- |
| Build | Vite |
| UI | React |
| Roteamento | TanStack Router — em avaliação (brief, 3.13) |
| Estado de servidor | TanStack Query |
| Estado de UI | **A URL.** Zustand só quando aparecer caso real |
| Componentes | shadcn/ui |
| Estilo | Tailwind |
| Reordenar item (drag-and-drop) | `dnd-kit` (brief, 3.14) — **em uso**: reordena obra dentro de widget da Home (`useMoveWidgetEntry`, escrevendo `widget_entry_order`) e dentro de `/piles/:id`. **Esta linha dizia "ainda sem uso" até 10/09/2026**, e era verdade em agosto — a correção veio ao responder a decisão em aberto 16, cuja pergunta tinha sido feita com essa premissa. *A parte de uma justificativa que envelhece é a que fala do vizinho*, e aqui o vizinho era o estado de outra camada |
| Layout de widgets da home (drag/resize/colisão) | `react-grid-layout` (brief, 3.15) — **instalado e em uso** desde 28/08/2026 |

### Onde cada estado mora — a tabela que evita a maior parte dos erros

| Tipo | Onde | Exemplo |
| --- | --- | --- |
| Dado do servidor | TanStack Query | a biblioteca, uma obra, as piles |
| Navegável ou compartilhável | **URL** | filtro, busca, ordenação, aba, página |
| Preferência daquele aparelho | `localStorage` | sidebar recolhida, densidade |
| Efêmero entre componentes distantes | Zustand, **quando houver caso real** | — |

**Zustand não está instalado, e isso é decisão** (brief, 3.13), não esquecimento — e o motivo é preciso: não é que store não dê conta de link compartilhável (o `persist` com storage de `URLSearchParams` dá, e está na doc do Zustand), é que com o router dono dos parâmetros **a URL é o estado**, sem camada de sincronização nem segunda cópia. Não adicione preventivamente.

Dado de servidor copiado para qualquer store vira segunda fonte de verdade que desatualiza calada. O TanStack Query já é o store dele.

Quem lê e escreve a URL é o **[nuqs](https://nuqs.dev)**: API igual a `useState`, parsers tipados, controle de push vs replace por navegação. Não é um store sincronizado com a URL — a URL é a fonte, e é por isso que ele entra no lugar do `persist` do Zustand.

O router é o **TanStack Router, em avaliação** (brief, 3.13) — o que restou de motivo para ele são os links tipados, já que os search params agora são do `nuqs`. O adapter (`nuqs/adapters/tanstack-router`) é **experimental**, e link tipado só cobre tipos triviais.

**Um parâmetro tem um dono só:** ou está no `validateSearch` da rota, ou é do `nuqs`. Nunca nos dois — se os dois escreverem no mesmo parâmetro, vence quem rodou por último, e isso só aparece em produção.

Se o router for trocado, **nada de estado na URL muda**: o `nuqs` é agnóstico de router. Fallback registrado é React Router + nuqs.

## Arquitetura: clean architecture enxuta

Absorvida do projeto irmão `negocia/mobile` (`../negocia/mobile/CLAUDE.md`) e adaptada
— decisão registrada em 24/08/2026. Camada técnica por fora, domínio por dentro: cada
camada tem sua função, e dentro dela o código se organiza por domínio (`piles`,
`library`…), não o contrário. Não existe `features/piles/` com tudo dentro — o
identificador `piles` atravessa `services/piles.ts`, `hooks/queries/piles/`,
`hooks/mutations/piles/` e `components/piles/`, cada arquivo na camada que lhe cabe.

```
client/src/
├── routes/          # TanStack Router — tela fina, só composição
├── domain/          # regras puras — zero import de React/Router/Query/fetch
│                     #   ex.: rótulo de progresso por tipo, "12 / ?" sem denominador
├── infra/
│   └── lib/
│       ├── http-client.ts   # fetch wrapper — base URL por env/mesma origem
│       ├── api-types.ts     # GERADO do openapi.json do server — não editar
│       └── query-client.ts  # instância do QueryClient
├── services/        # única camada que chama a API do Watchpile; mapeia api-types → domain
├── stores/          # estado de cliente que não é servidor nem URL — hoje vazio
├── hooks/
│   ├── queries/<domínio>/
│   └── mutations/<domínio>/
├── components/
│   ├── ui/          # shadcn — arquivo gerado por `npx shadcn add`
│   └── <domínio>/   # componente compartilhado específico
│                     #   chrome/ (shell e nav), media/ (a carta e o tipo),
│                     #   home/ (grade e widget), library/, piles/,
│                     #   search/, settings/
│                     # e as transversais, nomeadas pela COISA e não pelo
│                     # domínio, porque a coisa é de todo mundo:
│                     #   menu/ (o `⋯` e os glifos dele)
│                     #   view/ (o ícone de modo de exibição)
├── lib/             # cn() do shadcn + helpers puros de formatação (Intl) — sem regra de negócio
├── styles/          # globals.css → tokens.css (cópia versionada de design/tokens.css)
└── types/           # só declaração ambiente (vite-env.d.ts)
```

### Direção das dependências

```
routes  →  hooks  →  stores  →  services  →  infra
  └──────────────────────────→ components, lib
```

`domain` fica embaixo de todas: `services` importa os tipos dele, e ele não depende de
nenhuma — é o único lugar testável sem mock nenhum.

**A regra é sobre dependência de RUNTIME, e desde 04/09/2026 isso está escrito.** Ela
sempre quis dizer "nada que precise de mock pra rodar", nunca "nenhum import" — e a
prosa antiga já era falsa quando foi escrita, porque `domain/search-refusal.ts` lê o
contrato desde 01/09. Duas coisas de `infra/` cabem aqui, e as duas pelo mesmo motivo:

- **`import type` do contrato gerado** (`@/infra/lib/api-types`), que é como
  `domain/media.ts` tem `Entry` e `Pile` sem escrevê-los à mão (brief, 3.7). Um
  `import type` some na compilação — não entra no bundle e não pede mock
- **`HttpError`**, que é a FORMA de uma falha e não um pedido. Ler status e corpo pra
  decidir se aquilo é uma recusa é regra decidível, e regra decidível mora aqui

O que segue proibido é o `httpClient` — quem faz `fetch` — e o `queryClient`. **E agora
o Biome recusa os dois**, em vez de só a prosa: a restrição nomeia o export, não o
arquivo, porque bloquear o módulo inteiro levaria `HttpError` junto.

| Camada | Responsabilidade | Não pode |
| --- | --- | --- |
| `routes/` | Rota e composição. Tela fina: lê hooks, monta componentes | Regra de negócio, chamada de rede |
| `domain/` | Cálculo, validação, formato de unidade de progresso; hospeda as entidades derivadas do contrato | Importar React, TanStack Router/Query, `nuqs`, o `httpClient` ou o `queryClient` |
| `infra/` | Instanciar/configurar o cliente HTTP e o `QueryClient`; hospedar `api-types.ts` gerado | Fazer request de domínio |
| `services/` | Única camada que chama a API do Watchpile; mapeia `api-types` → tipo de domínio | Ser chamada direto de componente |
| `stores/` | Estado de cliente que não é servidor (isso é do Query) nem navegável (isso é da URL/`nuqs`) — hoje vazio, Zustand só com caso real | Guardar estado de servidor |
| `hooks/` | Cache, invalidação, estado de servidor via TanStack Query | Conter regra que caberia em `domain/` |
| `components/` | UI reutilizável | Saber que existe `fetch`/API |

**A regra do `domain` é verificada, não só combinada.** `biome.json` tem um override
que bloqueia `react`, `@tanstack/react-router`, `@tanstack/react-query`, `nuqs`,
`tailwind-variants` e — desde 04/09/2026 — o `httpClient` e o `queryClient` dentro de
`src/domain/**`: importar qualquer um deles é erro de lint com a explicação do porquê.
Os dois últimos entraram no dia em que `api-types` passou a ser importado ali: sem eles
a lista deixava a metade perigosa de `infra/` de fora, e a exceção pareceria a porta
aberta que não é. **A restrição nomeia o export e não o arquivo** — bloquear
`@/infra/lib/http-client` inteiro levaria `HttpError` junto, e foi a própria regra
recém-escrita que apontou o caso ao reprovar `search-refusal.ts`.

### O que difere do Negocia, e por quê

| Lá (mobile) | Aqui (web) | Motivo |
| --- | --- | --- |
| `infra/lib/pocketbase.ts` (SDK + auth) | `infra/lib/http-client.ts` (fetch simples) | Sem SDK de terceiro — a API é a nossa, gerada via OpenAPI |
| `services/cnpj.ts`, `cep.ts` (API externa direto do app) | Não existe | TMDB é chamado pelo **servidor** (brief 3.10) — o client nunca fala com provedor externo direto |
| `styles/colors.ts`, `fontSize.ts`… (um arquivo por chave do Tailwind) | Não existe, só `tokens.css` | Tailwind v4 configura por CSS (`@theme`); a divisão por arquivo do Negocia existe porque NativeWind/v3 precisa de JS |
| `utils/` separado de `infra/lib/` | Dobrado em `lib/` por enquanto | Volume bem menor que o do Negocia — sem máscara de documento/telefone. Cresceu? Separar é 2 minutos |
| `stores/session.ts` (espelho do `pb.authStore`) | Pasta existe, vazia | Mecanismo de sessão do Watchpile (cookie vs. token) ainda não foi decidido — não inventar a forma agora |

Pastas hoje vazias (`domain/`, `services/`, `stores/`, `hooks/queries/`,
`hooks/mutations/`, `components/ui/`) têm `.gitkeep`, mesmo padrão do `server/` para
pasta reservada sem conteúdo ainda.

## A regra que governa este repositório: agnóstico de host

O cliente **não sabe onde está rodando** (brief, 3.4). Na prática:

- Nada de `window.electron`
- Nada de detectar ambiente para mudar comportamento
- Nada de URL de API hardcoded

A base da API sai de configuração — variável de ambiente do Vite em desenvolvimento, mesma origem em produção, já que o servidor entrega a API e os estáticos pelo mesmo processo (brief, 3.1).

É isso que manteve o Electron barato de implementar (`server/electron/main.ts`): ele carrega `http://localhost:<porta>` e nada aqui precisou mudar.

## Copy: "pile" é o termo, não um sinônimo

"Create a pile", "Add to pile", "Your piles" (brief, seção 6). Vale na UI e nos identificadores — o domínio `piles` em `services/`, `hooks/` e `components/`, `/api/piles`, scope de commit `piles`.

Escrever "list" ou "collection" no lugar é inconsistência de produto, não variação de estilo.

**E tirar de uma pilha não é apagar a obra** (design system, seção 5, 31/08/2026). `Remove from pile` mexe em `pile_entries`; `Delete title` apaga a linha de `entries` com progresso, nota e log junto. As duas convivem na mesma tela e a copy tem que distingui-las mesmo custando uma palavra a mais — **ação destrutiva não herda o rótulo curto do vizinho não destrutivo**, e o erro que isso evita é alguém "arrumar" uma pilha e descobrir depois que perdeu o progresso de doze obras.

No catálogo pt-BR ele é **"pilha"** (brief, 6) — "Criar uma pilha", "Suas pilhas". A tradução é da copy, não do código: os identificadores `piles`, `/api/piles` e o scope de commit continuam em inglês.

## Idioma da interface: multi-idioma desde a primeira tela

Inglês é o padrão, **português sai junto** — não como tradução retroativa (brief, 3.8). Documentação e comentários explicativos continuam em português.

**Como implementar isso está em aberto**: biblioteca (react-i18next, Lingui, Paraglide…), formato do catálogo, carregamento, e se a preferência mora no servidor ou no `localStorage`. Nada disso foi escolhido. Se o trabalho travar nisso, **pergunte** — não adote uma biblioteca por conta própria.

O que já vale desde agora, independente da escolha:

- **Nenhuma string visível hardcoded no componente.** Toda copy sai de um catálogo. É isso que torna a escolha da biblioteca uma troca de camada, e não uma varredura por todos os arquivos
- **Plural, data e número via `Intl`**, nunca por concatenação — "1 episode"/"2 episodes" já é regra de idioma, e a do português é outra
- **Layout que aguente texto mais longo.** Português ocupa ~30% a mais; botão dimensionado pelo texto em inglês quebra na tradução
- **Bandeira não é idioma.** Seletor de idioma usa o nome do idioma, não país

Enquanto o catálogo não existir, uma constante exportada já serve — o que não pode é a string nascer dentro do JSX.

## Sem PWA por enquanto

`manifest.json` e service worker são pouco código, mas service worker traz estratégia de cache, comportamento offline e edge case próprio para manter. Browser, mobile e desktop já estão cobertos por rede local + Electron (brief, 3.5).

Não adicionar por conta própria. Se surgir a demanda de "adicionar à tela inicial", é uma conversa de algumas horas.

## Tipos: gerados do contrato, nunca escritos à mão

Não há monorepo — decisão do dono do projeto, não reabrir (brief, 3.7). O que atravessa
os dois repos é um contrato gerado:

```
Zod no servidor  ──>  openapi.json  ──>  src/infra/lib/api-types.ts (aqui)
```

- **`api-types.ts` é derivado.** Versionado, sim; editado à mão, nunca. Se ele estiver
  errado, quem está errado é o spec ou o gerador
- **De onde vem o spec:** `../server/openapi.json` com os dois repos lado a lado, URL da
  release em CI
- **Regenerar é parte da mudança**, não tarefa separada. Consumir campo novo sem
  regenerar é como o cliente fica mentindo sobre o contrato

Mesmo com tipo gerado, **este repo não quebra em build quando o servidor muda o
contrato** — quebra em runtime, depois do deploy, na instalação de quem atualizou só um
lado. Por isso o `BREAKING CHANGE:` no commit do servidor importa tanto, e por isso o
brief pede detector de divergência do spec.

## Toda tela nasce como mockup

Nenhuma tela se constrói direto em React. Antes existe `../design/mockups/<rota>.html`, aprovado, com os quatro estados desenhados — vazio, carregando, erro e cheio demais.

**Tela de DETALHE tem um quinto: não-encontrado** (design system, seção 6, 31/08/2026). Toda rota com id no endereço pode responder 404, e ele **não** é o estado de erro: no erro o servidor não respondeu, no 404 ele respondeu e respondeu certo. A consequência prática é que ele não oferece "Try again" — repetir dá 404 de novo —, e sim a volta pra listagem de onde o objeto veio.

O que isso significa na prática ao implementar:

- **As classes do Tailwind vêm do mockup**, quase sem tradução. O que muda é o wrapper: `<div>` vira componente, gradiente vira `<img>`, dado falso vira prop
- **Os tokens são os mesmos.** `src/styles/globals.css` importa `./tokens.css` em vez de redefinir cor e tipografia — essa é uma cópia versionada de `design/tokens.css` (25/08/2026: `design/` não é repositório git, então o client não pode importá-lo direto sem quebrar fora desta máquina). Mudou o design system? Edita lá, copia pra cá — sem sincronização automática ainda. Se você se pegar escrevendo um valor de cor aqui, parou de seguir o design system
- **Movimento também é token** (design system, seção 11): `--motion-micro/chrome/ambient` e `--ease-chrome`, usados como `duration-[var(--motion-chrome)] ease-chrome`. Duração ou curva escrita à mão no componente é o mesmo erro que cor crua. Keyframes são outra coisa — coreografia de um componente específico mora junto dele (ex.: `components/home/widget-miniature.css`), só os tokens são do sistema. **A exceção é `styles/motion.css`** (30/08/2026): ele tem keyframes e mesmo assim é sistema, porque vale pra TODO overlay do app — folha e popover — e não pra um componente. Ele existe porque as classes `animate-in`/`fade-in-0`/`zoom-in-95` que o shadcn escreve vêm do plugin `tw-animate-css`, **que nunca foi instalado aqui**: o CSS gerado não tinha nenhuma delas e todo overlay aparecia num quadro só. Duas armadilhas ficaram comentadas lá: precisa ser `animation` e não `transition`, senão o Radix corta a SAÍDA (ele espera `animationend`); e o `fill-mode` de entrada é `backwards` e não `both`, senão sobra um transform identidade na folha aberta — e elemento transformado vira bloco contêiner de filho `position: fixed`, que é o que quebraria o arrasto pra fora do `widget-picker`
- **Carregando tem limiar, e ele não é token** (design system, seção 11, 30/08/2026): 200ms antes de o esqueleto aparecer, 300ms de permanência depois que apareceu (`hooks/use-delayed-pending.ts`). Os tokens acima são a *duração* de uma transição; estes decidem *se ela acontece*. O motivo é o servidor ser um arquivo local — a resposta típica volta em milissegundos, e sem limiar o esqueleto pisca um quadro. **Isso trata a espera curta; a piscada de trocar de recorte é outro problema**, e a resposta dela é `keepPreviousData` — a lista anterior fica na tela até a nova chegar
- **Componente do shadcn é escrito à mão no mockup**, então a tradução não é literal: onde o HTML simula um `<Dialog>`, aqui entra o componente de verdade
- **O mockup morre depois.** Construída a tela, o arquivo sai de `design/mockups/` — e o que ele ensinou já subiu para o design system

Divergência entre mockup e design system: **o design system vence**, e o mockup é que estava desatualizado.

**Três coisas que o mockup nunca mostra, e que já cobraram** (design system, seção 8, quarta leva — 31/08/2026):

- **A ordem em que a tela testa seus estados é decisão de design.** Estado que já tem resposta vem antes de estado que espera, e o mais específico antes do mais genérico. `/piles/:id` de uma pilha inexistente carregava pra sempre porque o esqueleto era checado antes do 404, e a segunda consulta seguia tentando enquanto a primeira já tinha respondido
- **Peça que entra numa linha entra DENTRO do padding e do gap dela.** A alça de arrastar nasceu irmã da linha e o título caiu 12px à esquerda do cabeçalho de colunas — a coluna deixa de ser coluna quando uma peça está fora do ritmo. No mockup as duas peças nunca aparecem lado a lado
- **Affordance de "tem mais" se mede.** O `More` de um texto truncado sai de `scrollHeight > clientHeight`, com `ResizeObserver` porque a largura muda com a janela e com a sidebar recolhendo. Contar caracteres é chutar com fonte elástica, e o botão aparece prometendo um resto que não existe

**Ação que aparece no hover precisa de um caminho no toque, e ele não é "mostrar o véu sempre"** (design system, seção 5, 31/08/2026). Escurecer toda carta permanentemente deixa a grade ilegível — a arte é o conteúdo. No toque os botões ficam visíveis num canto, sem véu (`components/home/home-motion.css`, `@media (hover: none)`). O gatilho é o **dispositivo apontador**, nunca a largura da tela: tablet com caneta e desktop com touch existem, e um breakpoint erra nos dois.

**E uma armadilha de ferramenta, não de design: `npx tsc --noEmit` neste repo não checa nada.** O `tsconfig.json` tem `"files": []` e usa project references, então o comando sai limpo sem ter olhado um arquivo. O typecheck real é **`tsc -b`** (o que `bun run build` faz). Descoberto em 31/08/2026, depois de um bom tempo verificando com um no-op.

## O modelo de layout da Home

Fechado em 28/08/2026 depois de três reescritas. A regra pura mora em
`domain/widget-fit.ts`; isto aqui é o resumo do que **não** se muda sem motivo:

- **Linha é grupo explícito: widgets com o mesmo `y`.** Não é sobreposição de
  faixa vertical. Com vizinhos de alturas diferentes, faixa cria fronteiras
  fantasma — um widget de altura 3 ao lado de um de altura 5 deixava de ser
  vizinho ao passar de `y=3`, e o preview piscava entre 6 e 10 colunas com o
  mouse parado. **Altura não decide vizinhança; `y` decide**
- **A linha se divide entre quem está nela.** Sozinho o widget ocupa a linha;
  ao receber outro, dividem; dentro da linha, arrastar pros lados reordena sem
  redimensionar ninguém
- **A largura de uma linha é o espaço livre naquela altura**, nem sempre as 12
  colunas — é o que torna alcançável o espaço em L ao lado de um widget alto
- **Tudo sobe até encostar** (compactação vertical). Não existe linha vazia, e é
  isso que dá o limite do arrasto de graça: soltar em qualquer profundidade para
  na primeira linha livre
- **O resize empurra: companheiro de linha pro lado, quem está embaixo pra
  baixo** (29/08/2026). Só quem começa **acima** e cruza a faixa é parede dura
  — ninguém sobe, porque a compactação já encostou todo mundo. A altura não tem
  mais teto de vizinho; o único `maxH` é o do tipo (`scroll` trava em 4). Antes
  o primeiro widget de baixo era parede, e mudar a altura de um widget no meio
  da tela obrigava a tirar os de baixo do caminho antes — o trabalho manual que
  o modelo existe pra poupar. O empurrão vertical não tem código próprio: é a
  compactação fazendo o serviço assim que o teto some

Duas armadilhas que custaram caro e estão comentadas no código:

- **O arrasto lê a posição do CURSOR, não do layout.** Ler do layout realimenta:
  o widget muda de largura, passa a colidir, a lib empurra o vizinho, a
  geometria muda, o `y` derivado dela volta atrás — e o preview pisca um tick
  sim, outro não
- **Cada gesto tem o seu gancho.** Arrastar é `compactor` (dividir linha mexe
  nos vizinhos, e constraint nenhum alcança outro item); resize é
  `constrainSize` (precisa rodar **antes** do placeholder ser montado, senão ele
  anuncia um tamanho e o widget vira outro ao soltar)

## Duas formas de chrome, e a escolha é de componente

Fechado em 29/08/2026 (design system, seção 5).

- **Desktop:** sidebar de 240px, recolhível pra 64. O gatilho é **manual, nunca
  por breakpoint** — barra que se recolhe sozinha desfaz a escolha de quem a
  abriu. A preferência é do aparelho, então mora em `localStorage`
  (`hooks/use-collapsed-sidebar.ts`), não na URL nem no servidor
- **Celular:** barra de abas com quatro destinos; `Settings` no menu de conta. A
  regra de seleção é **hábito, não inventário**: tela nova não ganha aba por
  existir, e não há aba "More"
- **Os cinco destinos vivem numa lista só** (`NAV`, em `app-shell.tsx`), que a
  sidebar e a barra de abas consomem. Duplicar os ícones seria garantir que um
  dia divergissem

**Settings é uma TERCEIRA forma, e é um modo — construída em 31/08/2026**
(design system, seção 5; `components/chrome/settings-shell.tsx`). Entrar em
`/settings` troca a sidebar do app pela coluna de seções; sair
devolve a sidebar exatamente como estava, porque a preferência de recolhida
continua em `localStorage` e a troca é **por rota, não por breakpoint**. A regra
de 29/08 fica inteira: nenhuma largura de tela mexe na sidebar.

- A coluna agrupa por audiência — `YOU` e `THIS INSTANCE` —, e para quem não é
  admin some o **grupo inteiro**, título junto. Esconder não é proteção: quem
  protege é o `adminMiddleware` do servidor
- Cada seção é **rota-filha** (`/settings/media-types`), não estado de componente
- **`/settings` sem seção é o primeiro nível, não um redirecionamento**: no
  celular ele é a lista de seções (master-detail), no desktop ele mostra a
  primeira seção visível. A mesma URL rende as duas porque o master-detail é a
  versão estreita do mesmo par
- A saída do modo é **uma peça só**, no topo da coluna, igual nas duas
  plataformas — é o primeiro "voltar" que este app tem
- **Só entra na coluna o que existe.** Hoje são `Account`, `Preferences`,
  `Import`, `Export`, `Media types`, `Providers`, `Network` (condicional — quem
  decide se ela existe é o SERVIDOR) e `Storage` — "affordance descreve o que
  existe".
  **E desde 05/09/2026 `Notifications` mudou de objeto**: a central de leitura é
  o SINO e a rota `/notifications`, fora de Settings; a seção guardaria só as
  preferências de quais avisos receber, e não entra enquanto não houver o que
  desligar. **`Import` entrou em 07/09/2026** (`src/components/settings/import-section.tsx`,
  brief 3.12). Ela nasceu com UMA das três fontes que o mockup desenha e **ganhou
  as outras duas no mesmo dia**, quando o servidor as construiu — o CSV continua
  largo porque é o nosso formato e não um serviço a reconhecer, que é **a peça
  sobrevivente mantendo a forma que tinha no desenho** (design system, seção 8,
  décima quinta leva). **Quais fontes existem é resposta do SERVIDOR**, nunca uma
  constante daqui: ele sabe se esta instalação tem a chave do MyAnimeList, e a
  fonte que não pode rodar diz o motivo na própria caixa — `not-configured`
  oferece Providers, `unverified` (o AniList, escrito sem poder ser medido) não
  oferece nada, porque não há o que configurar. **A saída faz parte da recusa**:
  mandar o admin conferir configuração correta é a mesma má atribuição que o
  conserto do 403 tirou da busca. **As três fontes ficaram disponíveis em
  07/09/2026** — o `unverified` do AniList era constante do servidor, não
  checagem —, e a tela passou a dizer **por que** um import não rodou: o bloco de
  resultado mostrava só "didn't run" enquanto o motivo vivia só no sino, e a
  frase agora mora em `importCopy.failed.why`, de onde o sino a importa. **A grade dela é de DUAS colunas com o CSV
  ocupando a fileira inteira** (`sm:grid-cols-2` + `sm:col-span-2`), e ela voltou
  assim em 07/09 depois de dois dias empilhada em coluna única: a forma de
  exceção do dia em que havia uma fonte só sobreviveu à exceção, e a ordem vinha
  do array de `sources` — que diz QUAIS fontes existem e nunca disse como elas se
  arrumam. **A troca pro estado "importando" tem movimento** (`import-motion.css`,
  `hooks/use-climbing-number.ts`): a caixa entra com `--motion-chrome` e o
  contador SOBE entre dois valores já confirmados pelo servidor, em vez de saltar
  a cada poll de 2s — re-temporizar contagem que já foi verdade é honesto,
  extrapolar não seria. **E não há barra em lugar nenhum**: enquanto a fonte é
  lida não existe denominador, e ali vai uma frase com um ponto pulsando —
  atividade, nunca proporção. O pulso é loop ambiente e `prefers-reduced-motion`
  o apaga; a entrada, que é transição de estado, fica. `About`
  fica fora dos dois grupos, no fim: versão e licença não são de ninguém, e é
  ele que garante que a coluna nunca fique oca
- **O selo da coluna é um CONTADOR, e vive no SHELL** (`SectionBadge` +
  `usePendingBySection`). Ele fica aqui e não na seção porque existe pra ser
  visto **de fora** dela. **O que ele conta é a regra toda**, e é pura
  (`domain/provider-status.ts`): só provedor que SERVE algum tipo — provedor
  ocioso não é pendência, e sem esse recorte o número nunca chegaria a zero.
  Pílula **sólida**, porque a tingida ficava em 1,33:1 contra o card
- **A guarda de sessão saiu de dentro das rotas, e desde 04/09/2026 não sobrou
  cópia nenhuma** (`hooks/use-require-session.ts` +
  `components/chrome/session-pending.tsx`). Ela nasceu com as quatro rotas de
  Settings; as quatro antigas — `/`, `/library`, `/piles` e `/piles/:id` —
  migraram num `refactor` próprio, separado de tela nova, porque quatro rotas
  dentro do PR de uma feature dão um diff que ninguém revisa. Toda rota de
  produto chama o hook; **`/login` e `/setup` de propósito não chamam**.
  **Isso NÃO traz o portão de primeiro uso pro hook**, e o argumento dele
  melhorou em vez de cair: ele nasceu no `__root` porque as quatro ficariam de
  fora, e fica lá porque `/login` e `/setup` são justamente as telas em que ele
  precisa valer — `pending` é fato da INSTALAÇÃO, e um hook de sessão responde
  outra pergunta

**Criar oferece o template antes do branco — construído em 31/08/2026** (design
system, seção 5; `components/settings/template-picker.tsx`). O wizard de primeiro
uso deixa a instalação com só os tipos que o admin mantiver (brief 3.9), então
`Add type` **não** abre formulário vazio: mostra os templates embarcados
(`GET /api/media-types/templates`), com "começar do zero" como saída. **O
template PREENCHE a folha e nunca cria direto** — salvar passa pelo mesmo `POST`
do branco, porque criar num clique tiraria a chance de trocar o nome antes de o
slug ser derivado dele, que é irreversível. Vale onde quer que o produto
embarque um conjunto pronto — formulário em branco onde existe template esconde
do usuário uma coisa que o produto tem.

**A preferência de tipos recorta a OFERTA, nunca o conteúdo — 04/09/2026**
(decisão do dono; `domain/media-visibility.ts` com spec,
`hooks/queries/media-types/use-offered-media-types.ts`). Quatro regras que valem em
qualquer controle novo:

- **Quem oferece tipo lê `useOfferedMediaTypes`; quem LISTA obra não.** Os chips e o
  menu de `/library`, o filtro de widget e de pilha, o escopo de `/search` e o seletor
  da folha de criar obra passaram a ler a preferência. Nenhuma consulta de obra passou:
  a obra de um tipo escondido continua na biblioteca, na pilha e no widget, senão a
  contagem de uma pilha deixaria de bater com o que se vê. **`useMediaTypes` continua
  sendo o vocabulário inteiro**, e é o que Settings usa — o admin não pode perder de
  vista um tipo por tê-lo escondido pra si
- **O que já está ESCOLHIDO nunca sai da oferta** (`keep`). É a regra dos chips de
  29/08 — filtro invisível é filtro esquecido — um nível acima, e aqui ela tem uma
  segunda cara: esses recortes viajam na URL, então `?type=game` chega de fora e
  esconder o chip deixaria a tela num recorte que ninguém vê nem desfaz
- **Enquanto a preferência não chegou, a oferta é VAZIA, não é tudo.** Renderizar a
  lista inteira faria o chip de um tipo escondido aparecer por um quadro e sumir — e
  peça que sai sozinha se lê como defeito
- **Preferência não usa vocabulário de formulário.** Toggle anuncia efeito imediato
  (é o que `role="switch"` significa), então a escrita é otimista e não há `Save`. A
  volta atrás é o **cache anterior inteiro**, não o inverso do que se mandou, e a
  falha diz que voltou numa frase embaixo da lista — o app não tem toast

**E construir isso achou duas coisas que só a tela rodando mostra:**

- **Copy não enumera um conjunto que o DADO controla.** O estado vazio de `/library`
  dizia "films, series, anime, manga, games and books" com quatro chips na fileira. Já
  era frágil desde que o enum abriu (30/08) e o wizard passou a apagar tipo. Derivar a
  lista do vocabulário não conserta: prometeria a quem lê exatamente o que ele escondeu
- **Padrão de formulário se deriva do vocabulário, não de uma constante.** A folha de
  criar obra nascia em `'anime'` escrito em código — uma instalação que apagou aquele
  tipo já abria num tipo inexistente. Agora o estado nasce `null` e o padrão é o
  primeiro tipo OFERECIDO

**`lucide-react` deixa de ser dependência de um ícone só — 31/08/2026.** Hoje ela
entra só pelo `XIcon` do `ui/sheet.tsx`. Com tipo de mídia criado pelo usuário, o
ícone passa a sair de um **acervo curado de ~80 a 120 glifos** do Lucide, e o
critério é legibilidade a **12px dentro do selo de vidro** — não quantidade
(design system, seções 2 e 5). Duas consequências pro código:

- **`components/media/media-type-icon.tsx` deixa de ser a fonte dos seis.** Os
  glifos desenhados à mão migram pro acervo, e o componente passa a resolver um
  NOME de glifo vindo do dado. Ícone que só o embutido pode ter é o "atalho de
  embutido" que o brief 3.10 recusa
- **O acervo é uma lista explícita, não `import * from 'lucide-react'`.** O
  import nomeado é o que mantém o tree-shaking; puxar o índice inteiro pra um
  seletor que se abre uma vez na vida do tipo inflaria o bundle de um app que
  roda self-hosted, sem CDN
- **A lista NÃO se escreve aqui.** Ela é `z.enum` no servidor e chega por
  `api-types.ts` (brief, 3.7). São **94 glifos** desde 31/08/2026, curados
  medindo a 12px. Duplicá-la deste lado é o erro que o item 10 do handoff já
  descreve
- **Sem ícone de marca.** O Lucide removeu os dele por trademark, então tipo
  definido pela plataforma ("vídeos do YouTube") usa o grupo de tela:
  `monitor-play`, `circle-play`, `video`, `list-video`, `play`

**A Home tem dois componentes, não dois estilos.** `HomeGrid` no desktop,
`HomeStack` no celular, escolhidos por `hooks/use-compact-viewport.ts`
(`matchMedia`, não `innerWidth`). A grade do `react-grid-layout` não encolhe pra
330px de um jeito operável: doze colunas dão coluna de 12px. A pilha preserva a
**altura** de cada widget, porque é ela que faz a fileira de cartas fechar — a
largura nunca entrou nessa conta.

Sem Edit Layout no celular: não há grade pra editar, e a barra flutuante
disputaria o canto da barra de abas.

Duas armadilhas de CSS que custaram tempo aqui:

- **`min-w-0` na `<aside>`.** Como item de flex ela herda `min-width: auto`, que
  é o min-content do conteúdo — e isso vencia o `w-16`, deixando a barra com a
  classe de recolhida e a largura de aberta
- **`sticky top-0 h-svh` na `<aside>`.** Sem isso ela esticava até a altura da
  PÁGINA, e o rodapé — identidade e sessão — descia junto com qualquer conteúdo
  longo

## A carta encaixa na grade — e é aritmética, não estilo

Fechado em 29/08/2026. A regra pura mora em `domain/home-metrics.ts`, com
testes; `components/home/resize-constraint.ts` a consome. O resumo:

- **A altura da carta é fixa (200px); a largura é uma faixa.** Só a altura
  entra na conta. Na grade a trilha é `1fr` — preenche a largura sempre, sem
  faixa morta e sem transbordo — e a carta cresce até
  `--spacing-card-poster-max` (150px, 3:4); o que passar vira espaço simétrico
  entre as cartas. Na rolagem a largura é fixa no piso (133,33px, 2:3), porque
  ali não há trilha pra preencher.

  > Fixar os dois eixos "por simetria" foi o erro da primeira versão, e ele
  > custou uma faixa morta de quase uma carta em tela larga. Quando um número
  > precisa ser exato, prender o vizinho junto parece cuidado e é restrição.
- **Toda altura DA GRADE DA HOME é múltipla de 72px** (a linha de 56 mais o
  gap de 16). Linha de lista: 56. Chrome do widget: 72 cravado. Carta: 200,
  porque `200 + 16 = 3 × 72`. **O passo é desta grade, não do app** (design
  system, seção 4, 29/08/2026): fora de um widget não há encaixe a respeitar, e
  é por isso que as listas de `/library` são contíguas e a carta compacta tem
  150 de altura
- **O resize para só onde a fileira fecha.** `snapHeight` arredonda pra baixo,
  por tipo: lista anda de 1 em 1, grade de 3 em 3, e `scroll` trava em 4 — uma
  fileira só, que é a definição do tipo
- **`snapHeight` roda depois do `clampResize`, nunca antes.** Ele só arredonda
  pra baixo, então nessa ordem não desfaz o piso que o tipo impôs
- **O `maxW` do item vem do layout, via `resizeRoom`.** A lib o converte em
  limite de PIXEL no elemento arrastado, e é o único jeito de o widget parar no
  vizinho junto com o preview — o elemento acompanha o cursor por design da lib
  e não passa por constraint nenhuma. Sem isso, o preview parava certo e o
  widget passava por cima. **Só largura:** o `maxH` do item vem de `metricsFor`
  (o teto do tipo) e nunca do espaço, porque na vertical quem está no caminho
  desce

Três armadilhas que já cobraram o preço, e estão comentadas no código:

- **Contorno é `ring`, não `border`.** Com `box-sizing: border-box` a borda sai
  de dentro da altura: 1px em cima e 1px embaixo fazem o chrome valer 74 em vez
  de 72, e a última fileira é cortada em 2px
- **O header do widget tem altura fixa (`h-6`).** Os botões só existem no Edit
  Layout; sem isso o chrome encolhe 8px ao sair do modo, e o conteúdo muda de
  altura sozinho
- **A fileira de `scroll` usa `scrollbar-none`, não `scrollbar-styled`.**
  `scrollbar-width: thin` reserva ~8px de altura no Windows e no Linux, e esses
  8px sairiam de dentro dos 200px da carta
- **`resizeRoom` não infla a caixa pra medir.** A faixa vertical é o que
  separa companheiro de linha de parede de cima; alargá-la "pra medir o máximo
  possível" muda a resposta. A versão que inflava fazia a lista encolher
  sozinha de 5 colunas pra 2, e a mesma armadilha reapareceu no gesto diagonal
  quando a altura ficou livre — os dois casos têm teste

O snap lê só o **tipo** do widget, que é dado estático — nunca a geometria do
conteúdo renderizado. Derivar restrição de layout do que está na tela é a mesma
realimentação que custou três reescritas do modelo de grade.

## O scrim da carta se mede contra o PIOR CASO

01/09/2026, design system, seção 9. O degradê sob o título tinha sido calibrado
contra o **ladrilho neutro** — a inicial sobre fundo escuro — e nunca tinha visto
um pôster; a arte de provedor em `/search` foi a primeira vez que uma capa de
verdade entrou numa carta.

- **A conta é contra um pôster BRANCO**, que é o pior caso. Arte não tem cor de
  token, e não dá pra inspecionar toda capa que existe — o pior caso é o único
  jeito prático **e** o jeito certo de especificar um scrim
- **`from-35%`, e o número sai da geometria:** a faixa tem 75px e o título vive
  entre 27 e 43px acima da base, então com a rampa começando na base ele cavalga
  o meio dela. Sólido até 35% leva o topo do título de **2,56:1 pra 5,36:1**
- **Vale nas duas cartas** — `components/media/entry-card.tsx` e
  `components/search/search-results.tsx`. Na primeira não muda nada visível hoje,
  porque ela ainda desenha a inicial num degradê escuro; muda quando o cache de
  arte trouxer os mesmos pôsteres pra lá
- **Medir token resolvido passa pelo canvas.** `getComputedStyle` devolve
  `oklch()` cru; preencher 1×1 e ler o pixel é o que dá sRGB

Medir sobre a arte real, dentro do navegador, **não deu**: `crossOrigin` bate no
cache sem headers de CORS, cache-buster na query a CDN do TMDB recusa, e
`fetch` + `createImageBitmap` a extensão intercepta.

## A arte da busca é EMPRESTADA — e por isso é hotlink

Brief, 3.10, 01/09/2026. A carta de `/search` aponta direto pra CDN do provedor,
e a arte de obra da biblioteca vai pro cache em disco (que ainda não existe). Não
é inconsistência: **a exigência de offline segue o objeto, não a tela** — um
resultado de busca vive segundos, numa tela que sem rede não mostra nada de
qualquer forma.

**O cliente não monta URL de arte.** Quem monta é o servidor, a partir do
`art_template` da definição — pôr `image.tmdb.org` no cliente seria o
`if (slug === 'tmdb')` que o brief recusa. O campo chega pronto ou **nulo**, e
nulo cai no ladrilho com a inicial, nunca em imagem quebrada.

## O seletor de pilhas, e o que ele ensinou sobre painel flutuante

01/09/2026, `components/piles/pile-picker.tsx`, dentro da folha de adicionar
obra. **Botão + popover, nunca fileira de chips**: pilha não tem teto, e sem
teto o controle é menu (design system, seção 5) — o que cresce sem teto é o
INVENTÁRIO, não a escolha, então o escolhido volta como **chip removível**,
porque escolha invisível é escolha esquecida.

**Criar acontece aqui**, e é o "gesto de meio de tarefa" que a decisão de 29/08
previu sem nenhuma tela exercer: o texto da busca **é** o nome, então continua
sendo um campo só. Reusar o `CreatePilePopover` aninharia popover em popover,
com foco preso em dois níveis e o mesmo nome digitado duas vezes.

Três coisas vieram de ver rodando, e **nenhuma existe num formulário parado**
(design system, seção 8, nona leva):

- **Os chips ficam SOB o gatilho.** Acima, escolher a primeira pilha empurrava
  o botão 40px e o painel, ancorado nele, andava **no instante do clique** —
  escolhe um item, mira o seguinte, acerta um terceiro. **Peça que ancora
  painel flutuante não pode ter conteúdo elástico acima dela**
- **`side="top"` é fixo.** A altura do painel segue a contagem de resultados;
  ao filtrar, a lista encolhia, passava a caber embaixo e o painel
  **teleportava pro outro lado do gatilho no meio da digitação**. A colisão
  segue ligada: virar por não caber é certo, virar por conveniência não
- **Criar fecha o painel.** Limpar o filtro traz a lista inteira de volta, e um
  painel ancorado pela base cresce **pra cima, sob o cursor que acabou de
  clicar**

**Invalidar `pileKeys` só quando houve pilha** (`use-create-entry.ts`): nascer
dentro de uma pilha muda `entryCount`, o mosaico e o `updated_at` que ordena
`/piles`. Invalidar sempre faria toda obra digitada à mão refazer uma listagem
que não mudou.

## A tela de detalhe são DUAS telas e um molde — `TitleDetail`

01/09/2026. `/library/:id` é a obra que é sua; `/search/:provider/:id` é a do
provedor, ao vivo. Decisão do dono, pelo motivo da fonte — uma lê cache, a outra
depende de terceiro —, com o mesmo visual. Então o componente é um só e o que
difere é o que entra em `estado`.

- **Tela cheia, nunca folha.** O detalhe cresce pra lista de episódios; a folha
  continua sendo o FORMULÁRIO
- **`rating` e `notes` ganharam os primeiros editores do app.** Nota é campo de
  número e não estrelas — 0–10 com uma casa não cabe em estrela —, grava no
  **blur** (porque `8` a caminho de `8.4` viraria escrita), e as notas gravam
  com debounce **dizendo na própria peça** que gravaram, já que não há toast
- **As pilhas aparecem NAS DUAS formas, e é decisão do dono — 02/09/2026.** Na
  coluna fica o `PilePicker` (botão + chips), no `⋯` fica o `EntryPiles` (o
  painel da carta). Cada um está onde foi desenhado pra estar: o `EntryPiles`
  nasceu pra popover — cabeçalho próprio, lista aberta, busca a partir da quinta
  pilha — e numa coluna de 200px duplicaria rótulo. Duplicidade **consciente e
  temporária**: as duas ficam até o dono escolher uma. O que muda em relação à
  folha é o MOMENTO — aqui cada toque escreve
- **A esquerda é uma COLUNA contínua, a direita é só conteúdo.** A primeira
  versão empilhava o formulário ao lado do pôster, e o dono chamou de
  "desalinhado e desconexo" — a esquerda morria em 300px e a direita seguia por
  800. A divisão não é de tamanho, é de assunto: **o que é estado do leitor fica
  na coluna, o que é a obra fica no conteúdo**
- **Peça com largura máxima própria precisa poder encolher abaixo dela.** O chip
  de pilha limitava o rótulo em `max-w-40` e transbordava a coluna de 200px —
  item de flex nasce com `min-width: auto`, então o teto vira **piso** em todo
  container mais estreito
- **A carta INTEIRA é o link, desde 07/09/2026** — e esta linha dizia o
  contrário, com o motivo errado. O que bloqueava não era o `opacity` da camada
  de atalhos criando contexto de empilhamento: era ela ligar `pointer-events` no
  hover, cobrindo `inset-0` e absorvendo o clique exatamente quando alguém
  clica. Agora a camada é `pointer-events: none` para sempre e quem captura são
  os dois botões dela (`CARD_SHORTCUT`), que juntos ocupam ~76×32 no centro. O
  link fica logo depois da arte e **sem `z-index`**, o que o põe abaixo da
  camada, dos selos e da faixa — nenhum deles precisou mudar de `z`. A faixa de
  baixo ganhou `pointer-events-none` (o clique no título tem de chegar ao link)
  e o contador voltou ao fluxo com `pointer-events-auto`. **A régua que fica:**
  ela nunca foi *"carta linka pelo título"* — era *aquela carta só CONSEGUIA
  linkar pelo título*, e a distinção estava escondida atrás de um detalhe de CSS

## A caixa de fontes, e o preview que é a própria tela

02/09/2026, em `/library/:id`. `components/media/title-sources.tsx` e
`source-preview-bar.tsx`. Uma obra pode falar de mais de um provedor, e é aqui
que isso se vê e se escolhe — o que acendeu um dado que existia e era invisível.

- **A caixa NÃO some vazia**, ao contrário de `Details` e `Links`: o estado vazio
  é o mais comum que existe (toda biblioteca montada antes de haver provedor), e
  é ele que precisa do convite `Link`
- **A linha inteira é o alvo e abre um painel** com `Make source`, `Unlink` e
  `Cancel`. Um `×` de 28px numa coluna de 200 cairia
  abaixo do alvo mínimo da #8 (fechada em 07/09/2026 com 44px no toque) **e**
  encostaria a ação destrutiva na não destrutiva. Na linha que já
  É a fonte, `Make source` não aparece
- **O preview de uma tela é A TELA.** A primeira versão eram dois cartões na
  coluna, com as sinopses cortadas a 11px, e o dono foi direto: "não dá pra ver
  quase detalhe nenhum". A página passa a renderizar **como ficaria** —
  `TitleDetail` já era o molde de `/search/:provider/:id`, então prever é o
  TERCEIRO chamador dele, sem componente novo e sem rota nova — e a decisão vira
  barra flutuante de vidro, a mesma casca da barra de layout da Home
- **A coluna esquerda não muda durante o preview**, e é isso que prova "nothing
  you tracked changes" sem pedir que se acredite na frase
- **Marcar unidade fica DESLIGADO no preview**: mover o contador a partir de uma
  tela não confirmada escreveria no log append-only por causa de uma previsão
- **Copy que enumera um subconjunto sugere que o resto não sobrevive.** A
  confirmação de desvincular listava três coisas quando sobrevivem seis; virou
  frase que cobre tudo. Mesma família do artigo interpolado

Duas armadilhas de `<img>` que este ciclo cobrou, as duas em `RemoteArt`:

- **`loading="lazy"` não reavalia quando o `src` muda.** Num elemento que o
  navegador já resolveu, a imagem nova fica pendente **pra sempre**. Medido: uma
  `new Image()` com a mesma URL carregou em 11ms enquanto o `<img>` da página
  seguia em `complete: false` depois de seis segundos. O pôster do detalhe é
  `eager` — é o único lugar onde o `src` de um pôster troca sem remontar
- **Estado de falha guarda QUAL `src` falhou, não SE falhou.** Como booleano ele
  nunca voltava atrás: uma URL que falhasse condenava todo `src` seguinte ao
  ladrilho, sem sequer ser tentado

**E uma TERCEIRA que é do ambiente, não do código — 03/09/2026.** Ela está aqui
porque a assinatura dela é **idêntica** à da primeira, e por isso o conserto
errado é o caminho natural: numa grade sem arte, 2 requisições pra 11 `<img>`, e
trocar `loading` pra `eager` resolvendo na hora. Conferido numa tela
pré-existente, mesmo sintoma — o que parecia provar defeito de app.

Era `document.visibilityState === 'hidden'`. **O Chrome adia `loading="lazy"` em
aba que nunca é pintada**, e forçando uma pintura as 18 de 18 carregaram sem
mudar uma linha. **`RemoteArt` está certo; não o conserte.** Antes de concluir
que a página está errada, conferir se o ambiente que a mede está vivo —
`visibilityState` e `hasFocus()` ao lado de `naturalWidth`. É a irmã de
"screenshot de página com imagem mente", um nível abaixo dela.

## O menu de `⋯` é UM — `components/menu/action-menu.tsx`

02/09/2026, apontado pelo dono. Havia **cinco menus escritos à mão e nenhum
igual ao outro**: `w-56` contra `w-64`, texto de 12px contra 14, ícone de 14
contra 16 (e um sem ícone nenhum), divisória tingida contra `border-t`, e o item
destrutivo vermelho **só no hover** em três deles. Nada disso tinha sido
decidido — cada arquivo copiou o anterior sem olhar o primeiro.

- **O que se padroniza é o PAINEL, não o gatilho.** O da carta é redondo e de
  vidro sobre a arte, o da linha aparece no hover, o do título tem 44px — essas
  diferenças respondem ao lugar e são reais
- **Destrutivo é vermelho em repouso**, e todo item tem ícone
- **A régua: peça que aparece em três telas vira componente**, senão a quarta
  escolhe de novo e escolhe diferente
- **Componente que ganha `Popover` próprio não pode continuar dentro de um.** O
  menu da carta era só CONTEÚDO; ao virar `ActionMenu` ficou popover dentro de
  popover, e o de fora abria mostrando o gatilho do de dentro

## As unidades, e o offset absoluto — `domain/unit-offset.ts`

**Marcar é mover o contador**, não gravar episódio (brief, 3.11) — não há tabela
de unidade. O provedor numera dentro do grupo, o contador é absoluto, e a
tradução é somar o que veio antes.

- **O grupo ZERO fica fora da sequência.** Não é conhecimento do TMDB: numeração
  começa em 1. O contador não conta especiais, e somá-los deslocaria a série
  inteira. O próprio grupo 0 não tem offset e **não ganha marcação** — melhor
  não marcar que marcar errado
- **O grupo padrão é o primeiro da sequência principal**, não o primeiro da
  lista: os especiais voltam primeiro do TMDB
- **Sem contagem de um grupo anterior, o offset é nulo** e a marcação some. A
  lista vira leitura
- **Lista vertical, nunca fileira.** Carrossel está recusado desde 23/08, e a
  referência mostrava o preço: thumbs idênticas com a descrição cortada
- **O grupo pode NÃO existir, e isso é um caminho.** Provedor que numera sem
  agrupar — anime no Jikan — tem `hasUnits` verdadeiro e `unitGroups` vazio, e
  `defaultGroup([])` devolve nulo. A condição que exigia grupo ativo escondia a
  lista inteira: metade do desenho de unidades nunca tinha sido exercida, porque
  o único provedor com unidades agrupava. O título da seção cai então na
  **unidade de progresso do tipo**, que chega plural e traduzida do servidor —
  escrever "Episodes" erraria em mangá

## A arte da obra vem do cache do servidor — `EntryArt`

01/09/2026. `EntryArt` desenhava o ladrilho da inicial porque não havia mais
nada a desenhar. A obra passou a carregar **`art`** — um endereço que o
**servidor** monta —, e o ladrilho virou o que sempre foi por baixo: o chão de
quem não tem vínculo com provedor nenhum.

- **`RemoteArt` não mudou, e esse é o ponto.** Ele desenha o endereço que
  receber; qual arte é emprestada (hotlink da CDN) e qual é adquirida (nossa
  rota de cache) é decisão do servidor, e o componente nunca precisou saber
- **O cliente não monta endereço de arte.** Ele chega pronto, como no resultado
  de busca — montá-lo aqui seria o `if (slug === 'tmdb')` que o brief recusa, e
  aqui seria pior: o cliente passaria a saber que existe cache
- **`art` nulo é obra digitada à mão**, que não tem de onde tirar arte enquanto
  não houver como vinculá-la a um provedor (brief, 3.10)
- **`Entry` em `domain/media.ts` ganhou o campo à mão**, que é a dívida já
  listada: o tipo é escrito à mão contra o brief 3.7, e trocá-lo pelo gerado é
  refactor próprio

## A fileira de chips de `/library` se mede — `domain/chip-fit.ts`

01/09/2026. A decisão de 29/08 dizia que filtro que não cabe na fileira se
define no menu e **volta a ela como chip**; faltava a metade que decide o que
não cabe, e sem ela o transbordo era **rolagem horizontal silenciosa no
desktop**. Medido: 8 chips em 784px de uma fileira de 1201, sem teto (o enum de
tipos abriu, brief 3.10).

- **A aritmética é pura e testada** (`domain/chip-fit.ts`), como `widget-fit` e
  `home-metrics`. As LARGURAS vêm do DOM — rótulo é traduzível e a fonte é do
  sistema, então largura de chip se lê, não se calcula
- **Medidas UMA vez e guardadas**, com a chave do vocabulário como estado. É o
  que impede o laço: esconder um chip mudaria a medição que decidiu escondê-lo.
  Vocabulário novo (tipo criado, idioma trocado) invalida sozinho
- **O ativo nunca vai pro menu.** Filtro ligado que não aparece é o defeito que
  a conta existe pra evitar
- **O observador vigia a fileira E o bloco fixo.** Quando o chip de status entra
  ou sai, a largura da fileira não muda — o espaço livre muda
- **Mede a BORDA, não a largura.** `clientWidth` inclui o `px-1` da fileira e o
  rect do bloco fixo começa depois dele; os 8px de diferença deixam entrar um
  chip a mais num limiar, e a rolagem volta
- **No celular sai tudo, rolando.** `useCompactViewport`, e ali quem decide é o
  breakpoint e não o apontador — o que muda junto é o chrome, não o alvo

O menu lista **todos** os tipos, não só os que transbordaram: conteúdo de menu
que depende da largura da janela muda de assunto sem ninguém pedir.

## O menu de filtro abre SUB-VISTA no lugar — 07/09/2026

`components/library/library-menu.tsx`, decisão do dono entre três caminhos.
Medido na tela dele: `Status` são 6 linhas, `Media type` 8 nesta instalação, mais
4 de `Sort by` e a fileira de `View as` — **22 linhas e 4 cabeçalhos** num painel
de 256px, passando de 900px. O teto do popover impedia o vazamento, mas metade
dos eixos ficava abaixo da dobra.

- **Quatro linhas na raiz, cada uma com o VALOR ATUAL à direita.** É a coisa que
  a lista plana não tinha: o recorte inteiro se lê num olhar, em vez de procurar
  quatro vistos em 22 linhas. É isso que paga o clique a mais
- **Não é peça nova.** `ActionMenuBack` + a lista dentro do próprio painel já
  existem em `Add to pile` e no seletor de fonte de `/search`
- **A seção de tipo continua listando TODOS**, sempre (01/09) — a sub-vista não
  esconde nada, só deixa de mostrar tudo ao mesmo tempo
- **A régua que construir rendeu:** *o argumento de uma decisão pode ser sobre
  COMPETIÇÃO por espaço, e quando a competição acaba a decisão não vale mais*. A
  fileira de ícones de `View as` existia porque quatro seções disputavam altura;
  num painel dedicado ela deixava 106 dos 256px vazios, o que se lê como peça
  faltando. O ícone virou o glifo da linha, e a gramática ficou igual às outras
  três

## O arrasto tem endereço próprio onde a linha tem alvos — 07/09/2026

`components/home/widget-content.tsx`, decisão do dono. A linha do widget de lista
era arrastável inteira (`{...listeners}` no `<li>`), contra a regra de 31/08, e
ganhou **alça** como a de `/piles/:id`. Junto vieram o título como `Link` e o
`EntryMenu variant="row"` — ela era o único lugar do app onde a obra não abria
nem oferecia nada.

- **O argumento que sustentava a exceção era de CONTEXTO**, e estava escrito em
  `pile-entry-list.tsx`: widget é caixa pequena e contida, pilha é a tela
  inteira. Ele cai no momento em que a linha passa a CONTER alvos — com
  `activationConstraint: { distance: 6 }`, apertar o título e mover seis pixels
  começava um arrasto em vez de abrir a obra. O comentário desatualizado foi
  corrigido no mesmo commit
- **`touch-none` desce junto com os `listeners`.** Na linha inteira ele engoliria
  a rolagem do dedo dentro do widget
- **Os 56px não se movem** — uma linha de lista é uma linha de grade
  (`domain/home-metrics.ts`) —, e o alvo de 44px da decisão #8 cabe neles
- **A grade e a rolagem do widget continuam arrastando pela carta inteira**, e
  desde que a carta virou link isso é a **decisão em aberto 16** do design
  system. Não resolver por conta própria

## A carta INTEIRA é o link, e o que bloqueava não era o `opacity` — 07/09/2026

`entry-card.tsx` e `library-grid.tsx`, decisão do dono. As três formas de carta
do app concordam: a de busca já era link inteiro, e estas duas linkavam só pelo
título.

O motivo registrado estava **errado**, aqui e no componente: não era o contexto
de empilhamento que o `opacity` da camada cria — ela vem DEPOIS do link no DOM e
os dois estão em `z-index` automático, então os botões dela já pintam por cima.
Era `pointer-events`: a camada cobre `inset-0` e os ligava no hover, absorvendo
o clique exatamente quando alguém clica.

- **Quem captura é a PEÇA, nunca a camada.** `wp-card-actions` fica
  `pointer-events: none` para sempre; os dois atalhos capturam, gatilhados pelo
  hover — **botão invisível com `pointer-events: auto` é alvo transparente** no
  meio da carta. No toque, `home-motion.css` religa os BOTÕES (`wp-card-shortcut`)
- **O link fica sem `z-index`**, logo depois da arte: abaixo da camada, dos selos
  e da faixa. Nenhum deles precisou mudar
- **A faixa de baixo deixa passar** (`pointer-events-none`) e só o contador volta
  ao fluxo, senão o clique no título morreria nela
- **O título vira `<span>`** (`<a>` dentro de `<a>` é inválido) **e o sublinhado
  fica**, como `group-hover`: é o único sinal de navegação que a carta tem, já
  que a camada de hover é sobre AÇÕES
- **`pointer-events` e `z-index` são perguntas diferentes** — pintar por cima não
  impede nada, capturar impede. E **quando um sintoma tem dois candidatos
  plausíveis, o que está na documentação pode ser o errado**: o diagnóstico
  furado estava escrito duas vezes, aqui e no componente, **concordando**, o que
  é o que impede uma cópia de denunciar a outra

## O tema se declara em `color-scheme`, e o `<select>` nativo morreu — 09/09/2026

Relato do dono: na folha de vincular provedor, a lista aberta do dropdown vinha
com o texto invisível. **A causa não era a cor do texto nem a do fundo — ninguém
tinha contado ao navegador que este app é escuro.** `grep -rn "color-scheme"` em
`src/styles/` e no `index.html` não devolvia nada.

O design system decidiu *dark only* em 22/08 e escreveu só a metade visível
(*"não escreva `dark:` em classe nenhuma"*). **A outra metade nunca tinha sido
escrita**, e sem ela toda superfície desenhada pelo AGENTE DE USUÁRIO renderiza
no padrão claro. No print isso é aritmética: o `<option>` herda o `color` quase
branco do `<select>` e pousa no fundo **branco** do popup do sistema — o item
destacado é o único legível, e por acidente.

- **Uma linha no `:root`**, em `design/tokens.css` **e** na cópia de
  `src/styles/tokens.css`, conserta seis superfícies: o menu do `<select>`, o
  botão de escolher arquivo do CSV no import, o mesmo botão na capa de pilha, as
  setinhas do `type="number"` do progresso exato, o autofill da senha no login, e
  a barra de rolagem mais o cursor de texto do app inteiro
- **Os quatro `<select>` nativos morreram no mesmo ciclo, e os dois consertos não
  se substituem.** `components/menu/choice-picker.tsx` é a peça: os quatro sítios
  faziam a mesma escolha de um entre N com painéis escritos à mão, que é a régua
  do `⋯` na terceira família de menus. Mesmo com a declaração, o `<select>`
  continuaria sendo o único controle do app desenhado pelo sistema operacional
- **O que cada chamador guarda é o que é DA TELA dele**, e é a divisão que
  `action-menu.tsx` fixou (padroniza-se o painel, nunca o gatilho): com uma opção
  só, `/search` mostra o nome como TEXTO — o rótulo `Source` ao lado explica a
  palavra — e a folha de vincular esconde tudo, porque ali não há rótulo e
  palavra solta no meio de um formulário não se explica
- **O `Check` estava desenhado três vezes, idêntico — DUAS delas dentro do
  próprio `components/menu/`**, a pasta criada pra tirar exatamente essa
  divergência. Ele e o `Chevron` subiram pro `menu-icons.tsx`: *componente
  compartilhado não impede a duplicação um nível abaixo dele*
- **Trocar o alvo quebra o `<label htmlFor>` em silêncio.** As duas linhas do
  widget eram `<label htmlFor={id}>`; o alvo virou gatilho de popover e o
  `htmlFor` passou a apontar pra id inexistente — **a11y quebrada sem aviso de
  ferramenta nenhuma**. Viraram `<div>`, com o nome acessível vindo do `ariaLabel`
  da peça. **Ao trocar o ELEMENTO de um controle, conferir quem apontava pra
  ele** — e o `disabled`, que vinha de graça no `<select>`, teve que ser devolvido
  à peça nova

## A folha de EDITAR obra, e o tipo que TRANCA — 09/09/2026

`components/library/edit-entry-sheet.tsx`, decisão do dono entre folha própria e
campos editáveis no lugar. Três colunas que a folha de criar escreve não tinham
como ser corrigidas depois — `total`, `title` e `mediaType` —, e **o servidor já
aceitava as três desde sempre**: `UpdateBodySchema` é o corpo de criação
`.partial()`, e nenhuma tela chamava assim.

- **Ela é OUTRO schema, não a de criar com um modo.** Criar escreve seis coisas,
  editar escreve **três**, porque as outras já têm endereço: status é o
  `StatusButton` de toda carta e toda linha, pilhas são o `PilePicker` e o
  `EntryPiles`, procedência é a caixa de `Sources`. **Campo que já tem lugar não
  ganha um segundo**
- **O tipo não se troca quando a obra tem VÍNCULO**, e é consequência da régua de
  07/09 (`external_ids.media_type`): o id do provedor é único **dentro** do tipo,
  então trocar só o da obra deixa os dois discordando e trocar os dois produz uma
  identidade externa **falsa**. O campo nasce livre e tranca, com a recusa
  nomeando o provedor **antes do clique** — o app não tem toast
- **Essa decisão não tem como morar em `domain/`**, porque depende de uma
  consulta (`useEntryLinks`), e é por isso que ela virou o **piloto** da suíte de
  teste de componente

## O que a fila de bugs rendeu em `/search` — 09/09/2026

Dois relatos do dono no mesmo dia, e as duas regras valem em qualquer tela.

- **Controle cuja EXISTÊNCIA depende do estado da tela é controle que não se
  aprende.** O `Source` vivia dentro do ramo `data && …`, então sumia na
  **recusa** — onde trocar de fonte é a única coisa que resolve — e no **vazio**,
  onde se escolhe a fonte antes de digitar. Ele subiu para acima de todos os
  estados: **o que varia é o CONTEÚDO, nunca a posição**. Com uma fonte só ele
  FICA, como texto; o único caso em que não existe se resolve sozinho, porque
  tipo sem fonte nenhuma não tem nome a dizer
- **A recusa não ganha um botão por alternativa.** A primeira versão listava
  `Search on <fonte>` para cada opção; na tela **anime é servido por quatro
  provedores**, e o painel saiu com cinco ações, com `Try again` — a única que não
  resolve — no mesmo peso das três que resolvem. O dono derrubou os botões no
  mesmo minuto. **Argumento que se apoia numa CONTAGEM se desmente no dia em que
  a contagem muda**, e o inventário do próprio app não é mais estável que o de
  terceiros
- **`Try again` num beco é a repetição do beco.** A API do AniList está em 403, e
  `Search your library instead` responde outra pergunta — quem está em `/search`
  quer ADICIONAR. É *a saída faz parte da recusa* (02/09) na forma que aquele
  conserto não cobriu: lá a saída era **errada**, aqui estava **faltando**
- **O total que o provedor sabe tem que chegar até a tela.** `EntryPick` não tinha
  `total`, então toda obra vinda da busca nascia com o denominador vazio — o
  `12 / ?` da 3.11, que é o estado de *não se sabe*, virava o estado de quase
  tudo. E **o placeholder do campo era `28`**, um literal que foi lido como dado:
  número cinza em campo numérico é indistinguível de campo preenchido e
  desabilitado. O dono escolheu **nenhum placeholder** — a dica de baixo faz o
  trabalho sozinha (design system, seção 7)
- **A mesma correção com duas cópias, e uma delas não recebeu.** Este arquivo já
  dizia, sobre o título da seção de unidades, que *"escrever 'Episodes' erraria em
  mangá"*. Foi aplicado lá e **a tabela de detalhes ficou de fora**, dizendo
  `Episodes 999` num mangá dois blocos abaixo de `PROGRESS · CHAPTERS` — e as duas
  telas de detalhe são um molde só, que **divergiu linha a linha**. O rótulo do
  GRUPO (`Seasons`) tem o mesmo defeito e continua aberto: ele não sai da
  `progressUnit`, que é a unidade do item

## Tempo investido não é progresso — 10/09/2026

`components/media/title-state.tsx` (`TimeBox`), decisão do dono. O pedido era
*"jogo registra horas"*, e a leitura fácil era ligar o contador de `game` de
volta — revertendo a decisão de três dias antes. **As duas não cabiam juntas
porque são duas perguntas:** *quanto do acervo você percorreu* tem unidade,
denominador e fim; *quanto tempo você investiu* não tem nenhum dos três.

- **A caixa fica AO LADO do contador, nunca no lugar.** Quem decide se ela existe
  é o TIPO (`useTracksTime`), como decide o contador — e num tipo que faz as
  duas, as duas aparecem
- **DUAS caixas (`h` e `min`), e a razão é aritmética.** Uma caixa de horas
  obrigaria a aceitar `38,5`, e aí a fração volta na tela com um round-trip que
  perde: `2h05` são 2,083 horas, e devolver `2,1` seria a tela mentindo sobre o
  que está gravado. A regra é pura (`domain/time-spent.ts`), com um teste de
  **ida e volta** que é exatamente o que a caixa decimal não passaria
- **O blur é do GRUPO, não de cada caixa** — e isso apareceu escrevendo o teste.
  Com `onBlur` em cada `input`, digitar `38` e tabular gravava `38h00`, e sair
  dos minutos gravava `38h30`: **duas escritas para uma edição, e a primeira um
  valor que ninguém quis**. O elemento é `<fieldset>` e não `<div>`, e não por
  lint: é o elemento que significa *"estas caixas são um grupo"*, que é a
  afirmação que o handler faz
- **`formatMinutes` mora em `lib/` e não é `Intl`.** `unit: 'hour'` diria "2,5 h",
  que é o número certo na forma errada, e `DurationFormat` ainda não está no Node
  do Electron. Os sufixos ficam parametrizados pro dia em que houver catálogo. E
  **`2h` e não `2h00`**, porque o `00` só existe pra encher casa; **`2h05` com
  duas casas**, porque ali o minuto é a fração

## O contador da tela de detalhe é um CAMPO — 10/09/2026

Voltar de um mangá no capítulo 364 para o 12 são 352 cliques no `−`, e o atalho
existia desde 28/08 **só no hover da carta**. Grava no **blur**, como a nota, e
pelo mesmo motivo: `1` a caminho de `12` é um número válido e viraria uma
escrita. **Continua sendo evento de progresso e não reescrita do contador.**

**A regra saiu para `domain/progress-target.ts` no caminho**, porque o popover da
carta já tinha uma cópia e esta seria a segunda — *duas contas da mesma coisa é
como uma fica pra trás*, e aqui o que ficaria pra trás é **a regra que decide se
uma escrita acontece**. Ela ganhou um teto que a cópia antiga não tinha: alvo
acima do total é recusa, não uma escrita que o servidor apara.

## O cabeçalho dos grupos vem do PAR, e a regra é COMPARTILHADA — 10/09/2026

`domain/unit-groups.ts`. `Seasons` estava escrito em código e usado para todo
tipo de mídia, enquanto o nome de cada grupo já vinha do provedor.

**A regra virou função e não dois `&&` em duas telas, e o motivo é recente:** as
duas telas de detalhe são um molde só e **divergiram nesta linha exata um dia
antes** — em 09/09 o rótulo de unidades foi corrigido em `/library/:id` e ficou
torto em `/search/:provider/:id`, com o mesmo literal nos dois. Corrigir de novo
em dois lugares repetiria o defeito na mesma semana.

- **Três estados, e o do meio surpreende:** sem grupos, nada; com grupos e **sem
  rótulo**, nada também; com os dois, seção e linha. A tela **não inventa um
  coletivo** — cabeçalho que o produto escreveu sobre lista que o provedor
  organizou é a mesma mentira com outra palavra
- **O grupo ZERO fica fora da contagem** (especiais voltam como `0`), **mas um
  grupo zero sozinho ainda dá seção**: ele existe na lista e pode ser aberto; o
  que ele não faz é entrar na conta

## Quais provedores servem um tipo — `TypeProvidersField`, 10/09/2026

`components/settings/type-providers-field.tsx`, e ele destrava a metade que
faltava de "criar tipo próprio": a junção era só lida, então tipo criado pelo
admin ficava sem fonte e **nada na tela dizia isso**.

- **Vincular tem DOIS passos**, e o segundo não pode ser escondido: a junção
  carrega a receita (corpo da busca, mapa de campos, token), e quem escolhe um
  provedor está escolhendo um provedor **e um jeito de falar com ele**
- **Sub-vista no lugar**, como `Add to pile`, o seletor de fonte de `/search` e o
  menu de filtro — submenu ancorado numa linha teria conteúdo elástico acima
- **A recusa mora na LINHA que a causou**, e a frase diz a **consequência** em
  vez de repetir o número: sem a receita, arte e detalhe param de carregar
- `domain/provider-recipes.ts` tem as duas regras puras — o que se pode oferecer,
  e como ler a contagem de dentro da recusa (*ler o corpo de uma recusa é regra
  decidível*, mesma divisão de `search-refusal.ts`)

## Sobre vidro, `raised` é tingimento — e a correção é de UMA regra

01/09/2026, apontado pelo dono na tela rodando. `--color-raised` **não tem
alpha**, então usá-lo como hover dentro de um painel de vidro pinta um bloco
sólido sobre o blur: a linha apontada vira a única opaca. O defeito era do app
inteiro — ~40 sítios em 18 arquivos —, e **a correção não passou por nenhum
deles**:

```css
.bg-glass {
  --color-raised: oklch(0.97 0.002 265 / 10%);
}
```

`PopoverContent` já carrega `bg-glass`, e um custom property vale pro **próprio
elemento** (o botão de vidro, cujo hover é nele mesmo) e pros **descendentes**
(as linhas de um menu). Corrigir à mão deixaria o quadragésimo primeiro errado;
assim, componente novo dentro de vidro herda sem saber que a regra existe.
Editar em `design/tokens.css` primeiro, copiar pra `src/styles/tokens.css`.

## O que o modelo de dados obriga a UI a aguentar

Decisões do brief que a tela sente direto:

- **Uma obra é uma linha em `entries` com o tipo como dado** — não seis modelos
  paralelos (3.12). O card é um só, parametrizado; não faça `MovieCard`, `AnimeCard`,
  `GameCard`
- **A unidade de progresso é propriedade do tipo.** "Episódio 12", "Capítulo 40",
  "Página 233" são o mesmo dado com rótulo diferente — e o rótulo passa pelo catálogo
  de i18n, com plural via `Intl`
- **Nem toda obra tem total conhecido.** Mangá em publicação não tem último capítulo:
  `total` é opcional, e "12 / ?" precisa estar desenhado. Barra de progresso sem
  denominador é um estado real, não um caso de erro
- **Progresso é contador + log** (3.11). A tela lê o contador; histórico e estatística
  saem do log. Desfazer é um evento novo, então a UI otimista precisa saber que o
  "desfazer" também é uma escrita
- **O `⋯` de uma obra é UMA peça — 07/09/2026** (design system, seções 4 e 5).
  `components/media/entry-menu.tsx`, em duas formas (`card` e `row`) cujo único
  ponto de diferença é o GATILHO: o painel e os quatro itens são idênticos, e é
  assim que a obra tem as mesmas ações na carta, nas duas listas de `/library` e
  nas de `/piles/:id`. **A decisão em aberto #8 fechou nela:** o alvo da linha é
  `h-11 w-11 sm:size-8`, e o critério é a LARGURA porque o contador da mesma
  linha já decide assim — a **visibilidade** é que segue sendo do apontador
  (`entry-menu.css`, `@media (hover: none)`). Ao acrescentar coluna que só
  aparece no hover, **reservar o vão no cabeçalho**, senão a coluna vizinha anda
  exatamente na linha apontada
- **Nem todo tipo tem contador, e nem toda OBRA — 07/09/2026** (brief, 3.12).
  São duas perguntas e basta uma dizer que não (`domain/shows-counter.ts`, com
  specs): o TIPO não conta (`countsProgress` — filme e, desde a `0044`, jogo), ou
  a OBRA tem uma unidade só (`total === 1`). **`1` e `null` são opostos**: num
  não há o que contar, no outro há e não se sabe quanto — o `12 / ?` da 3.11 —,
  e confundi-los tiraria o contador de todo mangá em publicação. Na tela de
  detalhe quem decide é o total **efetivo**, não `entries.total`, que fica nulo
  em quase toda obra vinda da busca.
- **Onde o STATUS entra no lugar do contador, e onde ele NÃO entra — 07/09/2026**
  (decisão do dono). **Quem decide é o cabeçalho da coluna:** nas listas o status
  mora na coluna `Status`, então a célula de `Progress` fica **vazia** (com a
  largura preservada) — `statusInRow` diz isso à peça. Na carta e no widget de
  lista da Home não há coluna de status, então ali o CONTROLE entra. A primeira
  versão esvaziou a célula de leitura e estava errada; e o defeito que ela
  escondia era pior — **duas peças computando a mesma pergunta com entradas
  diferentes**, o que fazia umas linhas ficarem em branco e outras duplicadas.
- **`asks_total` não existe mais** (`0045`). Ele dizia se a folha de criar obra
  pergunta o total, e a resposta já estava no modelo: o campo é OPCIONAL e em
  branco produz o mesmo `null`. `initialTotal` tem dois casos, não três. A peça
  que decide o contador é uma só:
  `components/media/entry-progress.tsx` troca o `+`/`−` pelo `StatusButton` nos
  cinco chamadores, que continuam sem saber do tipo. Três consequências que valem
  em tela nova: a peça substituta tem a **largura da que saiu** (senão a coluna
  `Progress` de uma lista de tipo misto deixa de ser coluna); a célula de leitura
  de `Status` fica **vazia** nessas linhas, pra a linha não dizer a mesma palavra
  duas vezes; e enquanto o vocabulário não chegou **não se desenha nada**, porque
  o contador é controle de ESCRITA e um quadro dele num filme deixa um clique
  gravar o que o modelo diz não existir. O total inicial de uma obra nova sai de
  `domain/initial-total.ts`, que tem os três casos com specs
- **Duas escritas que mexem no mesmo campo de uma resposta precisam invalidar as
  MESMAS chaves — 09/09/2026.** `owned` e `ownedEntryId` vêm dentro da resposta de
  busca, e **quatro** mutações mexem nas linhas de `external_ids` que os produzem:
  apagar uma obra, apagar todas, **vincular** e **desvincular**. Só
  `useCreateEntry` avisava a busca — então remover uma obra e procurá-la de novo
  a mostrava como `Already in your library`. **A assimetria não aparece em teste
  de unidade nenhum, porque cada hook está certo sozinho**, e é por isso que o
  spec afirma a REGRA sobre as quatro num arquivo só
  (`hooks/mutations/entries/owned-invalidation.spec.tsx`). A régua que generaliza:
  **descoberta a assimetria, procurar quem MAIS escreve naquele campo** — é a de
  07/09 (*régua aprendida numa tabela não viaja sozinha pras vizinhas*) aplicada a
  hooks. E `useUpdateEntry` **não** precisou: a folha de editar tranca o tipo
  quando há vínculo, e obra sem vínculo não tem linha para envelhecer
- **Widget da home tem fonte, filtro e lugar** (3.15). Três coisas que não se
  confundem: pile é playlist manual, o **filtro é do widget**, e **widget sem pile
  mostra a biblioteca inteira** — `library` é o conjunto de OBRAS, não de pilhas
  (brief, 6). Nenhuma seção da home é fixa — o que aparece ali é o
  que o usuário montou
- **Escrita em `entries` tem que alcançar a chave do widget também.** O que um widget
  resolve depende das obras, mas mora em `['home-widgets', id, 'entries']`; sem tocar
  nas duas, subir um episódio dentro de um widget deixa o contador velho até o F5.
  Isso já custou um bug. **Mas alcançar não é invalidar** (30/08/2026): progresso
  escreve a obra devolvida direto em todo cache que a contém
  (`hooks/mutations/entries/patch-entry.ts`), sem refazer busca nenhuma, porque
  invalidar reordenava a lista sob a mão de quem tocou o `+` (design system, seção 8).
  Remendar no lugar só é seguro porque `recordProgress` mexe em `progress` e
  `updated_at` e nunca no status — a obra não pode ter deixado de casar com o recorte.
  Editar status continua invalidando, porque ali a linha realmente sai da lista.
  **A régua que generaliza isso saiu de `/piles` em 30/08/2026** (design system,
  seção 8): escrita que muda o **conteúdo** de um item remenda no lugar
  (`hooks/mutations/piles/patch-pile.ts`); escrita que muda a **composição** da
  lista — criar, apagar — invalida. Vale pra edição deliberada, não só pra toque:
  renomear uma pilha não a arranca de lugar, e o caso de fronteira (o nome novo
  não casa mais com a busca ativa) resolve-se deixando-a na tela até o leitor
  pedir outra lista
- **Atribuição é do provedor que RESPONDEU** (3.10), não uma constante da tela.
  É condição de uso, não cortesia: ela mora na UI e não é opcional — mas o texto
  vem de `attribution` na resposta, porque a frase do TMDB fixa no HTML já
  apareceu embaixo de resultado do AniList. Provedor sem exigência devolve nulo,
  e aí não há o que renderizar
- **O SUBTIPO é o que separa duas linhas com o mesmo título — 02/09/2026.** O
  IGDB devolve o jogo e um Mod chamado igual; a carta de resultado mostra
  `2023 · Mod` contra `2017 · Main Game`. Duas decisões que valem em tela nova:
  ele entra **na linha do ano e não numa terceira**, porque o degradê da carta
  foi medido contra um pôster branco contando com o título entre 27 e 43px acima
  da base (design system, seção 9) — **contraste medido é restrição de layout**;
  e a linha `Format` da tabela de detalhe **trocou de conteúdo**, porque ela
  mostrava o tipo de mídia que o selo com ícone já diz no topo da mesma tela.
  **Linha de dados que repete o cabeçalho é uma linha livre.** Provedor sem
  subtipo perde a linha, que é o que o `DetailsBox` já faz com valor nulo
- **Estado desabilitado e cor de texto viraram TOKEN — 04/09/2026** (design
  system, seção 9). Duas coisas mudaram e as duas são de sistema, não de
  componente. **`disabled:opacity-*` não se escreve mais à mão**: é
  `disabled:opacity-[var(--opacity-disabled)]`, hoje 0.7, e o `var()` explícito
  é a mesma forma das durações de movimento. Havia 0.4, 0.5 e 0.6 em 17 sítios,
  sete deles fora do `Button` — três valores sem regra são cópia, não decisão.
  **E a rampa de texto subiu**: `--color-muted` 0.72→0.82 e `--color-faint`
  0.55→0.67, porque `faint` reprovava AA nos 96 usos de 12px e subir só ela a
  deixaria indistinguível de `muted`. **E desde 06/09/2026 há uma segunda regra
  de uso, descoberta desenhando `/settings/import`** (design system, seção 8,
  décima quarta leva): **`opacity` não se compõe.** Pôr
  `--opacity-disabled` num container **e** numa peça dentro dele dá 0,7 × 0,7 =
  **0,49**, abaixo de tudo que a medição aprovou — o número foi medido para UMA
  composição sobre a página. Quem desbota é o container **ou** a peça, nunca os
  dois, e o erro é fácil porque as duas escritas parecem certas isoladas.
  Consequência prática aqui: **nenhuma cor
  de texto nova sai de `text-faint` "porque é discreto"** — ela agora é o piso
  de AA, não um cinza qualquer, e o degrau abaixo dela não existe
- **O `danger` subiu, e nasceu o primeiro `*-ink` do sistema — 04/09/2026**
  (design system, seções 2 e 9). É o mesmo achado da rampa um degrau adiante:
  `--color-danger` a 0.65 clareava o suficiente **sozinho** (5,25 sobre
  `surface`, 4,80 sobre `card`), mas **todo véu da própria cor por baixo dele
  comia a margem** — `text-danger` sobre `bg-danger/10` dava 4,29 no card e 4,43
  no vidro, e o hover em `/20` caía a 3,85. Eram **seis** sítios reprovando, não
  um. `oklch(0.72 0.17 25)`: 0.72 é a menor altura em que todos passam, e 0.17 a
  maior chroma que ainda cabe no gamut sRGB ali — de 0.18 pra cima o vermelho
  crava em 255 e o navegador remapeia, o que faz **o número medido deixar de ser
  o número escrito**.
  **`--color-danger-ink` é o texto que pousa sobre vermelho CHEIO**, e ele
  existe porque a conta anda pros dois lados: subir o `danger` melhora todo
  texto vermelho e piora todo texto branco SOBRE vermelho (`text-ink` sobre
  `bg-danger` já reprovava a 3,23 e cairia a 2,43). O `variant="destructive"` do
  `Button` usa ele, e é o **único** preenchimento sólido de `danger` no app —
  quem vive dentro de popover de vidro (`ActionMenuConfirm`, `widget-remove`)
  continua sendo véu, porque opaco sobre translúcido anula o translúcido
  **O que ficou em aberto é o DESABILITADO dele** (decisão em aberto 14 do design
  system): com `--opacity-disabled` em 0.7 o par cai a **3,97**, porque o que
  decide num sólido é a distância do preenchimento até a cor da página — `ink`
  está a 16,93 e aguenta a desbotada, `danger` está a 6,96 e não. Nenhuma
  opacidade que ainda leia como inerte o salva. **Não consertar por conta
  própria com um `disabled:` à mão** — é decisão de sistema, e escrever
  opacidade solta é o que o ciclo de 04/09 acabou de tirar do app
- **A RECOMENDAÇÃO reusa a peça e NÃO funde o conceito — 03/09/2026.** Ela tem
  exatamente os mesmos campos do vínculo, então grade e carta são compartilhadas
  de verdade (`RelationGrid`), não copiadas. O que **não** é compartilhado é a
  regra de agrupamento, e é ela que faz `TitleRecommendations` existir separado:
  vínculo vira N seções tituladas por `kind`, recomendação chega com `kind` nulo
  em todo item e é **uma** seção. Passá-la pelo `TitleRelations` a jogaria no
  `relatedFallback`, sob um cabeçalho que quer dizer "o provedor esqueceu de
  nomear". **Forma idêntica autoriza reusar a peça, nunca fundir o conceito.**
  Ela vem **depois** do vínculo, que é a peça mais forte: um afirma, o outro
  sugere. E o rótulo é **`More like this`**, não `Recommended` — nenhum dos três
  provedores endossa nada (o IGDB chama o campo de `similar_games`, o AniList
  conta votos, o TMDB calcula), e copy não pode afirmar mais que a fonte. No
  `/library/:id` ela sai de graça no preview de troca de fonte, porque o contexto
  já alterna entre o detalhe e a previsão
- **O VÍNCULO entre obras é uma seção POR TIPO de relação — 02/09/2026.**
  `Prequel`, `Sequel` e `Adaptation` respondem perguntas diferentes, então o tipo
  é **cabeçalho**, não atributo da carta — o mesmo enquadramento da aba "Parent
  Game" do Yamtrack. Três regras que valem em tela nova: **agrupar preserva a
  ordem que o provedor devolveu** (quem sabe o que está mais perto da obra é o
  catálogo, não nós); **a carta reusa a grade e os tokens da carta de busca**,
  porque duas medidas para o mesmo objeto é como uma fica pra trás; e **o tipo
  viaja no endereço**, o que aqui não é teoria — o `Adaptation` de um anime
  aponta pra um mangá, então ele difere do tipo da tela em que se estava

## Primeiro uso e login

Multiusuário desde o schema (3.9). Duas telas que não são feature, são requisito:

- **Wizard de primeiro uso.** Banco sem usuário → toda requisição cai na criação do
  admin. É a primeira coisa que qualquer instalação vê, inclusive a do Electron, onde
  não há terminal para configurar nada
- **Login.** Registro é **fechado por padrão**: só o admin cria usuário

No Electron a janela local abre já autenticada; a tela de login existe para quem chega
pela rede. O cliente não trata os dois casos de forma diferente — quem decide é o
servidor (3.4: o cliente não sabe onde está rodando).

## Editor

O `.vscode/settings.json` daqui ensina o Tailwind CSS IntelliSense a enxergar classe dentro de `cn(...)` e das variantes do `cva()` — sem isso, autocomplete e hover só funcionam em `className` literal, e metade dos componentes do shadcn fica sem assistência.

`tailwindCSS.experimental.configFile` aponta para `src/styles/globals.css` porque o Tailwind v4 se configura em CSS. Se o projeto nascer no v3 com `tailwind.config.js`, **apague essa linha** — apontar para arquivo que não existe deixa a extensão muda.

## Testes

**Vitest**, instalado em 28/08/2026 junto com o primeiro domínio que valia
testar. **Desde 09/09/2026 ele tem DOIS projetos**, e a divisão é a mesma que
sempre existiu — o que mudou é que agora os dois rodam.

| Projeto | Ambiente | Glob | Cobre |
| --- | --- | --- | --- |
| `domain` | `node` | `src/**/*.spec.ts` | regra pura, sem mock nenhum |
| `components` | `jsdom` | `src/**/*.spec.tsx` | o que um componente DECIDE |

**O sufixo já separava os dois, e ninguém precisou inventar um:** `.spec.ts` é
regra pura, `.spec.tsx` é componente. A extensão que o JSX já obriga é o glob,
então não há convenção nova a lembrar e um arquivo não tem como cair no projeto
errado. `.test.ts` continua reservado pro e2e que sobe a app, como no `server/`.
`pre-push` do lefthook roda a suíte inteira.

**O domínio continua sem plugins**, e é por isso que são dois projetos e não uma
config: `domain/` é puro por regra (o `biome.json` bloqueia React, Router, Query
e o `httpClient` lá dentro), e carregar o plugin do React mais um DOM inteiro pra
rodá-lo só custa tempo.

### Componente novo nasce com teste — decisão do dono, 09/09/2026

**Vale para o componente que DECIDE**: o que tem ramo condicional, estado
próprio, ou que dispara escrita. Composição pura — `RailBox`, `Panel`, o wrapper
que só junta classes — fica **fora**, e isso não é preguiça: testá-la afirma
classe de Tailwind, que é o ruído que a régua abaixo já existe pra evitar.

**A ordem é esta, e o primeiro passo quase sempre resolve:**

1. **A decisão dá pra extrair para `domain/`?** Então extrai e testa lá. É o que
   `chip-fit`, `home-metrics`, `initial-total`, `search-refusal`, `shows-counter`
   e mais uma dúzia de módulos são — e cada um deles nasceu de uma decisão que
   estava dentro de um componente
2. **Não dá?** Aí o teste é de componente. É o caso da decisão que depende de uma
   CONSULTA (o tipo trancado por vínculo, em `edit-entry-sheet`), de composição
   entre dois hooks, e do que só existe em movimento

**O corte é em `services/`, nunca no hook.** `services/` é a única camada que
fala com a API — é o que a tabela de camadas promete —, então é ali que
`vi.mock` entra. Acima do corte tudo roda de verdade: o TanStack Query, a
invalidação, os `useMemo` e as regras de `domain/` que o hook consome. **Fingir o
HOOK seria testar outra coisa**: `useOfferedMediaTypes` combina duas consultas e
aplica `offeredTypes`, e trocá-lo por um valor pronto apaga exatamente a parte
que decide — o teste passaria a afirmar que o componente renderiza o array que o
próprio teste escreveu. *Corta-se na fronteira que a arquitetura já declarou, não
na mais próxima.*

**O modelo está escrito, e se copia:** `src/test/render.tsx` (o `render` com
`QueryClient` novo por teste — compartilhar um faz a ORDEM DOS ARQUIVOS decidir o
resultado, que é a intermitência mais cara que existe, porque some quando se roda
o teste sozinho) e `src/test/setup.ts` (matchers de DOM, `cleanup`, e os stubs de
`matchMedia` e `ResizeObserver`, que o jsdom não tem porque os dois dependem de
layout). O piloto é
`src/components/library/edit-entry-sheet.spec.tsx`.

**Duas coisas que valem em todo teste de componente:**

- **Afirme COMPORTAMENTO, não estrutura.** `expect(botão).toBeDisabled()` diz o
  que a pessoa vive; `expect(node.getAttribute('disabled')).toBe('')` diz como o
  React escreveu. Consultar por `role` e por texto visível é a mesma régua: o que
  quebra o teste tem que ser o que quebraria pra quem usa
- **Confira que ele FALHA.** Um teste que passa por acidente é pior que nenhum,
  porque cobra manutenção e não protege nada. Quebre a regra de propósito, veja
  vermelho, desfaça — foi assim que o piloto foi validado.

  **E isso não é formalidade: em 10/09/2026 pegou DOIS testes verdes que não
  afirmavam nada.** O primeiro era sobre a fonte da URL valer só no tipo ativo,
  e a fixture dava fontes **disjuntas** a cada tipo — quebrando a regra, a fonte
  errada chegava a `effectiveSource`, não estava nas opções daquele tipo e caía
  na efetiva, **mascarando o defeito com o valor certo**. Só um tipo vizinho que
  ACEITA o mesmo slug separa as duas implementações. A régua: *dado de exemplo
  que não distingue as duas implementações não confere regra nenhuma* — é a
  irmã, dentro do teste, de *dado de exemplo que imita o caso removido não
  confere o conserto* (07/09).

  **E a quebra também erra:** a segunda vez, a quebra escolhida para o rollback
  otimista (`hidden.slice(0, -1)`) produzia **por acaso** exatamente o retrato
  anterior. Teste verde ali não dizia nada sobre o teste. *Quando a quebra não
  fica vermelha, desconfie das duas pontas antes de acusar o teste*.

  **A terceira, no mesmo dia, é a forma mais fácil de errar:** o teste de
  `library-menu` afirmava que escolher FECHA o painel pela ausência de
  `Sort by` — só que, sem fechar, a tela fica na **sub-vista**, onde `Sort by`
  também não está. A asserção não distinguia *"fechou"* de *"continua onde
  estava"*. **Ausência só prova o que se quer quando a outra hipótese a
  contradiz** — aqui o que distingue são as linhas de escolha, presentes nos
  dois estados do painel aberto e em nenhum do fechado

**Uma coisa que este bloco de testes NÃO afirma, e é decisão** (10/09/2026):
as regras de **geometria** de `pile-picker` — chips sob o gatilho, `side="top"`
fixo — só existem em movimento, e o jsdom não faz layout. Afirmar `side="top"`
seria afirmar uma prop; afirmar "o botão não se moveu" seria afirmar uma classe.
**A terceira daquela leva é comportamento e está coberta**: criar FECHA o painel.
*O que dava pra testar sem virar teste de estrutura está no arquivo; o resto se
prova no navegador, e foi lá que as três apareceram.*

**Duas coisas que escrever esses três testes ACHOU, e as duas são de a11y que
nenhuma ferramenta acusa** (10/09/2026):

- **`Switch` não repassava `aria-describedby`.** `media-type-toggle-row` o
  escrevia desde 04/09 pra prender o motivo da recusa ao controle, e o primitivo
  o descartava — o `<span>` com o motivo ficava órfão, e o toggle desabilitado
  não dizia por quê pra quem usa leitor de tela. **`tsc -b --force` sai limpo com
  o atributo desconhecido ali**: atributo `aria-*` escrito num componente que não
  o declara some sem erro, sem lint e sem sintoma visível
- **O switch se chamava `Anime` e não `Show Anime`.** `aria-labelledby` apontava
  pro nome do tipo, e o `sr-only` com a ação era texto solto na linha. **Nenhuma
  ferramenta acusa**, porque o controle TEM nome acessível — ele só não dizia o
  que faz

As duas são a mesma família do `<label htmlFor>` apontando pra id inexistente
(07/09), e juntas dão a régua: **atributo de a11y é uma ponta só até alguém
conferir a outra** — quem escreve `aria-*` não é avisado se o destino não existe
ou se a peça não o repassa.

**E o `tsc` cobre os specs, o que NÃO é de graça:** `tsconfig.app.json` inclui
`src` inteiro sem excluir teste, então `bun run build` os typecheca junto com o
código. É a rede que o `server/` descobriu não ter em 07/09/2026, quando uma
coluna nova passou pelo `tsc` porque o `tsconfig` de lá exclui `*.test.ts` — e os
seis `insert` de teste falharam só em runtime. **Excluir teste do `tsconfig` é
tirar essa rede.**

### O que já está coberto, e a dívida

`domain/` tem **vinte e três** módulos com spec — seis nasceram em 10/09/2026, e cinco deles são a metade decidível de uma peça de tela, que é o primeiro passo da régua. Um deles não é sobre comportamento
e sim sobre **invariante**: `home-metrics` falha se alguém mudar o padding do
widget, a altura da carta ou o gap da grade pra um valor que não feche a divisão
— o tipo de quebra que some em silêncio até alguém reparar na fileira cortada.
Adaptador de biblioteca (`fit-compactor.ts`, `resize-constraint.ts`) não tem
teste: o que dava pra afirmar sobre eles só se prova mexendo no navegador, e foi
assim que os bugs de verdade apareceram.

**Do lado do componente a dívida é quase tudo**: são 93 arquivos em
`components/`, e **nove** têm spec — `edit-entry-sheet` e `choice-picker`, mais
`entry-progress`, `search-scope`, `preferences-section`, `pile-picker`,
`library-menu`, `type-providers-field` e `time-box`, que entraram em 10/09/2026 —
os cinco primeiros esgotaram a ordem de risco do item 27, e os dois últimos
nasceram junto das peças, que é a regra daqui pra frente. A regra
acima vale daqui pra frente; **cobrir o que já existe é item próprio do
handoff**, e não se faz em varredura — o critério é o mesmo, e componente que só
compõe continua fora.

**Há um terceiro `.spec.tsx` que não é de componente, e ele é o modelo de um
caso** (`hooks/mutations/entries/owned-invalidation.spec.tsx`): ele afirma uma
regra sobre **quatro mutações irmãs** num arquivo só, porque quatro arquivos
separados reproduziriam a forma do defeito — cada peça certa sozinha. **Uma
armadilha do harness fica registrada nele:** `createTestQueryClient` tem
`gcTime: 0`, que é o certo pra teste de componente (o cache não vaza de um teste
pro outro), mas num teste em que a ENTRADA de cache é o sujeito ela é coletada no
mesmo instante em que `setQueryData` a cria, porque nenhum componente a observa —
e `getQueryState` devolve `undefined`. O cliente daquele arquivo é montado à mão,
com o porquê ao lado.

## O README é bilíngue, e o INGLÊS é o canônico

10/09/2026, decisão do dono, e vale igual no `server/`. `README.md` em inglês,
`README.pt-BR.md` ao lado, cada um com uma linha no topo apontando pro outro —
**o GitHub não serve README por idioma do navegador**, então sem o seletor a
tradução é invisível.

- **Toda mudança futura nasce no INGLÊS**, e a tradução corre atrás: `README.md`
  é o que o GitHub mostra, então deixá-lo correr atrás faria o arquivo mais
  visível ser o que envelhece. **Tradução desatualizada é pior que ausência**
- **Este repositório não tinha README nenhum até 10/09/2026**, e é público. O
  dele é curto de propósito e **não repete instalação** — quem instala Watchpile
  instala o servidor, que já traz este cliente buildado dentro. O que ele explica
  é o que só se sabe daqui: que a SPA não roda sozinha, e que **o contrato
  gerado faz este repo quebrar em RUNTIME e não em build** quando o servidor
  muda — que é o que alguém precisa saber antes de abrir um bug
- **A regra de idioma do projeto não mudou** (`../CLAUDE.md`, e a decisão de
  08/09/2026): código em inglês, documentação e comentários em **português**. O
  que ganha inglês é a superfície pública, e ela é só o README

## Convenções

- **Arquivo em `kebab-case`** em todo `src/` — `pile-card.tsx`, `use-piles.ts`, `piles.ts`. O identificador exportado do componente continua `PascalCase` (`export function PileCard()`): isso não é estilo, é regra do JSX — `<pileCard>` é lido como tag HTML nativa, não como componente. Hook exportado em `useCamelCase` pelo mesmo motivo (o React só reconhece hook pelo prefixo `use`)
- `src/components/ui/` é território do shadcn: arquivo gerado por `npx shadcn add`. Editar é permitido (é o modelo do shadcn), mas em commit próprio, separado do uso. `src/components/<domínio>/` é nosso: compõe primitivas do `ui/` em algo específico do produto (ex.: `PileCard`), e é onde a maior parte do trabalho de tela acontece
- Datas chegam em UTC e são formatadas na UI, nunca no servidor
- Documentação em português; código, copy e commits em inglês. **Desde 04/09/2026 o
  código cumpre isso de verdade**: eram ~110 identificadores em português, em 61
  arquivos, e a varredura que os achou não está guardada — se voltar a fazer falta,
  a forma dela é extrair as regiões de CÓDIGO (fora de comentário e de string, mas
  DENTRO de `${…}` de template literal) e cruzar os identificadores com um dicionário
  inglês. Renomear por regex sobre o arquivo inteiro estraga o comentário em português,
  que é onde `caixa`, `linha` e `obra` moram de direito
- Licença AGPL-3.0 (brief, seção 9): `LICENSE` desde o primeiro commit, e dependência
  nova precisa de licença compatível — checar antes de adicionar
- Commits: `../.claude/commit-convention.md`, via skill `commit-client`

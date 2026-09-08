import { Link, useRouterState } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { PileArt } from '@/components/piles/pile-art'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { usePiles } from '@/hooks/queries/piles/use-piles'
import { useCollapsedSidebar } from '@/hooks/use-collapsed-sidebar'
import { appCopy } from '@/lib/copy'

function BrandMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 64 64"
      fill="none"
      className="shrink-0 text-accent"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="7"
        width="23"
        height="23"
        rx="6"
        fill="currentColor"
        opacity="0.5"
        transform="rotate(-3 18.5 18.5)"
      />
      <rect
        x="34"
        y="7"
        width="23"
        height="23"
        rx="6"
        fill="currentColor"
        opacity="0.75"
        transform="rotate(3 45.5 18.5)"
      />
      <rect
        x="7"
        y="34"
        width="23"
        height="23"
        rx="6"
        fill="currentColor"
        opacity="0.9"
        transform="rotate(3 18.5 45.5)"
      />
      <rect
        x="34"
        y="34"
        width="23"
        height="23"
        rx="6"
        fill="currentColor"
        transform="rotate(-3 45.5 45.5)"
      />
    </svg>
  )
}

/**
 * Os destinos, num lugar só.
 *
 * A sidebar e a barra de abas do celular desenham a MESMA lista — antes cada
 * ícone existia uma vez, e duplicá-los seria garantir que um dia divergissem.
 *
 * A ordem importa: as quatro primeiras são o que cabe na barra de abas, e
 * `settings` fica de fora dela de propósito (ver `TabBar`).
 *
 * **`to` só existe quando a tela existe.** O item sem destino continua inerte,
 * como sempre foi — desenhado, alcançável por leitor de tela, sem levar a
 * lugar nenhum. É mais honesto que apontar pra uma rota vazia: um destino que
 * abre uma tela em branco parece defeito, um item que não reage parece o que
 * é, um lugar reservado.
 */
const NAV = [
  {
    key: 'home',
    to: '/',
    label: appCopy.nav.home,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M4 10.5 L10 5 L16 10.5 M6 9.5 V16 H14 V9.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'library',
    to: '/library',
    label: appCopy.nav.library,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="4" height="12" rx="1" />
        <rect x="8.5" y="4" width="4" height="12" rx="1" />
        <path d="M14.6 4.9l2.6 11.2" />
      </svg>
    ),
  },
  {
    key: 'piles',
    to: '/piles',
    label: appCopy.nav.piles,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="6" height="6" rx="1.5" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'search',
    // Deixou de ser inerte em 01/09/2026, quando a rota nasceu. Item sem rota
    // continua sendo `undefined` — destino que abre tela em branco parece
    // defeito, e item que não reage parece o que é.
    to: '/search',
    label: appCopy.nav.search,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.6" />
        <line
          x1="12"
          y1="12"
          x2="17"
          y2="17"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'settings',
    // Destino de verdade desde 31/08/2026. Ele entra como MODO: `/settings`
    // troca a sidebar do app pela coluna de seções, e sair devolve a sidebar
    // como estava (design system, seção 5).
    to: '/settings',
    label: appCopy.nav.settings,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <line x1="3" y1="5" x2="17" y2="5" />
        <circle cx="7" cy="5" r="2" fill="currentColor" stroke="none" />
        <line x1="3" y1="10" x2="17" y2="10" />
        <circle cx="13" cy="10" r="2" fill="currentColor" stroke="none" />
        <line x1="3" y1="15" x2="17" y2="15" />
        <circle cx="9" cy="15" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
] as const

type NavDestination = (typeof NAV)[number]['to']

/**
 * Qual destino a rota atual acende.
 *
 * `/` casa exato e o resto casa por prefixo: sem a exceção, a Home ficaria
 * acesa em toda tela do app, porque toda rota começa com `/`. O prefixo tem
 * que terminar em barra para `/piles` não acender em `/piles-something` — uma
 * rota que não existe hoje, mas a regra é de graça agora e cara depois.
 */
function isActive(pathname: string, to: NavDestination): boolean {
  if (!to) {
    return false
  }
  if (to === '/') {
    return pathname === '/'
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

type NavItemProps = {
  label: string
  to?: NavDestination
  active?: boolean
  collapsed?: boolean
  children: ReactNode
}

/**
 * Recolhido, o item vira só o ícone, centrado num quadrado — e o `title` que
 * já existia passa a ser a única forma de saber o que ele é. É por isso que
 * ele nunca foi opcional aqui.
 *
 * O rótulo continua no DOM, escondido por `sr-only`: leitor de tela e busca do
 * navegador continuam encontrando "Piles" com a barra fechada, o que
 * `display: none` levaria embora.
 *
 * Sem `to` ele é um `<span>`, e é isso que separa destino de lugar reservado:
 * um `<a>` sem `href` não recebe foco nem anuncia papel de link, então a tela
 * não promete uma navegação que não vai acontecer.
 *
 * A classe é montada aqui inteira, e não por `activeProps` do `Link`: aquilo
 * CONCATENA as duas listas, e `bg-ink` convivendo com `hover:bg-raised` deixa
 * o desempate pra ordem das regras no CSS, não pra intenção de quem escreveu.
 */
function NavItem({ label, to, active, collapsed, children }: NavItemProps) {
  const base = active
    ? 'rounded-md bg-ink font-medium text-sm text-surface'
    : 'rounded-md text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised'

  const className = collapsed
    ? `${base} flex size-10 items-center justify-center`
    : `${base} flex items-center gap-3 px-3 py-2`

  const content = (
    <>
      {children}
      <span className={collapsed ? 'sr-only' : undefined}>{label}</span>
    </>
  )

  if (!to) {
    return (
      <span title={label} className={className}>
        {content}
      </span>
    )
  }

  return (
    <Link
      to={to}
      title={label}
      className={className}
      // O item aceso já é o destino: anunciá-lo como link comum faria o leitor
      // de tela oferecer uma viagem pro lugar onde a pessoa está.
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </Link>
  )
}

/**
 * As pilhas fixadas, sob os destinos fixos.
 *
 * **A seção só existe quando há alguma** — um cabeçalho "Pinned" sobre o vazio
 * é chrome que não faz nada, o mesmo argumento que tira a fileira de chips de
 * uma tela sem eixo (design system, seção 5).
 *
 * Ela lê a MESMA consulta que `/piles` já usa, sem parâmetro: nenhum endpoint
 * novo nasceu pra isto, porque a listagem já traz `pinnedAt` e a nav só filtra.
 * Numa instalação de homelab são dezenas de pilhas, e a consulta quase sempre
 * já está no cache de quem passou por `/piles`.
 *
 * Ordena por `pinnedAt` crescente: quem fixou primeiro fica em cima, e a lista
 * não dança quando outra pilha entra.
 *
 * **Isto não reabre o anti-padrão de "itens fixados"** (design system, seção 8,
 * qualificado em 31/08/2026). O que se rejeitou do Spotify foi o alfinete
 * reordenando a GRADE — que é "lista que se reordena sob a mão" com outro nome.
 * Aqui é navegação, e a coluna existe.
 *
 * **No celular ela não aparece**, e a assimetria é assumida e registrada
 * (design system, pergunta em aberto #10): a sidebar não existe lá, e a barra
 * de abas seleciona por hábito, sem aba "More".
 */
function PinnedPiles({ collapsed }: { collapsed: boolean }) {
  const piles = usePiles()

  const pinned = (piles.data ?? [])
    .filter(({ pinnedAt }) => pinnedAt !== null)
    .sort((a, b) => (a.pinnedAt ?? '').localeCompare(b.pinnedAt ?? ''))

  if (pinned.length === 0) {
    return null
  }

  return (
    <div
      className={
        collapsed
          ? 'mt-6 flex flex-col items-center gap-1 border-line border-t pt-4'
          : 'mt-6 flex flex-col gap-1 border-line border-t pt-4'
      }
    >
      {!collapsed && (
        <p className="px-3 pb-1 text-faint text-xs uppercase tracking-wide">
          {appCopy.nav.pinned}
        </p>
      )}
      {pinned.map((pile) => (
        <Link
          key={pile.id}
          to="/piles/$pileId"
          params={{ pileId: String(pile.id) }}
          title={pile.name}
          className={
            collapsed
              ? 'flex size-10 items-center justify-center rounded-md text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised'
              : 'flex items-center gap-3 rounded-md px-3 py-2 text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised'
          }
        >
          {/* A miniatura acompanha a box, e não é o ladrilho reduzido — a
           * regra de qual nível de identidade desenhar é a mesma, o glifo é
           * que escala (design system, seção 4, 30/08/2026). */}
          <PileArt pile={pile} variant="row" className="size-5 shrink-0" />
          <span className={collapsed ? 'sr-only' : 'truncate'}>
            {pile.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

function initial(username: string): string {
  return username.slice(0, 1).toUpperCase()
}

function Avatar({ username }: { username: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-raised font-medium text-muted text-xs">
      {initial(username)}
    </span>
  )
}

type AccountMenuProps = {
  username: string
  isAdmin: boolean
  onLogOut: () => void
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
}

/**
 * Identidade e sessão no mesmo lugar, longe do conteúdo.
 *
 * "Log out" morava na barra de cima da Home, ao lado de "Edit layout" —
 * misturava ação de conta com ação de tela. Aqui ele é o único lugar onde
 * encerrar a sessão existe.
 */
function AccountMenu({
  username,
  isAdmin,
  onLogOut,
  children,
  align = 'start',
  side = 'top',
}: AccountMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-56 p-1"
        sideOffset={8}
      >
        <div className="flex items-center gap-2 border-line border-b px-2 py-2">
          <Avatar username={username} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-sm">
              {username}
            </span>
            <span className="block truncate text-faint text-xs">
              {isAdmin ? appCopy.account.admin : appCopy.account.member} ·{' '}
              {appCopy.account.thisServer}
            </span>
          </span>
        </div>
        {/* Settings só aparece aqui no CELULAR: ele saiu da barra de abas pra
         * ela caber em quatro destinos de rotina, e este é o menu que já
         * existe no topo da tela pequena. No desktop ele continua na sidebar,
         * e repeti-lo nos dois lugares seria dois caminhos pro mesmo lugar na
         * mesma tela. */}
        <span className="mt-1 block md:hidden">
          <Link
            to="/settings"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 6h8M14 6h3M3 14h3M9 14h8" />
              <circle cx="12.5" cy="6" r="1.8" />
              <circle cx="7.5" cy="14" r="1.8" />
            </svg>
            {appCopy.nav.settings}
          </Link>
        </span>

        <button
          type="button"
          onClick={onLogOut}
          className="mt-1 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 4H5v12h3M12 7l3 3-3 3M15 10H8" />
          </svg>
          {appCopy.account.logOut}
        </button>
      </PopoverContent>
    </Popover>
  )
}

/**
 * A navegação do celular.
 *
 * ── Por que abas e não a gaveta ─────────────────────────────────────────────
 * `design/mockups/home.html` decidiu em 23/08/2026 um hambúrguer que EMPURRA o
 * app pra fora da tela. Isso cai aqui, e por dois motivos que mudaram desde
 * lá: a nav passou de quatro destinos pra cinco, e gaveta com cinco itens gasta
 * uma tela inteira pra escolher entre cinco coisas; e o laço diário deste
 * produto é curto — abrir, marcar um episódio, fechar. Gaveta põe um toque a
 * mais antes de QUALQUER navegação, e um toque a mais num gesto que se repete
 * várias vezes por dia é caro.
 *
 * ── Por que quatro, e não cinco ─────────────────────────────────────────────
 * Cinco abas numa tela de 360px deixam cada alvo com 72px de largura, mas o
 * problema não é a largura e sim o que sobra pro rótulo. `settings` é o único
 * dos cinco que não é destino de rotina, então ele sai da barra e vai pro menu
 * de conta — que já existe no topo e já é onde a sessão mora.
 *
 * ── A exceção que isto abre, e que fica registrada ──────────────────────────
 * A seção 1 do design system diz que desktop-app é a lente e o celular é
 * adaptação responsiva. Barra de abas é idioma nativo de celular, não adaptação
 * de desktop. É exceção consciente ao princípio, não descuido — navegação é
 * justamente onde a plataforma manda mais que o sistema visual.
 */
function TabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-line border-t bg-glass backdrop-blur md:hidden"
      // `env(safe-area-inset-bottom)` e não um padding fixo: no iPhone a barra
      // de gestos come a base da tela, e sem isto a última linha de rótulos
      // fica debaixo dela.
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={appCopy.nav.primary}
    >
      {NAV.filter(({ key }) => key !== 'settings').map(
        ({ key, to, label, icon }) => {
          // Alvo de 56px de altura: acima dos 44px que a seção 9 fixa como
          // mínimo, e o suficiente pra ícone e rótulo empilharem sem apertar.
          const className = `flex h-14 flex-1 flex-col items-center justify-center gap-1 ${
            isActive(pathname, to) ? 'text-ink' : 'text-faint'
          }`
          const content = (
            <>
              {icon}
              <span className="text-[10px] leading-none">{label}</span>
            </>
          )

          return to ? (
            <Link
              key={key}
              to={to}
              className={className}
              aria-current={isActive(pathname, to) ? 'page' : undefined}
            >
              {content}
            </Link>
          ) : (
            <span key={key} className={className}>
              {content}
            </span>
          )
        },
      )}
    </nav>
  )
}

type AppShellProps = {
  username: string
  isAdmin: boolean
  /**
   * O nome da tela, mostrado na barra de cima do CELULAR. É por causa dela que
   * o cabeçalho de `/library` não repete o próprio título no telefone: dois
   * "Library" empilhados gastariam 72 dos ~800px que a tela tem.
   */
  screenTitle: string
  onLogOut: () => void
  children: ReactNode
}

export function AppShell({
  username,
  isAdmin,
  screenTitle,
  onLogOut,
  children,
}: AppShellProps) {
  const [collapsed, toggleSidebar] = useCollapsedSidebar()
  // Só o pathname, não o objeto de localização inteiro: `select` é o que
  // impede a sidebar de renderizar de novo a cada mudança de search param —
  // e em `/library` eles mudam a cada tecla digitada na busca.
  const pathname = useRouterState({
    select: (estado) => estado.location.pathname,
  })

  return (
    <div
      className="flex min-h-svh bg-surface text-ink"
      /**
       * A altura da barra de cima do celular, publicada pra quem precisa
       * grudar ABAIXO dela — hoje o cabeçalho de `/library`.
       *
       * Variável e não número repetido: são dois arquivos que precisam
       * concordar, e o dia em que discordarem produz exatamente o defeito que
       * isto conserta. 56px é a mesma altura da barra de abas, então as duas
       * peças de chrome do telefone têm a mesma medida.
       */
      style={{ '--wp-app-bar': '3.5rem' } as CSSProperties}
    >
      {/* `sticky top-0 h-svh` e não só flex: como filha do flex a sidebar
       * esticava até a altura da PÁGINA, e o rodapé dela — a identidade e a
       * sessão — descia junto com qualquer conteúdo longo. Presa à janela,
       * ela fica sempre alcançável, o que já valeria numa biblioteca de
       * duzentos itens mesmo sem o Edit Layout. */}
      <aside
        // `min-w-0` não é enfeite: como item de flex a barra herda
        // `min-width: auto`, que é o min-content do conteúdo dela — e isso
        // vencia o `w-16`, deixando a barra com a classe de recolhida e a
        // largura de aberta.
        //
        // O padding encolhe junto: com `p-4` sobrariam 32px de caixa interna
        // num rail de 64, e um alvo de 32px é apertado. Com `p-2` sobram 48, e
        // o item quadrado de 40px cabe com folga simétrica.
        className={`group sticky top-0 flex h-svh min-w-0 shrink-0 flex-col border-line border-r bg-card pt-4 transition-[width,padding] duration-[var(--motion-chrome)] ease-chrome max-md:hidden ${
          collapsed ? 'w-16 items-center px-2 pb-2' : 'w-60 px-4 pb-4'
        }`}
      >
        {/* A marca fica sozinha aqui: o controle de recolher saiu desta row
         * e foi pra borda (ver a alça abaixo). Recolhida, sobra só o símbolo,
         * centrado. */}
        <div
          className={
            collapsed
              ? 'mb-8 flex justify-center'
              : 'mb-8 flex items-center gap-2 px-2'
          }
        >
          <BrandMark />
          {!collapsed && (
            <span className="truncate font-semibold text-base tracking-tight">
              Watchpile
            </span>
          )}
        </div>

        {/* ── A alça, na borda ────────────────────────────────────────────────
         * Empilhada sob a marca (como o mockup decidiu em 23/08/2026), ela
         * gastava uma linha inteira no mesmo eixo dos destinos e lia como um
         * sexto item de navegação que não navega. Na borda ela não consome
         * linha em estado nenhum, fica no eixo em que a barra de fato se move,
         * e é o mesmo alvo nas duas larguras — a mão aprende um lugar só.
         *
         * Aberta ela só aparece no hover, porque aí a barra está fazendo o
         * trabalho dela e o controle é ruído. **Recolhida ela fica sempre
         * visível**: é o caminho de volta, e esconder a saída atrás de um
         * hover é como se perde gente numa interface.
         *
         * Só ponteiro, e isso não custa nada aqui: a barra inteira é
         * `md:hidden`, então no toque nem ela nem a alça existem. */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-label={collapsed ? appCopy.nav.expand : appCopy.nav.collapse}
          title={collapsed ? appCopy.nav.expand : appCopy.nav.collapse}
          className={`absolute top-4 -right-3 z-20 flex size-6 items-center justify-center rounded-full border border-line bg-card text-faint outline-none transition-[opacity,color,background-color] duration-[var(--motion-chrome)] ease-chrome hover:bg-raised hover:text-ink focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ink/50 group-hover:opacity-100 ${
            collapsed ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Um chevron só, girado: duas setas diferentes seriam dois desenhos
           * pra um estado. */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-[var(--motion-chrome)] ease-chrome ${collapsed ? 'rotate-180' : ''}`}
          >
            <path d="M12 5l-4 5 4 5" />
          </svg>
        </button>

        <nav
          className={
            collapsed
              ? 'flex flex-col items-center gap-1'
              : 'flex w-full flex-col gap-1'
          }
        >
          {NAV.map(({ key, to, label, icon }) => (
            <NavItem
              key={key}
              to={to}
              label={label}
              active={isActive(pathname, to)}
              collapsed={collapsed}
            >
              {icon}
            </NavItem>
          ))}
        </nav>

        <PinnedPiles collapsed={collapsed} />

        {/**
         * O sino mora AQUI, colado no menu de conta — a referência põe o sino
         * ao lado do avatar numa barra de cima, e o nosso desktop não tem
         * barra de cima desde 28/08. O que se preserva é a adjacência, no
         * lugar onde a periferia já mora.
         *
         * Recolhida a 64px os dois não cabem lado a lado, e o sino empilha
         * ACIMA do avatar: âncora não se move quando um vizinho aparece.
         */}
        <div
          className={
            collapsed
              ? 'mt-auto flex flex-col items-center gap-1 border-line border-t pt-2'
              : 'mt-auto flex w-full items-center gap-1 border-line border-t pt-2'
          }
        >
          {collapsed ? <NotificationBell /> : null}
          <AccountMenu
            username={username}
            isAdmin={isAdmin}
            onLogOut={onLogOut}
          >
            {/* Recolhido sobra o avatar — que já é a inicial do name, então
             * continua identificando quem está logado sem texto nenhum. O
             * menu abre igual e é lá que nome, papel e sair vivem. */}
            <button
              type="button"
              className={`flex items-center rounded-md text-left transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised ${
                collapsed
                  ? 'size-10 justify-center'
                  : 'min-w-0 flex-1 gap-2 px-2 py-2'
              }`}
              aria-label={appCopy.account.menu}
              title={collapsed ? username : undefined}
            >
              <Avatar username={username} />
              <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1'}>
                <span className="block truncate text-ink text-sm">
                  {username}
                </span>
                <span className="block truncate text-faint text-xs">
                  {isAdmin ? appCopy.account.admin : appCopy.account.member}
                </span>
              </span>
              {!collapsed && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="shrink-0 text-faint"
                  aria-hidden="true"
                >
                  <path d="M7 8l3-3 3 3M7 12l3 3 3-3" />
                </svg>
              )}
            </button>
          </AccountMenu>
          {collapsed ? null : <NotificationBell />}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TabBar pathname={pathname} />
        {/* A sidebar some no celular e não havia substituto nenhum: sem esta
            barra, quem abre no telefone fica sem identidade e sem sessão. */}
        {/* `sticky` desde 30/08/2026: sem isto ela rolava pra outside enquanto o
            cabeçalho da tela grudava em `top: 0` por cima dela, e nos
            primeiros ~50px de rolagem a marca aparecia cortada ao meio. O
            mockup de `/library` já preview o defeito e dizia onde consertar.

            `h-14` fixa a height que `--wp-app-bar` promete. Antes ela era
            derivada do conteúdo (`py-3` mais o alvo de 44px, dando 68), e
            height derivada não dá pra publicar numa variável sem mentir. */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-line border-b bg-card px-4 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark />
            <span className="truncate font-semibold text-base tracking-tight">
              {screenTitle}
            </span>
          </div>
          {/**
           * Aqui o sino fica à ESQUERDA do avatar — o lado de dentro. A
           * identidade mantém a borda direita que já era dela, e o sino ocupa
           * o vizinho. Os dois lados discordam de propósito, e as duas telas
           * nunca aparecem juntas.
           *
           * `surface="sheet"`: no celular o sino abre FOLHA, não popover. Quem
           * decide é o CHROME e não uma media query em JS — este bloco só
           * existe em `max-md:`.
           */}
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell size={44} surface="sheet" />
            <AccountMenu
              username={username}
              isAdmin={isAdmin}
              onLogOut={onLogOut}
              align="end"
              side="bottom"
            >
              {/* 44px de alvo no toque (design system, seção 9) */}
              <button
                type="button"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-raised font-medium text-muted text-xs"
                aria-label={appCopy.account.menu}
              >
                {initial(username)}
              </button>
            </AccountMenu>
          </div>
        </header>

        {/* `pb-20` no celular: a barra de abas é `fixed` e não empurra nada,
         * então sem esta folga ela cobriria a última linha de conteúdo. Some
         * no desktop, onde a barra não existe. */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col p-4 pb-20 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

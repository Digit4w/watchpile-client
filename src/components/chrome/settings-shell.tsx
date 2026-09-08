import { Link, useRouterState } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  HardDrive,
  Info,
  Shapes,
  Share2,
  SlidersHorizontal,
  Upload,
  UserRound,
  Wifi,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { pendingCount } from '@/domain/provider-status'
import { useNetwork } from '@/hooks/queries/network/use-network'
import { useProviders } from '@/hooks/queries/providers/use-providers'
import { useCompactViewport } from '@/hooks/use-compact-viewport'
import { settingsCopy } from '@/routes/-settings.copy'

/**
 * O TERCEIRO chrome do app (design system, seção 5, 31/08/2026).
 *
 * **Settings é um MODO, não uma tela.** Entrar troca a sidebar do app pela
 * coluna de seções; sair devolve a sidebar exatamente como estava, porque a
 * preferência de recolhida continua em `localStorage` e a troca é **por rota,
 * não por breakpoint** — a regra de 29/08 fica inteira, nenhuma largura de tela
 * mexe na sidebar.
 *
 * Três coisas que isso compra, e nenhuma é estética:
 *
 * - **O celular já decidia assim.** `Settings` saiu da barra de abas e foi pro
 *   menu de conta porque a barra seleciona por hábito. O modo faz o desktop
 *   dizer a mesma coisa
 * - **Preferences de aplicativo nativo é um modo**, em que se entra e de que se
 *   sai — e desktop-app é a lente (design system, seção 1)
 * - **Resolve o "voltar" num lugar só.** O app não tem botão de voltar em tela
 *   nenhuma, e o master-detail do celular ia exigir um
 *
 * **Não há barra de abas aqui.** Ela é a navegação do APP, e no modo o app não
 * está na tela. A saída é uma peça só, no topo da coluna.
 */

/**
 * O inventário de seções, num lugar só — a coluna do desktop e a lista do
 * celular consomem a MESMA lista, pelo mesmo motivo que `NAV` existe em
 * `app-shell.tsx`: duplicar seria garantir que um dia divergissem.
 *
 * **Só entra o que existe** — "affordance descreve o que existe, não o que vai
 * existir" (design system, seção 5, 30/08/2026). `Preferences` entrou no ciclo
 * dela em 04/09/2026 e `Import` no dele em 07/09. `Notifications` segue de
 * fora: a central virou o SINO e a rota `/notifications`, e a seção guardaria
 * só as preferências de quais avisos receber — que não entram enquanto não
 * houver o que desligar.
 *
 * `About` fica FORA dos dois grupos, no fim: versão e licença não são de
 * ninguém.
 */
const GROUPS = [
  {
    key: 'you',
    label: settingsCopy.groups.you,
    adminOnly: false,
    items: [
      {
        to: '/settings/account',
        label: settingsCopy.sections.account,
        Icon: UserRound,
      },
      {
        to: '/settings/preferences',
        label: settingsCopy.sections.preferences,
        Icon: SlidersHorizontal,
      },
      {
        to: '/settings/import',
        label: settingsCopy.sections.import,
        Icon: Download,
      },
      /**
       * `Export` é seção IRMÃ de `Import`, não uma caixa dentro dela (decisão
       * do dono, 07/09/2026): seção é destino e mora na URL, e as duas metades
       * do laço são destinos diferentes — quem vem exportar não está a meio
       * caminho de importar.
       *
       * O ícone é o espelho do de `Import`, e não o do arquivo que se baixa: o
       * par se lê na coluna, e é ali que a direção precisa fazer sentido.
       */
      {
        to: '/settings/export',
        label: settingsCopy.sections.export,
        Icon: Upload,
      },
    ],
  },
  {
    key: 'instance',
    label: settingsCopy.groups.instance,
    /**
     * O grupo INTEIRO some para quem não é admin, com o título junto (design
     * system, seção 5). A alternativa — lista plana com um item a menos —
     * deixaria duas pessoas vendo listas diferentes sem nada na tela
     * explicando por quê.
     *
     * **Esconder não é proteção.** Quem protege é o `adminMiddleware` do
     * servidor; qualquer um fala HTTP com esta API.
     */
    adminOnly: true,
    items: [
      {
        to: '/settings/media-types',
        label: settingsCopy.sections.mediaTypes,
        Icon: Shapes,
      },
      {
        to: '/settings/providers',
        label: settingsCopy.sections.providers,
        Icon: Share2,
      },
      {
        to: '/settings/network',
        label: settingsCopy.sections.network,
        Icon: Wifi,
        /**
         * **A única seção condicional da coluna, e quem decide é o SERVIDOR.**
         *
         * O controle de conexões remotas só existe onde não pode trancar
         * ninguém do lado de fora — hoje, o desktop. Numa instalação em
         * container ele não é oferecido, e a seção não entra: *affordance
         * descreve o que existe* (design system, seção 5), a mesma régua que
         * mantém item sem rota inerte na nav.
         */
        needsNetworkControl: true,
      },
      /**
       * O que este servidor guardou porque podia buscar de novo. **Do admin
       * inclusive na leitura**, como `Network`: quanto o cache ocupa é fato
       * sobre a máquina de quem hospeda, e não muda uma tela sequer pra quem
       * não pode limpá-lo.
       */
      {
        to: '/settings/storage',
        label: settingsCopy.sections.storage,
        Icon: HardDrive,
      },
    ],
  },
] as const

const ABOUT = {
  to: '/settings/about',
  label: settingsCopy.sections.about,
  Icon: Info,
} as const

type SectionTo =
  | (typeof GROUPS)[number]['items'][number]['to']
  | typeof ABOUT.to

/**
 * Qual seção a coluna acende.
 *
 * `/settings` acende a **primeira seção visível**, e não nada: no desktop essa
 * URL MOSTRA aquela seção (design system, seção 5 — "não é redirecionamento, é
 * o primeiro nível"), então a coluna tem que concordar com o painel. No
 * celular a coluna não está na tela, e a lista de seções não acende item nenhum.
 */
function isActive(pathname: string, to: SectionTo, firstVisible: SectionTo) {
  if (pathname === '/settings') {
    return to === firstVisible
  }
  return pathname === to
}

/**
 * Os grupos e os itens que esta instalação de fato tem.
 *
 * O grupo inteiro some para quem não é admin; DENTRO dele, um item ainda pode
 * sair — hoje só `Network`, que depende de o servidor oferecer o controle.
 */
function visibleGroups(isAdmin: boolean, networkControl: boolean) {
  return GROUPS.filter((group) => !group.adminOnly || isAdmin).map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !('needsNetworkControl' in item) || networkControl,
    ),
  }))
}

/**
 * A seção que `/settings` mostra no desktop. Sempre existe: `About` fica fora
 * dos grupos e não some para ninguém, então mesmo um usuário sem nenhum grupo
 * visível — que hoje não acontece, mas acontecerá se `Account` virar admin-only
 * um dia — cai num destino de verdade em vez de num painel vazio.
 */
function firstVisibleSection(
  isAdmin: boolean,
  networkControl: boolean,
): SectionTo {
  return visibleGroups(isAdmin, networkControl)[0]?.items[0]?.to ?? ABOUT.to
}

/**
 * O contador de pendências de uma seção (design system, seção 5, 01/09/2026).
 *
 * **O que ele conta é a regra toda**, e mora em `domain/provider-status.ts`: só
 * condição de objeto EM USO. Provedor sem tipo é ocioso, não quebrado, e contá-lo
 * deixaria o número sem chegar a zero — sinal permanentemente aceso ensina a ser
 * ignorado, e **contador que não zera não é contador, é enfeite**.
 *
 * **Pílula SÓLIDA, e a medição é que decidiu.** A versão tingida
 * (`bg-warning/15 text-warning`) derrubava o número de 8,30:1 pra 6,22:1 e
 * deixava a pílula em 1,33:1 contra o card — abaixo dos 3:1 que a seção 9 exige
 * de elemento não textual. Sólida dá 9,07:1 no número e 8,30:1 na pílula.
 *
 * **Na seção ativa ele perde a cor.** A cor é um convite pra ir até lá; estando
 * lá, o convite não tem mais o que dizer, e as condições estão nas linhas com
 * mais detalhe do que um número. Ele **não some** — sumir se leria como "resolvi
 * ao clicar".
 */
function SectionBadge({ count, active }: { count: number; active: boolean }) {
  if (count === 0) {
    return null
  }

  return (
    <span
      className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 font-medium text-[0.6875rem] tabular-nums ${
        active ? 'bg-surface/20 text-surface' : 'bg-warning text-surface'
      }`}
    >
      {count}
      <span className="sr-only">
        {' '}
        {count === 1 ? settingsCopy.pending.one : settingsCopy.pending.other}
      </span>
    </span>
  )
}

/**
 * Quantas pendências cada seção tem.
 *
 * A consulta vive no shell e não na seção porque o selo existe pra ser visto **de
 * fora** dela — é essa a função dele. `useProviders` tem `staleTime` de 30
 * minutos e é deduplicada pelo React Query, então estar aqui e na seção não custa
 * uma segunda requisição.
 *
 * **Só admin.** Não-admin não pode resolver a condição, e sinal que a pessoa não
 * consegue apagar é ansiedade sem saída (brief, 3.9) — além de o grupo inteiro
 * sumir pra ele de qualquer forma.
 */
function usePendingBySection(isAdmin: boolean): Record<string, number> {
  const providers = useProviders()

  if (!isAdmin) {
    return {}
  }
  return { '/settings/providers': pendingCount(providers.data ?? []) }
}

/**
 * Se esta instalação oferece o controle de conexões remotas.
 *
 * **Quem responde é o servidor**, nunca uma constante daqui — é a mesma régua
 * das fontes de import. Enquanto a resposta não chega, a seção fica FORA: peça
 * que aparece sozinha um quadro depois se lê como defeito, e o custo de errar
 * pra este lado é uma seção que entra tarde, não uma que promete o que não há.
 *
 * Só admin pergunta: a rota é de admin no caminho inteiro, e um 403 previsível
 * não é pergunta, é ruído no log de quem hospeda.
 */
function useNetworkControl(isAdmin: boolean): boolean {
  const network = useNetwork()

  if (!isAdmin) {
    return false
  }
  return network.data ? network.data.lock !== 'not-offered' : false
}

function itemClass(active: boolean) {
  return active
    ? 'flex items-center gap-3 rounded-md bg-ink px-3 py-2 font-medium text-sm text-surface'
    : 'flex items-center gap-3 rounded-md px-3 py-2 text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
}

/**
 * A coluna, no SLOT da sidebar do app — mesma largura, mesma posição, mesmo
 * `sticky top-0 h-svh`. É isso que faz nada saltar ao entrar e ao sair do modo.
 *
 * Ela não recolhe: o rail de 64px existe pra devolver largura ao conteúdo numa
 * grade de cartas, e um painel de formulário de 768px não disputa espaço com
 * ela.
 */
function SectionColumn({
  pathname,
  isAdmin,
}: {
  pathname: string
  isAdmin: boolean
}) {
  const networkControl = useNetworkControl(isAdmin)
  const firstVisible = firstVisibleSection(isAdmin, networkControl)
  const pending = usePendingBySection(isAdmin)

  return (
    <aside className="sticky top-0 flex h-svh w-60 min-w-0 shrink-0 flex-col gap-6 border-line border-r bg-card px-4 pt-4 pb-4 max-md:hidden">
      {/* A saída ocupa o slot da marca na sidebar do app: mesma height, mesma
       * posição. A peça não se move, só troca de sentido — identidade vira
       * saída. */}
      <Link
        to="/"
        className="-mx-2 flex items-center gap-2 rounded-md px-2 py-2 text-ink transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
      >
        <ChevronLeft
          className="shrink-0 text-muted"
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <span className="truncate font-semibold text-base tracking-tight">
          {settingsCopy.title}
        </span>
        <span className="sr-only">{settingsCopy.back}</span>
      </Link>

      <nav className="flex flex-col gap-6" aria-label={settingsCopy.title}>
        {visibleGroups(isAdmin, networkControl).map((group) => (
          <div key={group.key} className="flex flex-col gap-1">
            {/* O rótulo aparece SEMPRE, mesmo com um item só: é ele sumindo
             * junto com os itens que explica ao não-admin por que ele vê
             * menos. Sem o título, sobra uma lista com buracos. */}
            <p className="px-3 pb-1 text-faint text-xs uppercase tracking-wide">
              {group.label}
            </p>
            {group.items.map(({ to, label, Icon }) => {
              const active = isActive(pathname, to, firstVisible)
              return (
                <Link
                  key={to}
                  to={to}
                  className={itemClass(active)}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="shrink-0" size={18} strokeWidth={1.7} />
                  <span className="truncate">{label}</span>
                  <SectionBadge count={pending[to] ?? 0} active={active} />
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-line border-t pt-2">
        <Link
          to={ABOUT.to}
          className={itemClass(isActive(pathname, ABOUT.to, firstVisible))}
          aria-current={pathname === ABOUT.to ? 'page' : undefined}
        >
          <ABOUT.Icon className="shrink-0" size={18} strokeWidth={1.7} />
          <span className="truncate">{ABOUT.label}</span>
        </Link>
      </div>
    </aside>
  )
}

/**
 * No celular a barra de cima do app vira o cabeçalho de voltar. 56px cravados,
 * a mesma altura de toda barra de cima (design system, seção 5) — e a mesma que
 * `--wp-app-bar` publica no shell do app.
 *
 * **Para onde ela volta depende do nível.** Na lista de seções, voltar sai do
 * modo; dentro de uma seção, voltar sobe pra lista. São os dois níveis que o
 * Settings de qualquer telefone tem, e é por isso que ninguém tropeça neles.
 */
function MobileTopBar({ title, backTo }: { title: string; backTo: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-line border-b bg-card px-4 md:hidden">
      <Link
        to={backTo}
        // 44px de alvo no toque (design system, seção 9). O `-ml-2.5` devolve
        // o glifo ao alinhamento do título, que o alvo maior tinha empurrado.
        className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
        aria-label={settingsCopy.back}
      >
        <ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true" />
      </Link>
      <span className="truncate font-semibold text-base tracking-tight">
        {title}
      </span>
    </header>
  )
}

/**
 * O primeiro nível no CELULAR: a lista de seções.
 *
 * A mesma URL (`/settings`) rende isto no estreito e a primeira seção no largo,
 * porque o master-detail é a **versão estreita do mesmo par**, não outra tela
 * (design system, seção 5).
 */
function SectionList({ isAdmin }: { isAdmin: boolean }) {
  const networkControl = useNetworkControl(isAdmin)
  const pending = usePendingBySection(isAdmin)

  return (
    <nav
      className="flex flex-col gap-6 p-4 md:hidden"
      aria-label={settingsCopy.title}
    >
      {visibleGroups(isAdmin, networkControl).map((group) => (
        <div key={group.key} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-faint text-xs uppercase tracking-wide">
            {group.label}
          </p>
          {group.items.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex h-14 items-center gap-3 rounded-md px-3 text-ink text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
            >
              <Icon
                className="shrink-0 text-muted"
                size={18}
                strokeWidth={1.7}
              />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <SectionBadge count={pending[to] ?? 0} active={false} />
              <ChevronRight
                className="shrink-0 text-faint"
                size={16}
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      ))}

      <div className="border-line border-t pt-4">
        <Link
          to={ABOUT.to}
          className="flex h-14 items-center gap-3 rounded-md px-3 text-ink text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
        >
          <ABOUT.Icon
            className="shrink-0 text-muted"
            size={18}
            strokeWidth={1.7}
          />
          <span className="min-w-0 flex-1 truncate">{ABOUT.label}</span>
          <ChevronRight
            className="shrink-0 text-faint"
            size={16}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </Link>
      </div>
    </nav>
  )
}

type SettingsShellProps = {
  isAdmin: boolean
  /** O nome da seção, na barra de cima do celular. */
  sectionTitle: string
  children: ReactNode
}

/**
 * O modo montado: coluna à esquerda, painel à direita.
 *
 * `max-w-3xl` no painel, e não a largura toda: linha de configuração é texto, e
 * texto de 1400px de largura não se lê. A régua é a mesma do `max-w-prose` das
 * descrições — o painel tem largura de leitura, não de grade.
 */
export function SettingsShell({
  isAdmin,
  sectionTitle,
  children,
}: SettingsShellProps) {
  const pathname = useRouterState({
    select: (estado) => estado.location.pathname,
  })

  return (
    <div className="flex min-h-svh bg-surface text-ink">
      <SectionColumn pathname={pathname} isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Dentro de uma seção, o goBack do celular sobe pra list de seções —
         * o primeiro dos dois níveis. Sair do modo é o voltar de lá. */}
        <MobileTopBar title={sectionTitle} backTo="/settings" />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col p-4 md:p-8">
          <div className="flex w-full max-w-3xl flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * O primeiro nível — `/settings` sem seção.
 *
 * **Não é redirecionamento** (design system, seção 5): no celular ele é a lista
 * de seções, que ali é uma tela de verdade; no desktop, onde coluna e painel
 * aparecem juntos, ele mostra a primeira seção visível de quem abriu. A URL não
 * muda nos dois casos, e é isso que faz o voltar do navegador sair do modo em
 * vez de pular entre seções.
 *
 * O ramo é escolhido por `useCompactViewport` (`matchMedia`) e não por CSS,
 * porque o que muda não é aparência: um lado renderiza uma lista de links, o
 * outro renderiza uma seção inteira com as consultas dela.
 */
export function SettingsIndex({
  isAdmin,
  renderSection,
}: {
  isAdmin: boolean
  /** A primeira seção visível, montada por quem chama — a rota é fina. */
  renderSection: (to: SectionTo) => ReactNode
}) {
  const compact = useCompactViewport()
  const networkControl = useNetworkControl(isAdmin)

  if (compact) {
    return (
      <div className="flex min-h-svh flex-col bg-surface text-ink">
        {/* Aqui o goBack SAI do modo: este é o topo da pile do celular. */}
        <MobileTopBar title={settingsCopy.title} backTo="/" />
        <SectionList isAdmin={isAdmin} />
      </div>
    )
  }

  return renderSection(firstVisibleSection(isAdmin, networkControl))
}

export { firstVisibleSection }

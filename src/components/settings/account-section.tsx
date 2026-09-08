import { useNavigate } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/domain/auth'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { appCopy } from '@/lib/copy'
import { settingsCopy } from '@/routes/-settings.copy'
import { DeleteLibrary } from './delete-library'
import { SectionHeader, SettingsFact } from './section-header'

/**
 * `YOU / Account` — quem a pessoa é neste servidor.
 *
 * **Ela só LÊ, e isso é o estado de hoje, não a forma final.** O wizard de
 * primeiro uso vai trazer nome de exibição e avatar (brief, 3.9), e os dois
 * moram aqui quando existirem — nome de exibição **não é `username`**, então
 * nenhum dos dois campos desta tela vira editável por tabela.
 *
 * `Log out` está aqui **e** no menu de conta, e a repetição é deliberada: o
 * menu de conta é o do APP, e no modo o app não está na tela. Sem esta cópia,
 * sair da sessão exigiria sair do modo primeiro.
 *
 * É componente e não rota porque `/settings` no desktop o monta como "primeira
 * seção visível" sem mudar de URL (design system, seção 5).
 */
export function AccountSection({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.account}
        body={settingsCopy.account.body}
        Icon={UserRound}
      />

      <div className="flex flex-col">
        <SettingsFact
          label={settingsCopy.account.username}
          value={user.username}
        />
        {/* O papel EXPLICADO, e não só nomeado: "Admin" sozinho não diz o que
         * muda, e o que muda é a régua do brief 3.9 — infraestrutura da
         * instância é do admin, conteúdo é do usuário. */}
        <SettingsFact
          label={settingsCopy.account.role}
          value={user.isAdmin ? appCopy.account.admin : appCopy.account.member}
          body={
            user.isAdmin
              ? settingsCopy.account.adminBody
              : settingsCopy.account.memberBody
          }
        />
      </div>

      <div className="mt-6 border-line border-t pt-5">
        <Button
          variant="outline"
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => navigate({ to: '/login' }),
            })
          }
          disabled={logout.isPending}
        >
          {settingsCopy.account.logOut}
        </Button>
      </div>

      {/* A zona de perigo é a ÚLTIMA coisa da seção, e depois de `Log out`:
       * ordem é hierarquia numa coluna, e o que não tem volta fica no fim
       * (decisão do dono, 07/09/2026 — ela mora aqui e não numa seção
       * própria). */}
      <DeleteLibrary />
    </>
  )
}

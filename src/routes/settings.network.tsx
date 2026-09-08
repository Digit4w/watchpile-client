import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import { SettingsShell } from '@/components/chrome/settings-shell'
import { NetworkSection } from '@/components/settings/network-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { settingsCopy } from './-settings.copy'

export const Route = createFileRoute('/settings/network')({
  component: SettingsNetworkRoute,
})

function SettingsNetworkRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  return (
    <SettingsShell
      isAdmin={user.isAdmin}
      sectionTitle={settingsCopy.sections.network}
    >
      <NetworkSection />
    </SettingsShell>
  )
}

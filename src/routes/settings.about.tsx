import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import { SettingsShell } from '@/components/chrome/settings-shell'
import { AboutSection } from '@/components/settings/about-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { settingsCopy } from './-settings.copy'

export const Route = createFileRoute('/settings/about')({
  component: SettingsAboutRoute,
})

function SettingsAboutRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  return (
    <SettingsShell
      isAdmin={user.isAdmin}
      sectionTitle={settingsCopy.sections.about}
    >
      <AboutSection />
    </SettingsShell>
  )
}

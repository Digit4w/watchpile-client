import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import { SettingsShell } from '@/components/chrome/settings-shell'
import { ImportSection } from '@/components/settings/import-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { importCopy } from './-import.copy'

/**
 * `YOU / Import` (brief, 3.12).
 *
 * **Sem guarda de admin**, e é decisão: import é conteúdo, e conteúdo é do
 * usuário (brief, 3.9). O que é da instalação — a chave do provedor — mora em
 * `THIS INSTANCE / Providers`, que já é guardado dos dois lados.
 */
export const Route = createFileRoute('/settings/import')({
  component: SettingsImportRoute,
})

function SettingsImportRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  return (
    <SettingsShell isAdmin={user.isAdmin} sectionTitle={importCopy.title}>
      <ImportSection />
    </SettingsShell>
  )
}

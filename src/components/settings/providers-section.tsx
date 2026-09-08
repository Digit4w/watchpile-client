import { useNavigate } from '@tanstack/react-router'
import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { useProviders } from '@/hooks/queries/providers/use-providers'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { settingsCopy } from '@/routes/-settings.copy'
import type { Provider } from '@/services/providers'
import {
  ProviderList,
  ProviderListSkeleton,
  ProvidersEmpty,
  ProvidersError,
  ProvidersForbidden,
} from './provider-list'
import { ProviderSheet } from './provider-sheet'
import { SectionHeader } from './section-header'

/**
 * `THIS INSTANCE / Providers` — onde este servidor procura obras.
 *
 * **Ler é de todo mundo; escrever é do admin** (brief, 3.10). A recusa é sobre a
 * SEÇÃO, não sobre a consulta — qualquer um lê a lista, porque a atribuição
 * precisa renderizar e porque saber que um tipo não tem provedor é o que deixa a
 * busca dizer isso em voz alta.
 *
 * **A ordem em que os estados são testados é decisão de design** (design system,
 * seção 8): a recusa vem antes de tudo porque não depende de requisição nenhuma,
 * e o erro vem antes do esqueleto porque quem já falhou não está mais esperando.
 *
 * **Não há `Add provider`**, e a ausência é decisão: cadastrar um provedor exige
 * escrever a definição — URL base, endpoints, mapa de campos —, que é outra
 * superfície. Botão que abrisse um formulário incompleto prometeria o que a tela
 * não faz.
 */
export function ProvidersSection({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate()
  const providers = useProviders()
  const isLoading = useDelayedPending(providers.isPending)
  const [open, setOpen] = useState<Provider | null>(null)

  if (!isAdmin) {
    return <ProvidersForbidden onBack={() => navigate({ to: '/settings' })} />
  }

  const list = providers.data ?? []

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.providers}
        body={settingsCopy.providers.body}
        Icon={Share2}
      />

      {providers.isError && (
        <ProvidersError
          error={providers.error}
          onRetry={() => providers.refetch()}
        />
      )}

      {!providers.isError && isLoading && <ProviderListSkeleton />}

      {providers.isSuccess && list.length === 0 && <ProvidersEmpty />}

      {providers.isSuccess && list.length > 0 && (
        <ProviderList providers={list} onOpen={setOpen} />
      )}

      {/* A folha lê o provedor do CACHE, não a cópia congelada de quando abriu:
       * salvar muda `configured` e `source`, e é isso que decide se o botão
       * `Remove` existe. */}
      <ProviderSheet
        provider={
          open ? (list.find(({ slug }) => slug === open.slug) ?? open) : null
        }
        onOpenChange={(open) => {
          if (!open) {
            setOpen(null)
          }
        }}
      />
    </>
  )
}

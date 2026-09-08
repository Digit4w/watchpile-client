import { Wifi } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useSetAllowRemote } from '@/hooks/mutations/network/use-set-allow-remote'
import { useNetwork } from '@/hooks/queries/network/use-network'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { settingsCopy } from '@/routes/-settings.copy'
import { ProvidersError } from './provider-list'
import { SectionHeader } from './section-header'

const copy = settingsCopy.network

/**
 * `THIS INSTANCE / Network` — em qual interface este servidor escuta.
 *
 * **Infraestrutura da instalação, então é do admin** (brief, 3.9): quem decide
 * isto decide quem alcança o servidor na rede de quem hospeda.
 *
 * **A seção só existe onde o controle existe**, e quem diz é o servidor, nunca
 * uma constante daqui — é a mesma régua das fontes de import. Num container
 * desligar conexões remotas cortaria a conexão de quem acabou de desligar,
 * inclusive a do admin que chegou pela LAN; num desktop quem clica é sempre
 * local, e o gesto nunca se volta contra quem o fez.
 *
 * **Sem `Save`**, como `YOU / Preferences` — toggle anuncia efeito imediato.
 * A diferença é que aqui o efeito tem uma metade que só chega no próximo boot,
 * e é ela que a frase de reinício existe pra dizer. Sem a frase, o controle
 * pareceria um clique que não pegou.
 */
export function NetworkSection() {
  const network = useNetwork()
  const save = useSetAllowRemote()
  const isLoading = useDelayedPending(network.isPending)

  const data = network.data ?? null

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.network}
        body={copy.body}
        Icon={Wifi}
      />

      {network.isError && (
        <ProvidersError
          error={network.error}
          onRetry={() => network.refetch()}
        />
      )}

      {!network.isError && (
        <section>
          {isLoading && (
            <div className="mt-2 flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-48 animate-pulse rounded-sm bg-raised" />
                <div className="h-3 w-72 animate-pulse rounded-sm bg-raised" />
              </div>
              <div className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-raised" />
            </div>
          )}

          {!isLoading && data && (
            <>
              <div className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p id="allow-remote" className="font-medium text-ink text-sm">
                    {copy.allowRemote.title}
                  </p>
                  <p className="mt-1 max-w-prose text-muted text-sm">
                    {copy.allowRemote.body}
                  </p>
                  {/* O endereço cru fica embaixo, em corpo menor: é o que
                   * permite conferir, e não é o que se decide. */}
                  <p className="mt-1 text-faint text-xs">
                    {copy.allowRemote.listening(data.host)}
                  </p>
                </div>
                {/* O `Switch` não recebe classe — o espaçamento fica no
                 * invólucro, como na linha de tipo de mídia. */}
                <div className="mt-0.5 shrink-0">
                  <Switch
                    aria-labelledby="allow-remote"
                    /**
                     * O que o toggle mostra é a INTENÇÃO, não o que está valendo:
                     * depois de tocar, o processo segue escutando onde subiu, e
                     * desenhar o estado antigo faria o controle voltar sozinho.
                     * Quem conta a diferença é a frase de reinício abaixo.
                     */
                    checked={data.intendedAllowsRemote}
                    disabled={save.isPending}
                    onCheckedChange={(next) => save.mutate(next)}
                  />
                </div>
              </div>

              {/* Só quando há o que reiniciar. Aviso permanente vira ruído, e
               * esta frase existe pra explicar por que o endereço acima não
               * mudou junto com o toggle. */}
              {data.restartPending && (
                <p className="text-faint text-xs">{copy.restart}</p>
              )}

              {/* A escrita é otimista pelo cache do servidor, então o que
               * falhou já voltou atrás na tela — a frase impede a volta de
               * parecer um clique que não pegou. O app não tem toast. */}
              {save.isError && (
                <p className="mt-2 text-danger text-xs">{copy.failed}</p>
              )}
            </>
          )}
        </section>
      )}
    </>
  )
}

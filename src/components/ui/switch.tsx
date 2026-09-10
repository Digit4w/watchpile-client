/**
 * Um liga/desliga.
 *
 * **Componente novo com um uso só, e isso fura a régua do inventário** (design
 * system, seção 5: nada se inventa antes de dois usos). Fica registrado como
 * exceção em vez de silêncio: um booleano desenhado como par de chips
 * (`On`/`Off`) seria pior — chip é escolha ENTRE valores, não estado de uma
 * coisa —, e o segundo uso já está previsto nas opções de instância que o
 * brief 3.9 põe no Settings do admin.
 *
 * Escrito à mão e não vindo do shadcn: o `Switch` de lá traz o Radix inteiro
 * pra um `<button>` com `aria-checked`, e aqui não há comportamento além do
 * que o `button` já dá.
 */
export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  id?: string
  disabled?: boolean
  'aria-labelledby'?: string
  /**
   * **Ele faltava, e quem o passava não era avisado** — 10/09/2026, achado
   * escrevendo o teste de `YOU/Preferences`. `media-type-toggle-row` escrevia
   * `aria-describedby` desde 04/09 pra prender o motivo da recusa ao controle,
   * e a peça o descartava: o `<span>` com o motivo ficava ÓRFÃO na linha, e o
   * toggle desabilitado não dizia por quê pra quem usa leitor de tela.
   *
   * **`tsc -b --force` sai limpo com o atributo desconhecido ali**, então não
   * há rede: atributo `aria-*` escrito num componente que não o declara some
   * sem erro, sem aviso de lint e sem sintoma visível. É o irmão do
   * `<label htmlFor>` apontando pra id inexistente (07/09) — *a11y quebra sem
   * ferramenta nenhuma acusar*.
   */
  'aria-describedby'?: string
}) {
  return (
    <button
      type="button"
      id={id}
      // `role="switch"` e não `checkbox`: os dois anunciam marcado ou não, mas
      // "switch" diz que o efeito é imediato e "checkbox" que ele espera um
      // envio. Aqui o campo faz parte de um formulário com `Save`, então o
      // rótulo do estado importa mais que a promessa de imediatismo — mas
      // `switch` é o que descreve o CONTROLE, e o `Save` é do formulário.
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-colors duration-[var(--motion-micro)] ease-chrome focus-visible:ring-[3px] focus-visible:ring-ink/50 disabled:opacity-[var(--opacity-disabled)] ${
        checked ? 'bg-ink' : 'bg-line'
      }`}
    >
      <span
        className={`size-4 rounded-full transition-transform duration-[var(--motion-micro)] ease-chrome ${
          checked ? 'translate-x-4 bg-surface' : 'translate-x-0.5 bg-faint'
        }`}
      />
    </button>
  )
}

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
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  id?: string
  disabled?: boolean
  'aria-labelledby'?: string
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

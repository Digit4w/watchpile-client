import type { ReactNode } from 'react'

/**
 * O TERCEIRO chrome do app é o Settings; este é o CHÃO dos dois primeiros — as
 * telas de antes do app.
 *
 * `/login` e `/setup` não têm sidebar, barra de abas nem cabeçalho: o app ainda
 * não está disponível, e desenhar a navegação dele seria affordance descrevendo
 * o que não existe. O que sobra é um painel centrado.
 *
 * **Extraído de `login.tsx` em 03/09/2026, ao ganhar o segundo consumidor.** O
 * mosaico da marca é o mesmo desenho em SVG dos dois lados, e duas cópias dele
 * é como uma fica pra trás.
 */

export function BrandMark() {
  return (
    <div className="text-accent">
      <svg
        width="32"
        height="32"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
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
    </div>
  )
}

/**
 * A largura acompanha o CONTEÚDO, e é a única coisa que difere entre as duas
 * telas: `/login` são dois campos e cabe em 384px; `/setup` é uma lista de
 * tipos, e espremê-la na mesma largura truncaria o nome de cada linha por
 * simetria com uma tela que não tem lista.
 */
export function PanelShell({
  size = 'sm',
  children,
}: {
  size?: 'sm' | 'lg'
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-surface p-8">
      <div
        className={`w-full rounded-lg border border-line bg-card p-8 ${
          size === 'lg' ? 'max-w-lg' : 'max-w-sm'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

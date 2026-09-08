import { GRID_GAP, ROW_PITCH } from '@/domain/home-metrics'
import type { HomeWidget } from '@/domain/home-widget'
import { WidgetFrame } from './widget-frame'

/**
 * A Home no celular: os mesmos widgets, empilhados.
 *
 * A grade não sobrevive à tela estreita — doze colunas em ~330px dão coluna de
 * 12px, e arrastar/redimensionar no toque com alvos desse tamanho não é
 * interface, é sorte. Então o celular não recebe uma grade apertada: recebe
 * uma pilha, largura cheia, na ordem que o usuário arrumou no desktop.
 *
 * **A ordem é a do layout, lida como leitura**: de cima pra baixo, e da
 * esquerda pra direita dentro da mesma linha. Dois widgets lado a lado no
 * desktop viram dois empilhados, o da esquerda primeiro — que é o que quem
 * arrumou aquele layout esperaria.
 *
 * **A altura é preservada**, e isso não é detalhe: é ela que faz a fileira de
 * cartas fechar certo (`domain/home-metrics.ts`). Largura pode mudar à vontade
 * porque nunca entrou na conta; altura, não.
 *
 * Sem modo de edição aqui — `editing` é sempre `false`. Reordenar e
 * redimensionar continuam sendo trabalho de tela grande, e oferecer no celular
 * um Edit Layout que não se consegue operar seria pior que não oferecer.
 */
export function HomeStack({ widgets }: { widgets: HomeWidget[] }) {
  const ordered = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x)

  return (
    <div className="flex flex-col gap-4">
      {ordered.map((widget, index) => (
        <div
          key={widget.id}
          style={{ height: widget.h * ROW_PITCH - GRID_GAP }}
        >
          <WidgetFrame widget={widget} editing={false} index={index} />
        </div>
      ))}
    </div>
  )
}

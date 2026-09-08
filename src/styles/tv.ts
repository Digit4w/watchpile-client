// Instância do tailwind-variants que conhece os tokens do projeto.
//
// Por que existe: o tailwind-merge (que roda dentro do tv e do cn) decide a qual
// grupo uma classe pertence por validador, não lendo design/tokens.css. O grupo
// "aspect" só reconhece a escala nativa (auto/square/video) e valor arbitrário —
// aspect-poster/aspect-cover/aspect-banner (design/tokens.css) não são nenhum dos
// dois, então ficam sem grupo: duas classes de aspect-ratio concorrentes deixam
// de se desambiguar (as duas sobrevivem, em vez da última vencer).
//
// Diferente do Negocia (`negocia/mobile/src/styles/tv.ts`), aqui não dá para
// derivar isso via Object.keys: os tokens vivem em @theme, dentro do CSS
// (Tailwind v4), não num objeto JS. Token novo em tokens.css precisa entrar na
// lista abaixo também.
//
// Importe tv e cn DESTE arquivo, nunca de "tailwind-variants" — o import direto
// traz a configuração padrão de volta e o bug junto. cva continua o caminho
// dentro de components/ui/ (shadcn) — tv é só para componente autoral.
import {
  type CnOptions,
  type CnReturn,
  cnMerge,
  createTV,
  type TVConfig,
} from 'tailwind-variants'

const ASPECT_TOKENS = ['poster', 'cover', 'banner']

const config: TVConfig = {
  twMergeConfig: {
    extend: {
      classGroups: {
        aspect: [{ aspect: ASPECT_TOKENS }],
      },
    },
  },
}

export const tv = createTV(config)

export const cn = <T extends CnOptions>(...classnames: T): CnReturn =>
  cnMerge(...classnames)(config)

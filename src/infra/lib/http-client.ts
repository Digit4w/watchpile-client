/**
 * O `status` de uma falha que nunca chegou a ter um.
 *
 * `fetch` REJEITA quando o servidor não respondeu — desligado, endereço errado,
 * máquina sem rede —, e o que ele lança é um `TypeError` cru, sem `status` e
 * com mensagem que muda de navegador. Sem normalizar, toda tela que pergunta
 * `error.status === 404` recebia `undefined` e caía no genérico, e o app nunca
 * teve como saber a diferença entre "não consegui falar" e "falei e deu erro".
 *
 * Zero é a convenção do XHR pra isso, e serve porque nenhum status HTTP real
 * ocupa o número — quem lê `>= 400` continua certo, e quem lê `=== 0` sabe que
 * não houve resposta. Quem decide o que fazer com ele é `domain/request-failure`.
 */
export const UNREACHABLE = 0

export class HttpError extends Error {
  status: number
  /**
   * O corpo da resposta, cru.
   *
   * Existe porque **algumas recusas carregam mais que uma frase**: o 503 da
   * busca traz um `reason`, e cada motivo aponta pra uma saída diferente — um
   * precisa de admin, outro de chave, outro só de esperar (brief, 3.10). Com o
   * status e a mensagem apenas, a tela teria que adivinhar qual dos cinco foi,
   * ou casar por texto, que quebra na primeira tradução.
   *
   * `unknown` de propósito: quem sabe a forma é quem chamou a rota, e a leitura
   * mora numa regra pura (ver `domain/search-refusal.ts`).
   */
  data: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
}

/**
 * O `fetch` que não deixa a rejeição vazar crua.
 *
 * Ele rejeita SÓ quando não houve resposta: 404 e 500 resolvem normalmente e
 * seguem pelo caminho de baixo. Então tudo que cai aqui é o servidor não ter
 * atendido, e é isso que `UNREACHABLE` diz.
 */
async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init)
  } catch (cause) {
    throw new HttpError(
      UNREACHABLE,
      cause instanceof Error ? cause.message : 'The server did not answer',
    )
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const res = await send(path, {
    method: options.method ?? 'GET',
    headers:
      options.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new HttpError(res.status, data?.message ?? res.statusText, data)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

/**
 * Corpo binário, com o mime vindo do próprio `Blob`.
 *
 * Não passa por `request` porque aquele serializa tudo em JSON e fixa o
 * `Content-Type` — aqui o tipo do arquivo É a informação, e é dele que o
 * servidor tira o que gravar em `cover_type`. O `fetch` põe o header sozinho a
 * partir do `Blob`, então não se escreve nenhum aqui: escrever à mão abriria a
 * chance de o header e os bytes discordarem.
 */
async function sendBlob<T>(
  path: string,
  method: string,
  blob: Blob,
): Promise<T> {
  const res = await send(path, { method, body: blob })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new HttpError(res.status, data?.message ?? res.statusText, data)
  }

  return res.json() as Promise<T>
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  /**
   * `PUT` de bytes, e o nome diz que ele é o caso especial.
   *
   * Ele se chamava `put` e ocupava o nome geral, o que deixou o primeiro `PUT`
   * de JSON sem onde entrar. Quem tem comportamento próprio — `Content-Type`
   * vindo do `Blob`, sem serialização — é quem carrega o nome comprido.
   */
  putBlob: <T>(path: string, blob: Blob) => sendBlob<T>(path, 'PUT', blob),
  /**
   * `POST` de bytes.
   *
   * `PUT` e `POST` de blob existem separados pelo mesmo motivo que existem em
   * JSON: a capa de pilha SUBSTITUI a única capa que a pilha tem, o import
   * CRIA um job novo numa coleção deles. O verbo é a diferença, e `sendBlob`
   * já a recebia por parâmetro — faltava só o segundo consumidor.
   */
  postBlob: <T>(path: string, blob: Blob) => sendBlob<T>(path, 'POST', blob),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

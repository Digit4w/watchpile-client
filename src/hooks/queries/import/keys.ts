export const importKeys = {
  all: ['import'] as const,
  /**
   * Uma chave só, porque a rota é uma só. `GET /status` responde as duas
   * metades da tela — o que está rodando e o resultado da última — porque a
   * tela pergunta uma coisa só, e a resposta a ela muda de forma conforme haja
   * ou não algo em curso.
   */
  status: () => [...importKeys.all, 'status'] as const,
}

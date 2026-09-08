// Catálogo de i18n ainda não decidido (client/CLAUDE.md) — este arquivo é o
// interino: nenhuma string nasce solta no JSX, mas a biblioteca fica em aberto.
export const loginCopy = {
  setup: {
    title: 'Set up Watchpile',
    subtitle:
      "You're the first person here — create the admin account to get started.",
    submit: 'Create admin account',
    passwordHint: 'At least 8 characters.',
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to your Watchpile.',
    submit: 'Log in',
  },
  fields: {
    username: 'Username',
    password: 'Password',
  },
  errors: {
    invalidCredentials: 'Incorrect username or password.',
    generic: "Couldn't reach the server. Try again.",
  },
}

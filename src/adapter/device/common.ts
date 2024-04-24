export const prettifyError = (err: Error): string =>
  `[${err.name}] ${err.message}\n\n#### stacktrace\n${err.stack}`

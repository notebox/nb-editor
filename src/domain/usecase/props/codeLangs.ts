export const keys = [
  "applescript",
  "asciidoc",
  "bash",
  "c",
  "cmake",
  "coffeescript",
  "cpp",
  "csharp",
  "css",
  "dart",
  "django",
  "docker",
  "elixir",
  "erb",
  "erlang",
  "excel",
  "go",
  "handlebars",
  "haskell",
  "html",
  "http",
  "java",
  "javascript",
  "json",
  "kotlin",
  "lua",
  "makefile",
  "markdown",
  "markup",
  "nginx",
  "objectivec",
  "perl",
  "php",
  "plain",
  "powershell",
  "python",
  "r",
  "ruby",
  "rust",
  "scala",
  "scss",
  "sql",
  "swift",
  "typescript",
  "vim",
  "xml",
  "yaml",
] as const

export type CodeKey = typeof keys[number];
export const match = (str: string): CodeKey[] => {
  const trimmed = str.trim().toLowerCase()
  if (!trimmed) return [...keys]
  if (trimmed === "js") return ["javascript", "typescript"]
  if (trimmed === "ts") return ["typescript", "javascript"]
  return keys.filter(key => key.includes(trimmed))
}

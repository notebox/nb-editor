export const deleteSubstring = (
  value: string,
  start: number,
  end: number
): string => {
  return value.substring(0, start) + value.substring(end)
}

export const insertSubstring = (
  value: string,
  index: number,
  substring: string
): string => {
  return value.substring(0, index) + substring + value.substring(index)
}

export const modifySubstring = (
  value: string,
  index: number,
  to: string
): string => {
  return value.substring(0, index) + to + value.substring(index + to.length)
}

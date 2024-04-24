export const saveFile = (data: string, filename: string) => {
  const blob = new Blob([data], {type: "octet/stream"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  document.body.appendChild(a)
  a.href = url
  a.download = filename

  setTimeout(() => {
    // setTimeout hack is required for older versions of Safari
    a.click()
    // cleanup
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 1)
}

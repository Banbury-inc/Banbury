export type RenameInputFocusMode = 'filename' | 'all'

export function selectFilenameWithoutExtension(input: HTMLInputElement) {
  const value = input.value
  const lastDotIndex = value.lastIndexOf('.')
  if (lastDotIndex > 0) {
    input.setSelectionRange(0, lastDotIndex)
  } else {
    input.select()
  }
}

export function focusRenameInput(
  input: HTMLInputElement | null,
  mode: RenameInputFocusMode = 'filename'
) {
  if (!input) return

  input.focus()
  if (mode === 'all') {
    input.select()
    return
  }

  selectFilenameWithoutExtension(input)
}

export function scheduleRenameInputFocus(
  getInput: () => HTMLInputElement | null,
  mode: RenameInputFocusMode = 'filename'
): () => void {
  const timeoutId = setTimeout(() => {
    focusRenameInput(getInput(), mode)
  }, 10)

  return () => clearTimeout(timeoutId)
}

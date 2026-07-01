interface OpenFilePickerOptions {
  multiple?: boolean
  accept?: string
}

function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && window.desktopApp?.isDesktop === true
}

function bufferToFile(
  name: string,
  data: ArrayBuffer,
  mimeType: string,
): File {
  return new File([new Uint8Array(data)], name, { type: mimeType })
}

function openFilePickerViaInput(options: OpenFilePickerOptions = {}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = options.multiple ?? false
    if (options.accept) {
      input.accept = options.accept
    }
    input.style.display = 'none'

    input.onchange = (event) => {
      const target = event.target as HTMLInputElement
      const files = target.files ? Array.from(target.files) : []
      document.body.removeChild(input)
      resolve(files)
    }

    input.oncancel = () => {
      if (input.parentNode) {
        document.body.removeChild(input)
      }
      resolve([])
    }

    document.body.appendChild(input)
    input.click()
  })
}

export async function openFilePicker(options: OpenFilePickerOptions = {}): Promise<File[]> {
  if (isDesktopApp() && window.desktopApp?.openFileDialog) {
    const result = await window.desktopApp.openFileDialog({
      multiple: options.multiple,
    })

    if (result.canceled || result.files.length === 0) {
      return []
    }

    return result.files.map((file) =>
      bufferToFile(file.name, file.data, file.mimeType),
    )
  }

  return openFilePickerViaInput(options)
}

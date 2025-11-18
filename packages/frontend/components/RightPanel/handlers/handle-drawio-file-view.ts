import type { FileSystemItem } from "../../../utils/fileTreeUtils"

interface CreateHandleDrawioFileViewArgs {
  setSelectedDrawioFile: (file: FileSystemItem | null) => void
  setDrawioModalOpen: (isOpen: boolean) => void
}

export function createHandleDrawioFileView({
  setSelectedDrawioFile,
  setDrawioModalOpen,
}: CreateHandleDrawioFileViewArgs) {
  function handleDrawioFileView(file: FileSystemItem) {
    if (!file) return
    setSelectedDrawioFile(file)
    setDrawioModalOpen(true)
  }

  return handleDrawioFileView
}



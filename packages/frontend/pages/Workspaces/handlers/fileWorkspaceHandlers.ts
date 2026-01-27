import { useCallback } from 'react'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { PanelGroup, UserInfo } from '../types'
import { handleFileSelect as handleFileSelectHandler } from './handleFileSelect'
import { handleFileDeleted as handleFileDeletedHandler } from './handleFileDeleted'
import { handleFileRenamed as handleFileRenamedHandler } from '../../../components/LeftPanel/components/FilesTab/handlers/handleFileRenamed'
import { handleFileMoved as handleFileMovedHandler } from './handleFileMoved'
import { handleFolderRenamed as handleFolderRenamedHandler } from '../../../components/LeftPanel/components/FilesTab/handlers/handleFolderRenamed'
import { handleCreateWordDocument } from './handleCreateWordDocument'
import { handleCreateSpreadsheet } from '../../../components/LeftPanel/components/FilesTab/handlers/handleCreateSpreadsheet'
import { handleCreateNotebook } from '../../../components/LeftPanel/components/FilesTab/handlers/handleCreateNotebook'
import { handleCreateDrawio } from '../../../components/LeftPanel/components/FilesTab/handlers/handleCreateDrawio'
import { handleCreateTldraw } from '../../../components/LeftPanel/components/FilesTab/handlers/handleCreateTldraw'
import { handleCreatePowerpoint } from './handleCreatePowerpoint'
import { handleGenerateImage } from './handleGenerateImage'
import { getAllTabs, updatePanelActiveTab, addTabToPanel } from './panelUtils'

interface WorkspaceDependencies {
  activePanelId: string
  panelLayout: PanelGroup
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
  selectedFile: FileSystemItem | null
  triggerSidebarRefresh: () => void
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
  userInfo: UserInfo | null
}

export function useFileWorkspaceHandlers(deps: WorkspaceDependencies) {
  const {
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
    setSelectedFile,
    selectedFile,
    triggerSidebarRefresh,
    toast,
    userInfo
  } = deps

  const handleFileSelect = useCallback((file: FileSystemItem) => {
    handleFileSelectHandler({
      file,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedFile,
    })
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout, setSelectedFile])

  const handleFileDeleted = useCallback((fileId: string) => {
    handleFileDeletedHandler(fileId, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh)
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh])

  const handleFileRenamed = useCallback((oldPath: string, newPath: string) => {
    handleFileRenamedHandler(oldPath, newPath, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh)
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh])

  const handleFileMoved = useCallback((fileId: string, oldPath: string, newPath: string) => {
    handleFileMovedHandler({
      fileId,
      oldPath,
      newPath,
      selectedFile,
      setPanelLayout,
      setSelectedFile,
      triggerSidebarRefresh
    })
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh])

  const handleFolderRenamed = useCallback((oldPath: string, newPath: string) => {
    handleFolderRenamedHandler(oldPath, newPath, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh, toast)
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh, toast])

  const handleCreateDocument = useCallback((name?: string) => {
    handleCreateWordDocument(userInfo, toast, triggerSidebarRefresh, name)
  }, [userInfo, toast, triggerSidebarRefresh])

  const handleCreateSpreadsheetCallback = useCallback((name?: string) => {
    handleCreateSpreadsheet(userInfo, toast, triggerSidebarRefresh, name)
  }, [userInfo, toast, triggerSidebarRefresh])

  const handleCreateNotebookCallback = useCallback((name?: string) => {
    handleCreateNotebook(userInfo, toast, triggerSidebarRefresh, name)
  }, [userInfo, toast, triggerSidebarRefresh])

  const handleCreateDrawioCallback = useCallback((name?: string) => {
    handleCreateDrawio(userInfo, toast, triggerSidebarRefresh, name)
  }, [userInfo, toast, triggerSidebarRefresh])

  const handleCreateTldrawCallback = useCallback((name?: string) => {
    handleCreateTldraw(userInfo, toast, triggerSidebarRefresh, name)
  }, [userInfo, toast, triggerSidebarRefresh])

  const handleCreatePowerpointCallback = useCallback((name?: string) => {
    handleCreatePowerpoint(userInfo, toast, triggerSidebarRefresh, name)
  }, [userInfo, toast, triggerSidebarRefresh])

  const handleGenerateImageCallback = useCallback(async () => {
    await handleGenerateImage({ userInfo, toast, triggerSidebarRefresh })
  }, [userInfo, toast, triggerSidebarRefresh])

  return {
    handleFileSelect,
    handleFileDeleted,
    handleFileRenamed,
    handleFileMoved,
    handleFolderRenamed,
    handleCreateDocument,
    handleCreateSpreadsheet: handleCreateSpreadsheetCallback,
    handleCreateNotebook: handleCreateNotebookCallback,
    handleCreateDrawio: handleCreateDrawioCallback,
    handleCreateTldraw: handleCreateTldrawCallback,
    handleCreatePowerpoint: handleCreatePowerpointCallback,
    handleGenerateImage: handleGenerateImageCallback
  }
}

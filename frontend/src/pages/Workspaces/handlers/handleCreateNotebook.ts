import { CONFIG } from '../../../config/config'

interface UserInfo {
  username: string
  email?: string
  first_name?: string
  last_name?: string
  picture?: any
  phone_number?: string
  auth_method?: string
}

interface ToastFunction {
  (options: {
    title: string
    description: string
    variant: 'success' | 'destructive'
  }): void
}

const uploadToS3 = async (
  file: File | Blob,
  deviceName: string,
  filePath: string = '',
  fileParent: string = ''
): Promise<any> => {
  const token = localStorage.getItem('authToken')
  const apiKey = localStorage.getItem('apiKey')
  if (!token) throw new Error('Authentication token not found. Please login first.')
  const formData = new FormData()
  formData.append('file', file)
  formData.append('device_name', deviceName)
  formData.append('file_path', filePath)
  formData.append('file_parent', fileParent)
  const response = await fetch(`${CONFIG.url}/files/upload_to_s3/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(apiKey && { 'X-API-Key': apiKey })
    },
    body: formData
  })
  if (!response.ok) {
    if (response.status === 413) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`STORAGE_LIMIT_EXCEEDED: ${errorData.message || 'Storage limit exceeded. Please subscribe to Pro plan for unlimited storage.'}`)
    }
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

export const handleCreateNotebook = async (
  userInfo: UserInfo | null,
  setUploading: (uploading: boolean) => void,
  toast: ToastFunction,
  triggerSidebarRefresh: () => void,
  notebookName?: string
) => {
  if (!userInfo?.username) return
  setUploading(true)
  try {
    const base: any = {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: { language_info: { name: 'python' } },
      cells: [
        { cell_type: 'markdown', metadata: {}, source: [
          '# New Notebook\n',
          'This notebook was created in Workspaces.\n'
        ]},
        { cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source: [
          'print("Hello from Pyodide!")\n'
        ]}
      ]
    }
    const fileName = `${(notebookName || 'New Notebook').replace(/\.ipynb$/, '')}.ipynb`
    const blob = new Blob([JSON.stringify(base, null, 2)], { type: 'application/json' })
    await uploadToS3(blob, userInfo.username, fileName, '')
    toast({ title: 'Notebook created', description: `${fileName} has been created and uploaded.`, variant: 'success' })
    triggerSidebarRefresh()
  } catch (error) {
    if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
      toast({ title: 'Storage limit exceeded', description: 'You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.', variant: 'destructive' })
    } else {
      toast({ title: 'Failed to create notebook', description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' })
    }
  } finally {
    setUploading(false)
  }
}



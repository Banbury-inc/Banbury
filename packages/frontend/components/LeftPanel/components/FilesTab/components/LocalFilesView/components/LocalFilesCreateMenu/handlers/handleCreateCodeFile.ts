import { CONFIG } from '../../../../../../../../../config/config'

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

export const handleCreateCodeFile = async (
  userInfo: UserInfo | null,
  toast: ToastFunction,
  triggerSidebarRefresh: () => void,
  fileName?: string
) => {
  if (!userInfo?.username) return
  try {
    const nameWithExt = fileName
      ? (fileName.includes('.') ? fileName : `${fileName}.py`)
      : 'main.py'

    const initialContent = `# ${nameWithExt}\n`
    const blob = new Blob([initialContent], { type: 'text/plain' })
    await uploadToS3(blob, userInfo.username, nameWithExt, '')
    toast({ title: 'File created', description: `${nameWithExt} has been created.`, variant: 'success' })
    triggerSidebarRefresh()
  } catch (error) {
    if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
      toast({ title: 'Storage limit exceeded', description: 'You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.', variant: 'destructive' })
    } else {
      toast({ title: 'Failed to create file', description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' })
    }
  }
}

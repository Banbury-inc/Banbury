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
    variant: "success" | "destructive"
  }): void
}

// Web-compatible version of uploadToS3 function
const uploadToS3 = async (
  file: File | Blob,
  deviceName: string,
  filePath: string = '',
  fileParent: string = ''
): Promise<any> => {
  // Load authentication credentials from localStorage (web version)
  const token = localStorage.getItem('authToken')
  const apiKey = localStorage.getItem('apiKey')
  
  if (!token) {
    throw new Error('Authentication token not found. Please login first.')
  }

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
    // Handle storage limit exceeded (413 Payload Too Large)
    if (response.status === 413) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`STORAGE_LIMIT_EXCEEDED: ${errorData.message || 'Storage limit exceeded. Please subscribe to Pro plan for unlimited storage.'}`)
    }
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

// Handle PowerPoint presentation creation
export const handleCreatePowerpoint = async (
  userInfo: UserInfo | null,
  setUploading: (uploading: boolean) => void,
  toast: ToastFunction,
  triggerSidebarRefresh: () => void,
  presentationName?: string
) => {
  if (!userInfo?.username) return

  setUploading(true)

  try {
    // Generate filename - use provided name or default
    const fileName = presentationName 
      ? `${presentationName}.pptx`
      : `New Presentation ${new Date().toISOString().split('T')[0]}.pptx`

    // Create .pptx using pptxgenjs library
    const PptxGenJS = (await import('pptxgenjs')).default
    
    const pptx = new PptxGenJS()
    
    // Set presentation metadata
    pptx.author = userInfo.username
    pptx.title = presentationName || 'New Presentation'
    pptx.subject = 'Created with Banbury'
    
    // Create title slide
    const titleSlide = pptx.addSlide()
    
    // Add title text
    titleSlide.addText(presentationName || 'New Presentation', {
      x: 0.5,
      y: 2.5,
      w: '90%',
      h: 1.5,
      fontSize: 44,
      fontFace: 'Arial',
      color: '363636',
      bold: true,
      align: 'center',
      valign: 'middle'
    })
    
    // Add subtitle text
    titleSlide.addText('Click to add subtitle', {
      x: 0.5,
      y: 4,
      w: '90%',
      h: 0.75,
      fontSize: 24,
      fontFace: 'Arial',
      color: '666666',
      align: 'center',
      valign: 'middle'
    })

    // Generate the presentation as a blob
    const blob = await pptx.write({ outputType: 'blob' }) as Blob

    // Upload presentation using the uploadToS3 function
    await uploadToS3(
      blob,
      userInfo.username,
      fileName,
      ''
    )
    
    // Show success toast
    toast({
      title: "Presentation created successfully",
      description: `${fileName} has been created and uploaded.`,
      variant: "success",
    })
    
    // Trigger sidebar refresh after successful presentation creation
    triggerSidebarRefresh()
  } catch (error) {
    // Check if it's a storage limit error
    if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
      toast({
        title: "Storage limit exceeded",
        description: "You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Failed to create presentation",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  } finally {
    setUploading(false)
  }
}


import { CONFIG } from '../../../config/config';

interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}

interface ToastFunction {
  (options: {
    title: string;
    description: string;
    variant: "success" | "destructive";
  }): void;
}

// Web-compatible version of uploadToS3 function
const uploadToS3 = async (
  file: File | Blob,
  deviceName: string,
  filePath: string = '',
  fileParent: string = ''
): Promise<any> => {
  // Load authentication credentials from localStorage (web version)
  const token = localStorage.getItem('authToken');
  const apiKey = localStorage.getItem('apiKey'); // If you use API keys
  
  if (!token) {
    throw new Error('Authentication token not found. Please login first.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('device_name', deviceName);
  formData.append('file_path', filePath);
  formData.append('file_parent', fileParent);

  const response = await fetch(`${CONFIG.url}/files/upload_to_s3/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(apiKey && { 'X-API-Key': apiKey })
    },
    body: formData
  });

  if (!response.ok) {
    // Handle storage limit exceeded (413 Payload Too Large)
    if (response.status === 413) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`STORAGE_LIMIT_EXCEEDED: ${errorData.message || 'Storage limit exceeded. Please subscribe to Pro plan for unlimited storage.'}`);
    }
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// Handle Word document creation
export const handleCreateWordDocument = async (
  userInfo: UserInfo | null,
  setUploading: (uploading: boolean) => void,
  toast: ToastFunction,
  triggerSidebarRefresh: () => void,
  documentName?: string
) => {
  if (!userInfo?.username) return;

  setUploading(true);

  try {
    // Create simple document content
    const content = `New Document

Welcome to your new document!`;


    // Generate filename - use provided name or default
    const fileName = documentName 
      ? `${documentName}.docx`
      : `New Document ${new Date().toISOString().split('T')[0]}.docx`;

    // Create .docx using docx library
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: documentName || "New Document",
            heading: HeadingLevel.HEADING_1,
          }),
          ...content.split('\n').slice(2).map(line => 
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  break: 1,
                }),
              ],
            })
          )
        ],
      }],
    });

    // Generate the document as a blob
    const blob = await Packer.toBlob(doc);

    // Upload document using the uploadToS3 function
    
    await uploadToS3(
      blob,
      userInfo.username,
      fileName,
      ''
    );
    
    // Show success toast
    toast({
      title: "Document created successfully",
      description: `${fileName} has been created and uploaded.`,
      variant: "success",
    });
    
    // Trigger sidebar refresh after successful document creation
    triggerSidebarRefresh();
  } catch (error) {
    // Check if it's a storage limit error
    if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
      // Show storage limit exceeded toast
      toast({
        title: "Storage limit exceeded",
        description: "You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.",
        variant: "destructive",
      });
    } else {
      // Show generic error toast
      toast({
        title: "Failed to create document",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  } finally {
    setUploading(false);
  }
};

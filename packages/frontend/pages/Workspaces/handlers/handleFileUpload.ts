import { CONFIG } from '../../../config/config';

// Toast type
type Toast = (props: {
  title: string;
  description: string;
  variant: 'default' | 'destructive' | 'success' | 'error';
}) => void;

interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}

// Web-compatible version of uploadToS3 function
export const uploadToS3 = async (
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

export const handleFileUpload = (
  userInfo: UserInfo | null,
  setUploading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: Toast,
  triggerSidebarRefresh: () => void
) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '*/*';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !userInfo?.username) return;

    setUploading(true);

    try {
      // Upload file using the uploadToS3 function
      await uploadToS3(
        file,
        userInfo.username,
        `uploads/${file.name}`,
        'uploads'
      );
      
      // Show success toast
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded.`,
        variant: "success",
      });
      
      // Trigger sidebar refresh after successful upload
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
          title: "Failed to upload file",
          description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
  };
  input.click();
};

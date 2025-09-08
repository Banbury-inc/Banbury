import { CONFIG } from '../../../config/config';
import * as XLSX from 'xlsx';

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

// Handle spreadsheet creation
export const handleCreateSpreadsheet = async (
  userInfo: UserInfo | null,
  setUploading: (uploading: boolean) => void,
  toast: ToastFunction,
  triggerSidebarRefresh: () => void,
  spreadsheetName?: string
) => {
  if (!userInfo?.username) return;

  setUploading(true);

  try {
    // Create simple spreadsheet data with headers and sample data
    const data = [
      ['Name', 'Email', 'Phone', 'Department'],
      ['John Doe', 'john.doe@example.com', '555-0101', 'Engineering'],
      ['Jane Smith', 'jane.smith@example.com', '555-0102', 'Marketing'],
      ['Bob Johnson', 'bob.johnson@example.com', '555-0103', 'Sales'],
      ['Alice Brown', 'alice.brown@example.com', '555-0104', 'HR']
    ];

    // Generate filename - use provided name or default
    const fileName = spreadsheetName 
      ? `${spreadsheetName}.xlsx`
      : `New Spreadsheet ${new Date().toISOString().split('T')[0]}.xlsx`;

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate XLSX file as buffer
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create XLSX blob
    const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Upload spreadsheet using the uploadToS3 function
    
    await uploadToS3(
      blob,
      userInfo.username,
      fileName,
      ''
    );
    
    // Show success toast
    toast({
      title: "Spreadsheet created successfully",
      description: `${fileName} has been created and uploaded.`,
      variant: "success",
    });
    
    // Trigger sidebar refresh after successful spreadsheet creation
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
        title: "Failed to create spreadsheet",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  } finally {
    setUploading(false);
  }
};

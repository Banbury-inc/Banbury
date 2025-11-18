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

// Handle spreadsheet creation
export const handleCreateSpreadsheet = async (
  userInfo: UserInfo | null,
  setUploading: (uploading: boolean) => void,
  toast: ToastFunction,
  triggerSidebarRefresh: () => void,
  spreadsheetName?: string
) => {
  console.log('[handleCreateSpreadsheet] Starting spreadsheet creation, name:', spreadsheetName);
  if (!userInfo?.username) return;

  setUploading(true);

  try {
    // Create simple spreadsheet data with headers and sample data
    const data = [
      ['', '', '', ''],
      ['', '', '', ''],
    ];

    // Generate filename - use provided name or default
    const fileName = spreadsheetName 
      ? `${spreadsheetName}.xlsx`
      : `New Spreadsheet ${new Date().toISOString().split('T')[0]}.xlsx`;

    // Create workbook and worksheet using ExcelJS (same as the loader expects)
    const ExcelJSImport = await import('exceljs');
    const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    
    // Add the data to the worksheet
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const excelCell = worksheet.getCell(rowIndex + 1, colIndex + 1);
        excelCell.value = cell;
      });
    });
    
    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      if (column && column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell: any) => {
          const columnLength = cell.value ? String(cell.value).length : 0;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50); // Set max width to 50
      }
    });

    // Generate XLSX buffer and create blob
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('[handleCreateSpreadsheet] XLSX buffer created, size:', buffer.byteLength);
    
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    console.log('[handleCreateSpreadsheet] Blob created, size:', blob.size, 'type:', blob.type);

    // Upload spreadsheet using the uploadToS3 function
    console.log('[handleCreateSpreadsheet] Uploading to S3...');
    
    const uploadResult = await uploadToS3(
      blob,
      userInfo.username,
      fileName,
      ''
    );
    console.log('[handleCreateSpreadsheet] Upload result:', uploadResult);
    
    // Show success toast
    toast({
      title: "Spreadsheet created successfully",
      description: `${fileName} has been created and uploaded.`,
      variant: "success",
    });
    
    // Add a small delay before refreshing to ensure S3 has processed the file
    setTimeout(() => {
      console.log('[handleCreateSpreadsheet] Triggering sidebar refresh after delay');
      // Trigger sidebar refresh after successful spreadsheet creation
      triggerSidebarRefresh();
    }, 1000);
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

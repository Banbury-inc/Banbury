import { ApiService } from '../../../../backend/api/apiService';

interface UserInfo {
  username: string;
  email?: string;
}

interface Toast {
  (options: { title: string; description?: string; variant?: 'success' | 'destructive' | 'default' }): void;
}

/**
 * Creates a new draw.io diagram file
 * @param userInfo User information
 * @param setUploading Function to set uploading state
 * @param toast Toast notification function
 * @param triggerSidebarRefresh Function to refresh the sidebar
 * @param diagramName Name of the diagram (without extension)
 */
export async function handleCreateDrawio(
  userInfo: UserInfo | null,
  setUploading: (uploading: boolean) => void,
  toast: Toast,
  triggerSidebarRefresh: () => void,
  diagramName: string
): Promise<void> {
  if (!userInfo?.username) {
    toast({
      title: 'Error',
      description: 'User information not available',
      variant: 'destructive',
    });
    return;
  }

  const fileName = `${diagramName}.drawio`;
  
  // Create a basic draw.io XML structure
  const drawioXml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Banbury-Website" etag="${Math.random().toString(36).substring(2)}" version="22.1.16" type="device">
  <diagram id="${Math.random().toString(36).substring(2)}" name="Page-1">
    <mxGraphModel dx="1038" dy="627" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" value="Welcome to your new diagram!" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="314" y="290" width="200" height="60" as="geometry" />
        </mxCell>
        <mxCell id="3" value="Click to edit or add more shapes" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="314" y="370" width="200" height="30" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  setUploading(true);

  try {
    // Convert the XML to a Blob
    const blob = new Blob([drawioXml], { type: 'application/xml' });
    
    // Create a File object
    const file = new File([blob], fileName, { type: 'application/xml' });

    // Upload the file using the existing API service
    await ApiService.uploadToS3(file, fileName, 'web-editor', fileName, '');

    // Trigger sidebar refresh to show the new file
    triggerSidebarRefresh();

    // Dispatch event to notify file creation
    window.dispatchEvent(
      new CustomEvent('assistant-file-created', {
        detail: {
          result: {
            file_info: {
              file_name: fileName,
              file_path: fileName,
              name: fileName,
              path: fileName,
            }
          }
        }
      })
    );

    toast({
      title: 'Success',
      description: `Draw.io diagram "${fileName}" created successfully`,
      variant: 'success',
    });
  } catch (error) {
    console.error('Failed to create draw.io diagram:', error);
    toast({
      title: 'Error',
      description: 'Failed to create draw.io diagram. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setUploading(false);
  }
}

export default handleCreateDrawio;

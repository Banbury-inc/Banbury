import { ApiService } from '../../../../../../../../../../backend/api/apiService';
import { UserInfo } from '../../../../../../../../../pages/Workspaces/types';

export const handleCreateTldraw = async (
  userInfo: UserInfo | null | undefined,
  toast: any,
  triggerSidebarRefresh: () => void,
  canvasName?: string
) => {
  if (!userInfo?.username) {
    toast({
      title: 'Error',
      description: 'User information not available.',
      variant: 'destructive',
    });
    return;
  }

  try {
    // Generate filename - use provided name or default
    const fileName = canvasName 
      ? `${canvasName}.tldraw`
      : `New Canvas ${new Date().toISOString().split('T')[0]}.tldraw`;
    const filePath = fileName; // Assuming root for now, or can be extended for folders

    // Minimal tldraw JSON structure - let tldraw create its own schema
    const tldrawContent = {
      "tldrawFileFormatVersion": 1,
      "schema": {},
      "records": []
    };

    const blob = new Blob([JSON.stringify(tldrawContent, null, 2)], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });

    await ApiService.Files.uploadToS3(file, fileName, 'web-editor', filePath, '');

    toast({
      title: 'Success',
      description: `Tldraw canvas "${fileName}" created.`,
      variant: 'success',
    });
    triggerSidebarRefresh();
  } catch (error) {
    console.error('Failed to create tldraw canvas:', error);
    toast({
      title: 'Error',
      description: 'Failed to create tldraw canvas. Please try again.',
      variant: 'destructive',
    });
  }
};

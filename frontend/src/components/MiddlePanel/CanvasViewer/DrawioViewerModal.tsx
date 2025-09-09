import React from 'react';
import { X } from 'lucide-react';

import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import DrawioViewer from './DrawioViewer';
import { FileSystemItem } from '../../../utils/fileTreeUtils';

interface DrawioViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileSystemItem | null;
}

export const DrawioViewerModal: React.FC<DrawioViewerModalProps> = ({
  isOpen,
  onClose,
  file
}) => {
  if (!file) return null;

  const fileUrl = file.s3_url || file.path;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{file.name}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <DrawioViewer
            fileUrl={fileUrl}
            fileName={file.name}
            isEmbedded={true}
            className="h-[70vh]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrawioViewerModal;

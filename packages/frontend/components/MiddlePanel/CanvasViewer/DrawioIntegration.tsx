import React, { useState, useCallback, useEffect } from 'react';
import { Network, Upload, FileText } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import DrawioViewer from './DrawioViewer';
import DrawioViewerModal from './DrawioViewerModal';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { isDrawioFile } from './handlers/drawio-viewer-handlers';

interface DrawioIntegrationProps {
  files: FileSystemItem[];
  onFileView?: (file: FileSystemItem) => void;
  className?: string;
}

interface DrawioStats {
  totalFiles: number;
  diagramFiles: number;
  regularFiles: number;
}

export const DrawioIntegration: React.FC<DrawioIntegrationProps> = ({
  files,
  onFileView,
  className
}) => {
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate file statistics
  const stats: DrawioStats = React.useMemo(() => {
    const diagramFiles = files.filter(file => isDrawioFile(file.name));
    return {
      totalFiles: files.length,
      diagramFiles: diagramFiles.length,
      regularFiles: files.length - diagramFiles.length
    };
  }, [files]);

  // Get draw.io files
  const drawioFiles = React.useMemo(() => {
    return files.filter(file => isDrawioFile(file.name));
  }, [files]);

  // Handle file view
  const handleFileView = useCallback((file: FileSystemItem) => {
    setSelectedFile(file);
    setIsModalOpen(true);
    onFileView?.(file);
  }, [onFileView]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedFile(null);
  }, []);

  // Handle creating new diagram
  const handleCreateDiagram = useCallback(() => {
    const newDiagramUrl = 'https://app.diagrams.net/?create=1&title=New%20Diagram';
    window.open(newDiagramUrl, '_blank');
  }, []);

  // Listen for diagram-related events
  useEffect(() => {
    const handleDrawioEvent = (event: CustomEvent) => {
      const { detail } = event;
      // Handle events from DrawioAITool or other components
      // This could trigger refreshing files, showing notifications, etc.
    };

    window.addEventListener('drawio-ai-response', handleDrawioEvent as EventListener);
    
    return () => {
      window.removeEventListener('drawio-ai-response', handleDrawioEvent as EventListener);
    };
  }, []);

  if (files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Files Available</h3>
            <p className="text-muted-foreground mb-4">
              Upload some files to start viewing diagrams and documents.
            </p>
            <Button onClick={handleCreateDiagram} variant="outline">
              <Network className="h-4 w-4 mr-2" />
              Create New Diagram
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Statistics Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5" />
                File Overview
              </CardTitle>
              <CardDescription>
                Manage and view your documents and diagrams
              </CardDescription>
            </div>
            <Button onClick={handleCreateDiagram} variant="outline" size="sm">
              <Network className="h-4 w-4 mr-2" />
              New Diagram
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {stats.totalFiles} Total Files
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {stats.diagramFiles} Diagrams
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {stats.regularFiles} Documents
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draw.io Files Grid */}
      {drawioFiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="h-5 w-5" />
              Diagrams ({drawioFiles.length})
            </CardTitle>
            <CardDescription>
              Click on any diagram to view or edit it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drawioFiles.map((file) => (
                <Card
                  key={file.file_id || file.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleFileView(file)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Network className="h-8 w-8 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {file.size ? `${Math.round(file.size / 1024)} KB` : 'Diagram'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Files Section */}
      {stats.regularFiles > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Other Documents ({stats.regularFiles})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files
                .filter(file => !isDrawioFile(file.name))
                .map((file) => (
                  <div
                    key={file.file_id || file.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {file.size ? `${Math.round(file.size / 1024)} KB` : 'Document'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal for viewing diagrams */}
      <DrawioViewerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        file={selectedFile}
      />
    </div>
  );
};

export default DrawioIntegration;

import { AlertCircle, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

import { Button } from '../ui/button';
import { ApiService } from '../../../backend/api/apiService'
import { FileSystemItem } from '../../utils/fileTreeUtils';

interface ImageViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

export function ImageViewer({ file, userInfo }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;

    const loadImage = async () => {
      if (!file.file_id) {
        setError('No file ID available for this image');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const isDriveFile = file.path?.startsWith('drive://');
        
        if (isDriveFile) {
          // Handle Google Drive file
          const blob = await ApiService.Drive.getFileBlob(file.file_id);
          const url = window.URL.createObjectURL(blob);
          currentUrl = url;
          setImageUrl(url);
        } else {
          // Handle local/S3 file
          const result = await ApiService.downloadFromS3(file.file_id, file.name);
          if (result.success && result.url) {
            currentUrl = result.url;
            setImageUrl(result.url);
          } else {
            setError('Failed to load image content');
          }
        }
      } catch (_err) {
        setError('Failed to load image content');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function to revoke blob URL
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [file.file_id, file.name, file.path]);

  const handleDownload = async () => {
    if (!file.file_id) return;
    
    try {
      const isDriveFile = file.path?.startsWith('drive://');
      let url: string;
      
      if (isDriveFile) {
        const blob = await ApiService.Drive.getFileBlob(file.file_id);
        url = window.URL.createObjectURL(blob);
      } else {
        const result = await ApiService.downloadFromS3(file.file_id, file.name);
        if (!result.success || !result.url) return;
        url = result.url;
      }
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Clean up the blob URL after download
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (_err) {
      // swallow download error to avoid console output
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load image</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Header with file info and actions */}

      {/* Image display area */}
      <div className="flex-1 flex justify-center overflow-auto bg-white dark:bg-zinc-900 p-6">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={file.name}
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            unoptimized
          />
        ) : (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Image URL not available</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { Box, Typography, Card, CardMedia } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

// Image Viewer Component
interface ImageViewerProps {
  src: string;
  alt: string;
  fileName: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, fileName }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: theme.palette.background.default,
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CardMedia
          component="img"
          src={src}
          alt={alt}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `
              <div style="padding: 20px; text-align: center;">
                <p>Unable to load image: ${fileName}</p>
                <p style="color: #666; font-size: 0.875rem;">File may not exist or is not accessible</p>
              </div>
            `;
          }}
        />
      </Card>
    </Box>
  );
};

// PDF Viewer Component
interface PDFViewerProps {
  src: string;
  fileName: string;
  onError?: () => void;
  onLoad?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ src, fileName, onError, onLoad }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <iframe
        src={src}
        title={fileName}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        onLoad={onLoad}
        onError={onError}
      />
    </Box>
  );
};

// Spreadsheet Editor Component (simplified)
interface SpreadsheetEditorProps {
  src: string;
  fileName: string;
  onError?: () => void;
  onSave?: (filePath: string) => void;
}

export const SpreadsheetEditor = React.forwardRef<
  { save: () => Promise<void> },
  SpreadsheetEditorProps
>(({ src, fileName, onError, onSave }, ref) => {
  const theme = useTheme();

  // Expose save method through ref
  React.useImperativeHandle(ref, () => ({
    save: async () => {
      if (onSave) {
        onSave(src);
      }
    },
  }));

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Spreadsheet Viewer
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {fileName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Spreadsheet editing functionality would be implemented here.
          This could integrate with libraries like OnlyOffice, Luckysheet, or similar.
        </Typography>
      </Box>
    </Box>
  );
});

SpreadsheetEditor.displayName = 'SpreadsheetEditor';

import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  CreateNewFolder as CreateFolderIcon,
  NoteAdd as CreateFileIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Breadcrumbs,
  Link,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface FilesToolbarProps {
  filePath?: string;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onShare?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export default function FilesToolbar({
  filePath = '/',
  onBack,
  onForward,
  onRefresh,
  onCreateFile,
  onCreateFolder,
  onShare,
  canGoBack = false,
  canGoForward = false,
}: FilesToolbarProps) {
  const theme = useTheme();

  const pathSegments = filePath.split('/').filter(Boolean);

  const handleBreadcrumbClick = (index: number) => {
    const newPath = '/' + pathSegments.slice(0, index + 1).join('/');
    // In a real implementation, this would navigate to the path
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        backgroundColor: theme.palette.background.paper,
        borderBottom: 1,
        borderColor: 'divider',
        minHeight: 48,
      }}
    >
      {/* Navigation Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={onBack}
          disabled={!canGoBack}
          sx={{ p: 0.5 }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={onForward}
          disabled={!canGoForward}
          sx={{ p: 0.5 }}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={onRefresh}
          sx={{ p: 0.5 }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Path Breadcrumbs */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Breadcrumbs
          aria-label="file path"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              flexWrap: 'nowrap',
            },
          }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={() => handleBreadcrumbClick(-1)}
            sx={{
              color: theme.palette.text.primary,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Home
          </Link>
          {pathSegments.map((segment, index) => (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(index)}
              sx={{
                color: theme.palette.text.primary,
                textDecoration: 'none',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {segment}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          startIcon={<CreateFileIcon />}
          onClick={onCreateFile}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          New File
        </Button>
        <Button
          size="small"
          startIcon={<CreateFolderIcon />}
          onClick={onCreateFolder}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          New Folder
        </Button>
        <IconButton
          size="small"
          onClick={onShare}
          sx={{ p: 0.5 }}
        >
          <ShareIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

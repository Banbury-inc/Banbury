import {
  Folder as FolderIcon,
  ExpandLess,
  ExpandMore,
  InsertDriveFile as FileIcon,
  Cloud as CloudIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

interface FileData {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileData[];
}

interface WorkspaceSidebarProps {
  onFileClick?: (fileName: string, filePath: string, fileType: string) => void;
}

// Mock file structure for demonstration
const mockFileStructure: FileData[] = [
  {
    id: 'cloud',
    name: 'Cloud Storage',
    type: 'folder',
    path: '/cloud',
    children: [
      {
        id: 'doc1',
        name: 'Document 1.docx',
        type: 'file',
        path: '/cloud/document1.docx',
      },
      {
        id: 'doc2',
        name: 'Document 2.txt',
        type: 'file',
        path: '/cloud/document2.txt',
      },
      {
        id: 'img1',
        name: 'Image 1.png',
        type: 'file',
        path: '/cloud/image1.png',
      },
    ],
  },
  {
    id: 'local',
    name: 'Local Files',
    type: 'folder',
    path: '/local',
    children: [
      {
        id: 'folder1',
        name: 'Projects',
        type: 'folder',
        path: '/local/projects',
        children: [
          {
            id: 'project1',
            name: 'Project 1.md',
            type: 'file',
            path: '/local/projects/project1.md',
          },
        ],
      },
      {
        id: 'notes',
        name: 'Notes.txt',
        type: 'file',
        path: '/local/notes.txt',
      },
    ],
  },
];

const FileTreeItem: React.FC<{
  item: FileData;
  level: number;
  onFileClick?: (fileName: string, filePath: string, fileType: string) => void;
}> = ({ item, level, onFileClick }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleClick = () => {
    if (item.type === 'folder') {
      setOpen(!open);
    } else if (onFileClick) {
      // Determine file type based on extension
      const ext = item.name.split('.').pop()?.toLowerCase() || '';
      let fileType = 'Document';
      if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
        fileType = 'Image';
      } else if (['mp4', 'mov', 'avi'].includes(ext)) {
        fileType = 'Video';
      } else if (['mp3', 'wav'].includes(ext)) {
        fileType = 'Audio';
      } else if (['pdf'].includes(ext)) {
        fileType = 'PDF';
      }
      
      onFileClick(item.name, item.path, fileType);
    }
  };

  const getIcon = () => {
    if (item.type === 'folder') {
      if (item.name.includes('Cloud')) {
        return <CloudIcon fontSize="small" />;
      } else if (item.name.includes('Local')) {
        return <ComputerIcon fontSize="small" />;
      }
      return <FolderIcon fontSize="small" />;
    }
    return <FileIcon fontSize="small" />;
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          pl: 2 + level * 2,
          py: 0.5,
          minHeight: 32,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          {getIcon()}
        </ListItemIcon>
        <ListItemText
          primary={item.name}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            noWrap: true,
          }}
        />
        {item.type === 'folder' && (
          open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />
        )}
      </ListItemButton>
      {item.type === 'folder' && item.children && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => (
              <FileTreeItem
                key={child.id}
                item={child}
                level={level + 1}
                onFileClick={onFileClick}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default function WorkspaceSidebar({ onFileClick }: WorkspaceSidebarProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          File Explorer
        </Typography>
      </Box>
      <Divider />
      <List dense sx={{ pt: 1 }}>
        {mockFileStructure.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            level={0}
            onFileClick={onFileClick}
          />
        ))}
      </List>
    </Box>
  );
}

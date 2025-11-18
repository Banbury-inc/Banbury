import { Typography, TextField, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState, useEffect, useRef } from 'react';

interface RenameableTitleProps {
  title: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline' | 'inherit';
  isDocument?: boolean;
  onRename?: (newTitle: string) => void;
}

export default function RenameableTitle({
  title,
  variant = 'h6',
  isDocument = false,
  onRename
}: RenameableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && textFieldRef.current) {
      textFieldRef.current.focus();
      textFieldRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (isDocument && onRename) {
      setIsEditing(true);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSave();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setEditValue(title);
    }
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== title && onRename) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <TextField
          ref={textFieldRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
          variant="standard"
          size="small"
          sx={{
            flex: 1,
            '& .MuiInput-underline:before': {
              borderBottomColor: theme.palette.divider,
            },
            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
              borderBottomColor: theme.palette.primary.main,
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: theme.palette.primary.main,
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Typography
      variant={variant}
      sx={{
        flex: 1,
        paddingY: 1,
        paddingX: 1,
        cursor: isDocument && onRename ? 'pointer' : 'default',
        userSelect: 'none',
        '&:hover': isDocument && onRename ? {
          backgroundColor: theme.palette.action.hover,
          borderRadius: 1,
        } : {},
      }}
      onDoubleClick={handleDoubleClick}
      title={isDocument && onRename ? 'Double-click to rename' : undefined}
    >
      {title}
    </Typography>
  );
}

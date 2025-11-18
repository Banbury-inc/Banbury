import { Button, ButtonProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface ToolbarButtonProps extends Omit<ButtonProps, 'variant'> {
  children: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  children,
  variant = 'text',
  sx,
  ...props
}) => {
  const theme = useTheme();

  return (
    <Button
      variant={variant}
      size="small"
      sx={{
        minWidth: '32px',
        padding: '4px 8px',
        color: theme.palette.text.primary,
        fontSize: '0.75rem',
        textTransform: 'none',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

import React from 'react'
import { Plus, Minus } from 'lucide-react'
import { Box, IconButton, TextField } from '@mui/material'

interface FontSizeControlProps {
  fontSize: number
  handleFontSizeChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleFontSizeIncrement: () => void
  handleFontSizeDecrement: () => void
}

const iconButtonSx = {
  width: 24,
  height: 24,
  color: 'var(--muted-foreground)',
  border: '1px solid var(--border)',
  '&:hover': {
    backgroundColor: 'var(--accent)',
    color: 'var(--foreground)',
  },
}

export function FontSizeControl({ 
  fontSize, 
  handleFontSizeChange, 
  handleFontSizeIncrement, 
  handleFontSizeDecrement 
}: FontSizeControlProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        size="small"
        onClick={handleFontSizeDecrement}
        title="Decrease Font Size"
        sx={{
          ...iconButtonSx,
          borderRadius: '2px 0 0 2px',
          borderRight: 'none',
        }}
      >
        <Minus size={12} />
      </IconButton>
      <TextField
        value={fontSize}
        onChange={handleFontSizeChange}
        size="small"
        inputProps={{
          min: 6,
          max: 72,
          type: 'number',
          style: {
            textAlign: 'center',
            padding: '2px 4px',
            fontSize: '12px',
            width: '32px',
            height: '20px',
            border: 'none',
            outline: 'none',
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: '24px',
            border: '1px solid var(--border)',
            borderRadius: 0,
            backgroundColor: 'var(--background)',
            '& fieldset': {
              border: 'none',
            },
            '&:hover fieldset': {
              border: 'none',
            },
            '&.Mui-focused fieldset': {
              border: 'none',
            },
          },
          '& .MuiInputBase-input': {
            padding: 0,
            color: 'var(--foreground)',
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&[type=number]': {
              MozAppearance: 'textfield',
            },
          },
        }}
      />
      <IconButton
        size="small"
        onClick={handleFontSizeIncrement}
        title="Increase Font Size"
        sx={{
          ...iconButtonSx,
          borderRadius: '0 2px 2px 0',
          borderLeft: 'none',
        }}
      >
        <Plus size={12} />
      </IconButton>
    </Box>
  )
}

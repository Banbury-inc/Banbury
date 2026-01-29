import React from 'react'
import { Plus, Minus } from 'lucide-react'
import { Box, IconButton, TextField } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface FontSizeControlProps {
  fontSize: number
  handleFontSizeChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleFontSizeIncrement: () => void
  handleFontSizeDecrement: () => void
}

export function FontSizeControl({ 
  fontSize, 
  handleFontSizeChange, 
  handleFontSizeIncrement, 
  handleFontSizeDecrement 
}: FontSizeControlProps) {
  const theme = useTheme()
  const lightMode = theme.palette.mode === 'light'

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        size="small"
        onClick={handleFontSizeDecrement}
        title="Decrease Font Size"
        sx={{
          width: 24,
          height: 24,
          color: '#9ca3af',
          borderRadius: '2px 0 0 2px',
          border: '1px solid #3f3f46',
          borderRight: 'none',
          '&:hover': {
            backgroundColor: '#e2e8f0',
            color: '#475569',
          },
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
            border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46',
            borderRadius: 0,
            backgroundColor: lightMode ? 'white' : 'transparent',
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
            color: lightMode ? '#334155' : '#f3f4f6',
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
          width: 24,
          height: 24,
          color: '#9ca3af',
          borderRadius: '0 2px 2px 0',
          border: '1px solid #3f3f46',
          borderLeft: 'none',
          '&:hover': {
            backgroundColor: '#e2e8f0',
            color: '#475569',
          },
        }}
      >
        <Plus size={12} />
      </IconButton>
    </Box>
  )
}

import { Box, TextField, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

interface SimpleTipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
}

// Simple mock editor that simulates TipTap functionality
export default function SimpleTipTapEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  onEditorReady
}: SimpleTipTapEditorProps) {
  const [htmlContent, setHtmlContent] = useState(content);
  const theme = useTheme();

  useEffect(() => {
    setHtmlContent(content);
  }, [content]);

  useEffect(() => {
    // Simulate editor ready callback
    if (onEditorReady) {
      const mockEditor = {
        getHTML: () => htmlContent,
        getText: () => htmlContent.replace(/<[^>]*>/g, ''),
        commands: {
          setContent: (newContent: string) => {
            setHtmlContent(newContent);
            onChange(newContent);
          },
          insertContent: (insertContent: string) => {
            const newContent = htmlContent + insertContent;
            setHtmlContent(newContent);
            onChange(newContent);
          }
        },
        state: {
          doc: { content: { size: htmlContent.length } },
          selection: { from: 0, to: 0 }
        }
      };
      onEditorReady(mockEditor);
    }
  }, [htmlContent, onChange, onEditorReady]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = event.target.value;
    setHtmlContent(newContent);
    onChange(newContent);
  };

  const convertHtmlToText = (html: string): string => {
    // Simple HTML to text conversion
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  };

  const convertTextToHtml = (text: string): string => {
    // Simple text to HTML conversion
    return text
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
      .join('');
  };

  const displayValue = convertHtmlToText(htmlContent);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          padding: 2,
          backgroundColor: theme.palette.background.paper,
          border: 'none',
          borderRadius: 0,
        }}
      >
        <TextField
          multiline
          fullWidth
          variant="standard"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '14px',
              lineHeight: 1.6,
              '& .MuiInputBase-input': {
                padding: 0,
                minHeight: '100%',
              },
            },
          }}
          sx={{
            height: '100%',
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start',
            },
            '& .MuiInputBase-input': {
              height: '100% !important',
              overflow: 'auto !important',
            },
          }}
        />
      </Paper>
    </Box>
  );
}

import { Box, Typography, Button, Container } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        color: '#ffffff',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', md: '6rem' },
              fontWeight: 'bold',
              color: '#ffffff',
              mb: 2,
            }}
          >
            404
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 'medium',
              color: '#71717a',
              mb: 3,
            }}
          >
            Page Not Found
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: '#a1a1aa',
              mb: 4,
              maxWidth: '400px',
              mx: 'auto',
            }}
          >
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              component={NextLink}
              href="/"
              sx={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#2563eb',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Go Home
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => router.back()}
              sx={{
                borderColor: '#71717a',
                color: '#71717a',
                '&:hover': {
                  borderColor: '#a1a1aa',
                  backgroundColor: 'rgba(113, 113, 122, 0.1)',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

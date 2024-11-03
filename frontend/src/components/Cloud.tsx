
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, Card, CardMedia, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import mockup1 from '../assets/images/mockup1.png';
import mockup2 from '../assets/images/mockup2.png';
import mockup3 from '../assets/images/mockup3.png';

interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const Cloud = (): JSX.Element => {
  const theme = useTheme();
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [downloadText, setDownloadText] = useState<string>('Download');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    fetchProducts();
    determineOS();
  }, []);

  const fetchProducts = () => {
    axios.get<ProductsProps[]>('http://127.0.0.1:8000/products', {
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      setProducts(response.data);
    }).catch((error) => console.log(error));
  };

  const determineOS = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Win")) {
      setDownloadText("Download for Windows");
      setDownloadUrl("https://github.com/Banbury-inc/banbury-cloud-frontend/releases/download/v3.1.0/Banbury.Cloud.Setup.3.1.0.exe"); // Set the URL or path to your macOS-specific file
    } else if (userAgent.includes("Mac")) {
      setDownloadText("Download for macOS");
      setDownloadUrl("https://github.com/Banbury-inc/banbury-cloud-frontend/releases/download/v3.1.0/Banbury.Cloud-3.1.0-arm64.dmg"); // Set the URL or path to your macOS-specific file
    } else if (userAgent.includes("Linux")) {
      setDownloadText("Download for Linux");
      setDownloadUrl("https://github.com/Banbury-inc/banbury-cloud-frontend/releases/download/v3.1.0/BanburyCloud_3.1.0_amd64.deb"); // Set the URL or path to your Linux-specific file
    } else {
      setDownloadText("Download");
      setDownloadUrl("/path_to_generic_file"); // Generic file if OS is not detected
    }
  };

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div id='neuranet'>
      <Box
        sx={{
          paddingTop: 5,
          paddingBottom: 10,
          px: 2,
          backgroundColor: theme.palette.background.default,
          textAlign: 'center'
        }}
      >
        <Box
          marginBottom={4}
        >
          <Typography
            variant='h2'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            Banbury Cloud on your desktop
          </Typography>
          <Typography
            variant='subtitle1'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            color={theme.palette.text.secondary}
          >
            Seamlessly access your devices from anywhere in the world
          </Typography>
        </Box>

        <Button variant="contained" onClick={handleDownload}
          sx={{

            borderRadius: '20px',
          }}
        >
          {downloadText}
        </Button>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            margin: '0 auto',
            marginTop: 4,
            alignItems: 'center',
            height: '45vh',
            width: '60%',
            backgroundImage: `url(${mockup1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            textAlign: 'center',
            color: theme.palette.text.primary,
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
        </Box>

        <Container>
          <Grid container spacing={4}>
            {products.map((item, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Box
                  component={Card}
                  padding={4}
                  width={1}
                  height={1}
                  bgcolor={theme.palette.background.paper}
                  sx={{
                    '&:hover': {
                      bgcolor: theme.palette.background.default,
                      color: theme.palette.mode === 'dark'
                        ? theme.palette.common.white
                        : theme.palette.common.black,
                    },
                  }}
                >
                  <Box display='flex' flexDirection='column'>
                    <Typography
                      variant='h6'
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography color='inherit'>{item.description}</Typography>
                  </Box>
                  <Box display='block' width={1} height={1}>
                    <CardMedia
                      title=''
                      image={item.image}
                      sx={{
                        position: 'relative',
                        height: 320,
                        overflow: 'hidden',
                        borderRadius: 2,
                        filter: theme.palette.mode === 'dark'
                          ? 'brightness(0.7)'
                          : 'brightness(0.9)',
                        marginTop: 4,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </div>
  );
};

export default Cloud;

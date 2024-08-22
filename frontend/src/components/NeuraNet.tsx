import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, Card, CardMedia, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const NeuraNet = (): JSX.Element => {
  const theme = useTheme();
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [downloadText, setDownloadText] = useState<string>('Download');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [totalDataProcessed, setTotalDataProcessed] = useState<number | null>(null);
  const [totalNumberOfRequests, setTotalNumberOfRequests] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
    determineOS();
    fetchTotalDataProcessed();
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
      setDownloadUrl("https://github.com/Banbury-inc/NeuraNet/releases/download/v1.0.1/NeuraNet.1.0.1.msi");
    } else if (userAgent.includes("Mac")) {
      setDownloadText("Download for macOS");
      setDownloadUrl("https://github.com/Banbury-inc/NeuraNet/releases/download/v1.0.1/NeuraNet-1.0.1-arm64.dmg");
    } else if (userAgent.includes("Linux")) {
      setDownloadText("Download for Linux");
      setDownloadUrl("NeuraNet_1.0.1_amd64.deb");
    } else {
      setDownloadText("Download");
      setDownloadUrl("/path_to_generic_file");
    }
  };

  const fetchTotalDataProcessed = async () => {
    try {
      const response = await fetch('https://website2-v3xlkt54dq-ue.a.run.app/get_neuranet_info/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data) {
        setTotalDataProcessed(data.total_data_processed);
        setTotalNumberOfRequests(data.total_number_of_requests);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
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
        <Box marginBottom={4}>
          <Typography
            variant='h2'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            Welcome to NeuraNet: Decentralizing AI, One Device at a Time
          </Typography>
          <Typography
            variant='subtitle1'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            color={theme.palette.text.secondary}
          >
            NeuraNet isn't just a tool; it's a movement towards democratizing artificial intelligence.
          </Typography>
        </Box>

        {/* Centered Data Display */}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            marginTop: theme.spacing(10),
            marginBottom: theme.spacing(10),
          }}
        >
          <Typography
            variant='h4'
            align='center'
            gutterBottom
            color={theme.palette.text.secondary}
          >
            {totalDataProcessed !== null ? `Total Data Processed: ${totalDataProcessed} bytes` : ''}
          </Typography>
          <Typography
            variant='h4'
            align='center'
            gutterBottom
            color={theme.palette.text.secondary}
          >
            {totalNumberOfRequests !== null ? `Total Number of Requests: ${totalNumberOfRequests} bytes` : ''}
          </Typography>
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

export default NeuraNet;


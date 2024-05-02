
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, Card, CardMedia, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CardContent from '@mui/material/CardContent';


interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const News = (): JSX.Element => {
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
      setDownloadUrl("https://github.com/Banbury-inc/NeuraNet/releases/download/v1.0.1/NeuraNet.1.0.1.msi"); // Set the URL or path to your Windows-specific file
    } else if (userAgent.includes("Mac")) {
      setDownloadText("Download for macOS");
      setDownloadUrl("https://github.com/Banbury-inc/NeuraNet/releases/download/v1.0.1/NeuraNet-1.0.1-arm64.dmg"); // Set the URL or path to your macOS-specific file
    } else if (userAgent.includes("Linux")) {
      setDownloadText("Download for Linux");
      setDownloadUrl("NeuraNet_1.0.1_amd64.deb"); // Set the URL or path to your Linux-specific file
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
           News 
          </Typography>
          <Typography
            variant='subtitle1'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            color={theme.palette.text.secondary}
          >
          </Typography>

          <Container>
        <Box component="span" sx={{ display: 'inline-block', transform: 'scale(0.8)' }}>
         <Typography
            variant='h5'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{color: theme.palette.text.primary,}}>
           April 11, 2024 - v1.0.1 Desktop Application Released
          </Typography>
 
           <Typography
            variant='body1'
            align='left'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
            >
            After using the app in production for a little bit, and playing around with how the app
                worked in different devices, a lot of problems came to my attention. First of all, I 
                realized how difficult it is to run python code natively in a seamless manner. Basically there
                had to be some fancy way to ensure that a certain python interpreter was on the user's device.
                We could have used a venv, but there are complications with that as well, and I finally decided
                that it would be best to do a complete code refactor, changing all of the python code to typescript.
                This turned out to be a huge success! I am now able to download the app on any device and not have 
                to worry about any particular dependencies. Great.
            </Typography>
           <Typography
            variant='body1'
            align='left'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
            >
                I also did some testing of the app on different networks. I realized that port 8000 is not an open
                port on all networks. I did some research and realized that it would be best to switch to port 443. 
                This is a standard HTTP port that is open on most networks. This solved my problem when testing the app
                on a completely secure wifi network at a University. 
            </Typography>
            <Typography variant='body1' align='left' marginTop={theme.spacing(1)} gutterBottom sx={{color: theme.palette.text.primary,}}>
                I am definitely at a crossroads when thinking about what I want to do in the future. I think turning this
                app into a full fledged cloud computing platform could be really beneficial to people. For that reason,
                I think I am going to create some more features that will make cloud storage better. Things like implementing
                folders, search bar, sorting in the table that actually works. On the other hand, there are a lot of cool
                AI features that I have in mind, like implementing something called AI Agents. Not only that, but have these
                AI agents work on all of your online devices at the same time, and have them work together to help solve
                our problems. I think the best way to describe it would be to just implement it. Thanks for reading, stay tuned
                for more updates.
            </Typography>
 
            </Box>
          </Container>



          <Container>
        <Box component="span" sx={{ display: 'inline-block', transform: 'scale(0.8)' }}>
         <Typography
            variant='h5'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{color: theme.palette.text.primary,}}>
           April 11, 2024 - v1.0.0 Beta Desktop Application Released
          </Typography>
 
           <Typography
            variant='body1'
            align='left'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
            >
            Recently, I have been working hard to release a desktop application, that will serve
            as a prototype to the overall idea. So far everything has been going smoothly, despite a few bugs. 
            A lot of work has gone into the actual user interface, playing around with styling. Additionally,
            there was a lot of work just setting up the app, like configuring everything for deployment. Figuring
            out an app icon. Lots of stuff turned out to work in dev but not a production environment, which took
                several days to fix. Hope you like it.
            </Typography>
            </Box>
          </Container>

          <Container>
        <Box component="span" sx={{ display: 'inline-block', transform: 'scale(0.8)' }}>
         <Typography
            variant='h5'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{color: theme.palette.text.primary,}}>
           February 3, 2024 - Banbury Cloud Beta CLI 1.0.1 Released
          </Typography>
 
           <Typography
            variant='body1'
            align='left'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
            >

Recently, we have made a slight change in what we have been doing in terms of the file sharing. 
Initially, we had an idea that IPFS would really be the backbone of the decentralized file sharing. 
We came across a lot of complications, especially when it came to port forwarding.
In other words, it was really easy to upload files from IPFS and download them again, but only within your own network.
Ultimately, we decided to drop the idea of IPFS, for now. Instead, we have decided to implement something called a relay server. 
In other words, this provides a way for us to access files on another device, even if that device is on another network.
This is a really exciting new direction for us. 
            </Typography>
           <Typography variant='body1' align='left' marginTop={theme.spacing(1)} gutterBottom sx={{color: theme.palette.text.primary,}}>
In recent developments, we have been working on a desktop application that would be running all of the logic necessary
in order to bring the device online. This can't really happen with a web app, and we apps are not able to access things 
like the files on your computer, especially in the way that we want. Our next announcement will hopefully be the release 
of the desktop app. We are also working hard to make the desktop app open source.
            </Typography>
            </Box>
          </Container>

          <Container>
        <Box component="span" sx={{ display: 'inline-block', transform: 'scale(0.8)' }}>
         <Typography
            variant='h5'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{color: theme.palette.text.primary,}}>
           February 3, 2024 - Banbury Cloud Beta CLI Tool Released
          </Typography>
 
           <Typography
            variant='body1'
            align='left'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
            >
            There are some exciting new advancements in the realm of Banbury!
            We have recently released the very first Beta version of 
            bcloud. bcloud is a CLI tool for Banbury Cloud. 
            This acts as a prototype for what will eventually be Banbury Cloud.
            </Typography>
            </Box>
          </Container>



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

export default News;

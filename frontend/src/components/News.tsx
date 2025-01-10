
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
                sx={{ color: theme.palette.text.primary, }}>
                January 10, 2025 - v3.3.0 Released
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
                Today, we were able to release a new version of Banbury Cloud. This release is only a few days after our last release, which is exciting.
                This release is focused around friends, and being able to share files with friends. We added a new Friends section, where users can search
                for, add, remove, and manage friends. We also added a new feature that allows users to share files with friends. You can either select the
                file in the users tab and share directly with a an existing user, or you can copy a link to the file, and share that link with anyone,
                regardless of whether they have an account or not.
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
                We also added Google OAuth, so that users can login to their Google account. We are exciting about this, and hope that in the future we can
                add additional OAuth providers. Not only that, but we are hoping to be able to connect Google Drive to Banbury Cloud. This would allow users to
                sync their Google Drive files to Banbury Cloud, and vice versa.
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
                We are excited about this release, and hope that you are too. We are working hard to make Banbury Cloud the best cloud storage
                platform out there. We are always looking for feedback, so please let us know what you think. Next up, we will be working on notifications,
                and overall feedback for the user when navigating the app. We understand that it is not always clear whether a button actually did anything.
                This is exactly what we will be working on next. Stay tuned!
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
                sx={{ color: theme.palette.text.primary, }}>
                January 4, 2025 - v3.2.0 Released
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
                Happy New Year everyone. A lot of work has been done in this most recent update, which is primarily focused on AI features.
                We have added a feature called Cloud Sync. This is the backbone of this entire application. This feature allows
                users to sync their files across all of their devices. You have the ability to select which files are synced, and how you
                would like them to be synced.
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
                The way that this is done is by collecting information about the device, such as the current wifi speed, in increments of
                30 minutues. We then take this data and use AI to predict what these values might be in the future. By being able to predict
                what these values might be in the future, we can make an intelligent decision about where certain files should be stored.
                For example, if you turn off your work computer at 5pm every day, we can eventually predict this pattern, and move
                files from your work computer to your computer at home, so that you can access them there. This is just one example out of many.
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
                We understand that many of you would like to use this software to work with friends and colleagues. The good news is that
                this is what we will be working on next. Features like sharing files with friends, allowing friends to access certain files
                on your computer. All of this, including OAuth, is what will be coming in our next update. Stay tuned!
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
                sx={{ color: theme.palette.text.primary, }}>
                November 3, 2024 - v3.1.0 Released
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
                For this update, we added a new devices section. In this section, you can manage your connected devices.
                You can add and delete devices. This page also provides a lot of data about each device that may be helpful.
                Another cool feature is that we added the ability for users to select which folders they want scanned.
                We have also implemented automatic updates. Finally, we have added a little message for users when they
                don't have any files or devices added. Enjoy!
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
                sx={{ color: theme.palette.text.primary, }}>
                October 19, 2024 - v3.0.0 Released
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
                This is a major update to the Banbury Cloud desktop application. In this version, stability and performance was a big focus point.
                We decided that we were trying to build too many features at once, which meant that there were a lot of bugs and issues. We took
                the time to minimize the amount of bugs and make the app much more stable. One way in which we did this was by once again refactoring
                the backend. What was once written in Rust, we now transitioned back to python. We did this mainly because we wanted to combine the
                backend and relay server into the same container. By keeping everything in django and python, it made everything much easier to keep servers
                running. We took the time to make sure that the app is compatile with all platforms. We understoof that a lot of macos users were having issues
                with the previous version, due to the fact that the app wasn't properly signed. We fixed it this version, so users will no longer have issues
                with the app not running on macos devices. In future versions, I think it will be time to build out features again. We are going to add a device
                dashboard, where users can view all of their connected devices and manage them. We now have a really solid foundation to build on top of, and
                are really excited to see what the future holds.
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
                sx={{ color: theme.palette.text.primary, }}>
                August 20, 2024 - Rust Code Refactor, v2.0.0 Released, UI Improvements
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
                All I have to say is wow. What a summer. I have definitely been busy at work.
                Unfortunately, I have not been able to devote as much time as I would like to
                this project, as I have had a number of other things going on. However, I've
                still been able to get a bunch of things accomplished.
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
                First of all, as this project has grown in size, I have decided to split the
                project into two separate repositories. The first repository is the desktop
                application, which is now called Banbury Cloud. The second repository is the
                relay server, which is called NeuraNet. Beginning with Banbury Cloud, I did
                a lot of work on the UI. It is much more elegant looking, with much less
                wasted space. I have implemented a lot of new features, like
                folders, sorting in the table, being able to have a file open when you click
                on the file name, file tree navigation on the left hand side, and many other
                features. As far as NeuraNet, I did a complete code refactor, so it is now
                written in Rust. The difference in speed is noticeable. On top of that,
                I feel like both repositories have definitely grown in size, so I spent a
                significant amount of time just organizing the code, ensuring separation of
                concerns, etc.
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
                I have a lot of plans for the future. I have just finished a bunch of other
                obligations and projects, so I will have the ability to work on this much
                more consistently in the future. Right now, users are only able to view files
                in one directory, and I would like to change that. One of the next features
                that I am planning on implementing is a sync feature. I want this app to scan
                the user's entire computer as opposed to just one directory. Additionally, I
                am going to begin working on wake-on-lan as well. Of course, there are a good
                amount of bugs and edge cases, such as viewing/opening a file that is not on
                your local computer. Also, things like confirming that the file has actually
                been deleted, or that a file as successfully been uploaded. Finally, I am
                starting to think it is about time to throw together an iphone app... Anyway,
                thanks for reading and I can't wait to see what the future holds.
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
                sx={{ color: theme.palette.text.primary, }}>
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
              <Typography variant='body1' align='left' marginTop={theme.spacing(1)} gutterBottom sx={{ color: theme.palette.text.primary, }}>
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
                sx={{ color: theme.palette.text.primary, }}>
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
                sx={{ color: theme.palette.text.primary, }}>
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
              <Typography variant='body1' align='left' marginTop={theme.spacing(1)} gutterBottom sx={{ color: theme.palette.text.primary, }}>
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
                sx={{ color: theme.palette.text.primary, }}>
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

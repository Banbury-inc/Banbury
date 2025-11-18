import { Box, Card, CardMedia, Container, Grid, Typography, Paper } from '@mui/material';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import NewsPost, { NewsPost as NewsPostType } from './NewsPost';

interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const NEWS_POSTS: NewsPostType[] = [
  {
    id: 'v3-5-2',
    date: 'June 9, 2025',
    title: 'v3.5.2 Released',
    content: [
      "We are excited to v3.5.2. We have done a lot of work with various AI features. We have added a new mcp server that AI models can connect to. We have only added a few tools, but we plan on significantly expanding this in the future.",
      "Next up, we are going to be working on integrations. We find an incredibly value in mcp servers, and we want to be able to connect to as many of them as possible. You will find many integrations with google products like Gmail, Google Drive, etc. Like always, Thanks for reading!"
    ]
  },
  {
    id: 'v3-5-0',
    date: 'April 21, 2025',
    title: 'v3.5.0 Released',
    content: [
      "Happy Easter everyone. We are announcing a new release, v3.5.0. This release is focused around a new AI tab. This gives the user the ability to select various large language models that they can download and run locally. We are excited to begin exploring different features with AI and see what others find useful. We are going to begin a lot of work around this page and see what people get excited about.",
      "In addition, we are starting to place a lot of emphasis on testing, and making sure that everything runs smoothly in the app. We are making note of bugs we find, and we are going to be working on fixing them. Our next update will be primarily around bug fixes and stability, so the app can be overall more reliable for you. Thank you, and we look forward to our next update."

    ]
  },
  {
    id: 'v3-4-23',
    date: 'March 20, 2025',
    title: 'v3.4.23 Released',
    content: [
      "It's been a while since we have had a release. This is mostly due to the fact that I have had to move to a new city... again... Anyway, Even though I have been busy moving, I have a lot of great features that I have been working on. One of which is tabs. Users can now open multiple tabs in the app and manage multiple different sessions at once. I am hoping people will like this for workflow management purposes.",
      "Also, we have been working on a new feature related to large language models. You will notice that there is a new tab called \"AI\". This is where you can download and use large language models locally. You will see a lot of improvements with this in the future.",
      "Next up, not only will you see improvements with the AI page, but we are also getting ready to release an API as well as a CLI tool. We want to slowly get to a point where you can use LLM's downloaded on other computers and devices. Stay tuned!"
    ]
  },
  {
    id: 'v3-3-5',
    date: 'January 12, 2025',
    title: 'v3.3.5 Released',
    content: [
      "We were able to have another quick release. We realized that before we got into a lot of the notification features, we needed to make some major improvements with the way that the servers were communicating with the app. You will notice that things like your devices showing as online or offline are now much more accurate. Also, we have added the ability to determine whether a user is online or offline. Additionally, things like sending a friend request to someone will occur in real time, without having to refresh the page. This is a big step towards being able to send notifications to users."
    ]
  },
  {
    id: 'v3-3-0',
    date: 'January 10, 2025',
    title: 'v3.3.0 Released',
    content: [
      "Today, we were able to release a new version of Banbury Cloud. This release is only a few days after our last release, which is exciting. This release is focused around friends, and being able to share files with friends. We added a new Friends section, where users can search for, add, remove, and manage friends. We also added a new feature that allows users to share files with friends. You can either select the file in the users tab and share directly with a an existing user, or you can copy a link to the file, and share that link with anyone, regardless of whether they have an account or not.",
      "We also added Google OAuth, so that users can login to their Google account. We are exciting about this, and hope that in the future we can add additional OAuth providers. Not only that, but we are hoping to be able to connect Google Drive to Banbury Cloud. This would allow users to sync their Google Drive files to Banbury Cloud, and vice versa.",
      "We are excited about this release, and hope that you are too. We are working hard to make Banbury Cloud the best cloud storage platform out there. We are always looking for feedback, so please let us know what you think. Next up, we will be working on notifications, and overall feedback for the user when navigating the app. We understand that it is not always clear whether a button actually did anything. This is exactly what we will be working on next. Stay tuned!"
    ]
  },
  {
    id: 'v3-2-0',
    date: 'January 4, 2025',
    title: 'v3.2.0 Released',
    content: [
      "Happy New Year everyone. A lot of work has been done in this most recent update, which is primarily focused on AI features. We have added a feature called Cloud Sync. This is the backbone of this entire application. This feature allows users to sync their files across all of their devices. You have the ability to select which files are synced, and how you would like them to be synced.",
      "The way that this is done is by collecting information about the device, such as the current wifi speed, in increments of 30 minutues. We then take this data and use AI to predict what these values might be in the future. By being able to predict what these values might be in the future, we can make an intelligent decision about where certain files should be stored. For example, if you turn off your work computer at 5pm every day, we can eventually predict this pattern, and move files from your work computer to your computer at home, so that you can access them there. This is just one example out of many.",
      "We understand that many of you would like to use this software to work with friends and colleagues. The good news is that this is what we will be working on next. Features like sharing files with friends, allowing friends to access certain files on your computer. All of this, including OAuth, is what will be coming in our next update. Stay tuned!"
    ]
  },
  {
    id: 'v3-1-0',
    date: 'November 3, 2024',
    title: 'v3.1.0 Released',
    content: [
      "For this update, we added a new devices section. In this section, you can manage your connected devices. You can add and delete devices. This page also provides a lot of data about each device that may be helpful. Another cool feature is that we added the ability for users to select which folders they want scanned. We have also implemented automatic updates. Finally, we have added a little message for users when they don't have any files or devices added. Enjoy!"
    ]
  },
  {
    id: 'v3-0-0',
    date: 'October 19, 2024',
    title: 'v3.0.0 Released',
    content: [
      "This is a major update to the Banbury Cloud desktop application. In this version, stability and performance was a big focus point. We decided that we were trying to build too many features at once, which meant that there were a lot of bugs and issues. We took the time to minimize the amount of bugs and make the app much more stable. One way in which we did this was by once again refactoring the backend. What was once written in Rust, we now transitioned back to python. We did this mainly because we wanted to combine the backend and relay server into the same container. By keeping everything in django and python, it made everything much easier to keep servers running. We took the time to make sure that the app is compatile with all platforms. We understoof that a lot of macos users were having issues with the previous version, due to the fact that the app wasn't properly signed. We fixed it this version, so users will no longer have issues with the app not running on macos devices. In future versions, I think it will be time to build out features again. We are going to add a device dashboard, where users can view all of their connected devices and manage them. We now have a really solid foundation to build on top of, and are really excited to see what the future holds."
    ]
  },
  {
    id: 'v2-0-0',
    date: 'August 20, 2024',
    title: 'Rust Code Refactor, v2.0.0 Released, UI Improvements',
    content: [
      "All I have to say is wow. What a summer. I have definitely been busy at work. Unfortunately, I have not been able to devote as much time as I would like to this project, as I have had a number of other things going on. However, I've still been able to get a bunch of things accomplished.",
      "First of all, as this project has grown in size, I have decided to split the project into two separate repositories. The first repository is the desktop application, which is now called Banbury Cloud. The second repository is the relay server, which is called NeuraNet. Beginning with Banbury Cloud, I did a lot of work on the UI. It is much more elegant looking, with much less wasted space. I have implemented a lot of new features, like folders, sorting in the table, being able to have a file open when you click on the file name, file tree navigation on the left hand side, and many other features. As far as NeuraNet, I did a complete code refactor, so it is now written in Rust. The difference in speed is noticeable. On top of that, I feel like both repositories have definitely grown in size, so I spent a significant amount of time just organizing the code, ensuring separation of concerns, etc.",
      "I have a lot of plans for the future. I have just finished a bunch of other obligations and projects, so I will have the ability to work on this much more consistently in the future. Right now, users are only able to view files in one directory, and I would like to change that. One of the next features that I am planning on implementing is a sync feature. I want this app to scan the user's entire computer as opposed to just one directory. Additionally, I am going to begin working on wake-on-lan as well. Of course, there are a good amount of bugs and edge cases, such as viewing/opening a file that is not on your local computer. Also, things like confirming that the file has actually been deleted, or that a file as successfully been uploaded. Finally, I am starting to think it is about time to throw together an iphone app... Anyway, thanks for reading and I can't wait to see what the future holds."
    ]
  },
  {
    id: 'v1-0-1',
    date: 'April 11, 2024',
    title: 'v1.0.1 Desktop Application Released',
    content: [
      "After using the app in production for a little bit, and playing around with how the app worked in different devices, a lot of problems came to my attention. First of all, I realized how difficult it is to run python code natively in a seamless manner. Basically there had to be some fancy way to ensure that a certain python interpreter was on the user's device. We could have used a venv, but there are complications with that as well, and I finally decided that it would be best to do a complete code refactor, changing all of the python code to typescript. This turned out to be a huge success! I am now able to download the app on any device and not have to worry about any particular dependencies. Great.",
      "I also did some testing of the app on different networks. I realized that port 8000 is not an open port on all networks. I did some research and realized that it would be best to switch to port 443. This is a standard HTTP port that is open on most networks. This solved my problem when testing the app on a completely secure wifi network at a University.",
      "I am definitely at a crossroads when thinking about what I want to do in the future. I think turning this app into a full fledged cloud computing platform could be really beneficial to people. For that reason, I think I am going to create some more features that will make cloud storage better. Things like implementing folders, search bar, sorting in the table that actually works. On the other hand, there are a lot of cool AI features that I have in mind, like implementing something called AI Agents. Not only that, but have these AI agents work on all of your online devices at the same time, and have them work together to help solve our problems. I think the best way to describe it would be to just implement it. Thanks for reading, stay tuned for more updates."
    ]
  },
  {
    id: 'v1-0-0-beta',
    date: 'April 11, 2024',
    title: 'v1.0.0 Beta Desktop Application Released',
    content: [
      "Recently, I have been working hard to release a desktop application, that will serve as a prototype to the overall idea. So far everything has been going smoothly, despite a few bugs. A lot of work has gone into the actual user interface, playing around with styling. Additionally, there was a lot of work just setting up the app, like configuring everything for deployment. Figuring out an app icon. Lots of stuff turned out to work in dev but not a production environment, which took several days to fix. Hope you like it."
    ]
  },
  {
    id: 'v1-0-1-cli',
    date: 'February 3, 2024',
    title: 'Banbury Cloud Beta CLI 1.0.1 Released',
    content: [
      "Recently, we have made a slight change in what we have been doing in terms of the file sharing. Initially, we had an idea that IPFS would really be the backbone of the decentralized file sharing. We came across a lot of complications, especially when it came to port forwarding. In other words, it was really easy to upload files from IPFS and download them again, but only within your own network. Ultimately, we decided to drop the idea of IPFS, for now. Instead, we have decided to implement something called a relay server. In other words, this provides a way for us to access files on another device, even if that device is on another network. This is a really exciting new direction for us.",
      "In recent developments, we have been working on a desktop application that would be running all of the logic necessary in order to bring the device online. This can't really happen with a web app, and we apps are not able to access things like the files on your computer, especially in the way that we want. Our next announcement will hopefully be the release of the desktop app. We are also working hard to make the desktop app open source."
    ]
  },
  {
    id: 'v1-0-0-cli',
    date: 'February 3, 2024',
    title: 'Banbury Cloud Beta CLI Tool Released',
    content: [
      "There are some exciting new advancements in the realm of Banbury! We have recently released the very first Beta version of bcloud. bcloud is a CLI tool for Banbury Cloud. This acts as a prototype for what will eventually be Banbury Cloud."
    ]
  }
];

const News = (): JSX.Element => {
  const router = useRouter();
  const { postId } = router.query as { postId?: string };
  const [products, setProducts] = useState<ProductsProps[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios.get<ProductsProps[]>('http://127.0.0.1:8000/products', {
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      setProducts(response.data);
    }).catch((error) => {
      // Handle error silently
    });
  };


  const selectedPost = postId ? NEWS_POSTS.find(post => post.id === postId) : null;
  const latestPost = NEWS_POSTS[0]; // Most recent post
  const otherPosts = NEWS_POSTS.slice(1); // All other posts

  const FeaturedPost = ({ post }: { post: NewsPostType }) => (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        background: 'rgba(255,255,255,0.02)',
        color: '#ffffff',
        mb: 8,
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(255, 255, 255, 0.05)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        },
      }}
      onClick={() => router.push(`/news/${post.id}`)}
    >
      <Box
        sx={{
          position: 'relative',
          p: { xs: 4, md: 8 },
          zIndex: 2,
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            mb: 4,
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {post.title}
        </Typography>
        <Typography
          sx={{
            fontSize: '1.1rem',
            mb: 4,
            color: '#a1a1aa',
            fontWeight: 400,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {post.date} • 5 min read
        </Typography>
        <Typography
          sx={{
            maxWidth: '800px',
            lineHeight: 1.6,
            color: '#a1a1aa',
            fontSize: { xs: '1rem', md: '1.1rem' },
            fontWeight: 400,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {typeof post.content === 'string' ? post.content : post.content[0]}
        </Typography>
      </Box>
    </Paper>
  );

  const PostCard = ({ post }: { post: NewsPostType }) => (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(255, 255, 255, 0.05)',
          '& .post-title': {
            color: '#3b82f6',
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        },
      }}
      onClick={() => router.push(`/news/${post.id}`)}
    >
      <Box sx={{ p: 6 }}>
        <Typography
          className="post-title"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: '#ffffff',
            fontSize: '1.25rem',
            letterSpacing: '-0.01em',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'color 0.3s ease',
          }}
        >
          {post.title}
        </Typography>
        <Typography
          sx={{
            mb: 3,
            color: '#a1a1aa',
            fontSize: '0.95rem',
            fontWeight: 400,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {post.date} • 3 min read
        </Typography>
        <Typography
          sx={{
            color: '#a1a1aa',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6,
            fontSize: '0.95rem',
            fontWeight: 400,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {typeof post.content === 'string' ? post.content : post.content[0]}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ overflow: 'visible', background: '#000000' }}>
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: { xs: 2, sm: 4, md: 8 },
          background: '#000000',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.4,
            zIndex: 0,
          },
        }}
      >
        {selectedPost ? (
          <>
            <Box sx={{ mb: 4 }}>
              <NextLink href="/news" style={{ textDecoration: 'none' }}>
                <Typography
                  sx={{ 
                    color: '#3b82f6',
                    fontSize: '1rem',
                    fontWeight: 500,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '&:hover': {
                      color: '#60a5fa',
                    },
                  }}
                >
                  ← Back to News
                </Typography>
              </NextLink>
            </Box>
            <NewsPost post={selectedPost} />
          </>
        ) : (
          <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 0 } }}>
            <FeaturedPost post={latestPost} />

            <Grid container spacing={4}>
              {otherPosts.map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  <PostCard post={post} />
                </Grid>
              ))}
            </Grid>
          </Container>
        )}

        <Container sx={{ mt: 8 }}>
          <Grid container spacing={4}>
            {products.map((item, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Box
                  component={Card}
                  sx={{
                    p: 6,
                    height: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    },
                  }}
                >
                  <Box display='flex' flexDirection='column'>
                    <Typography
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography 
                      sx={{
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {item.description}
                    </Typography>
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
                        filter: 'brightness(0.7)',
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
    </Box>
  );
};

export default News;

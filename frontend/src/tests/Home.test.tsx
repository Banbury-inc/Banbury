import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Home from '../pages/Home';

const theme = createTheme();

const renderApp = () => {
  render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    </ThemeProvider>
  );

  return { user: userEvent.setup() };
};

describe('Home page', () => {
  it('should render the elements on the Home page', async () => {
    renderApp();

    expect(
      await screen.findByText(/Any Device, Anywhere/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Tap in to your devices unused resources/i)
    ).toBeVisible();
    expect(
      await screen.findByText(/Cloud Sync/i)
    ).toBeVisible();
    expect(
      await screen.findByText(/Multi-Device Access/i)
    ).toBeVisible();
    expect(
      await screen.findByText(/Secure Access/i)
    ).toBeVisible();
  });
});

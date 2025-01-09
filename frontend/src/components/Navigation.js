import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show navigation on non-home pages
  if (location.pathname === '/') {
    return null;
  }

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Button
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          color="inherit"
        >
          Home
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 
import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function Navigation() {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
          >
            Create Form
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/upload"
          >
            Upload CSV
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 
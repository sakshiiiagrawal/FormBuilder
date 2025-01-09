import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

function Navigation() {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Form Builder
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 
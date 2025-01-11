import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

function Navigation() {
  const navigate = useNavigate();

  return (
    <AppBar 
      position="static" 
      sx={{ 
        mb: 4,
        background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
        boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)'
      }}
    >
      <Toolbar>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9
            }
          }}
          onClick={() => navigate('/')}
        >
          <IconButton 
            color="inherit" 
            sx={{ 
              mr: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <AssignmentIcon sx={{ fontSize: 32 }} />
          </IconButton>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: 1,
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Form Builder
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 
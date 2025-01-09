import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function FormUpload() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Upload CSV
        </Typography>
        <Typography>
          CSV upload functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
}

export default FormUpload; 
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Stack, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Add as AddIcon, 
  Upload as UploadIcon,
  Edit as EditIcon,
  Visibility as ViewIcon 
} from '@mui/icons-material';

function Home() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formId, setFormId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleViewClick = () => {
    setViewDialogOpen(true);
  };

  const handleViewSubmit = () => {
    if (!formId.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    localStorage.setItem(`form_password_${formId}`, password);
    navigate(`/responses/${formId}`);
    setViewDialogOpen(false);
    setFormId('');
    setPassword('');
    setError('');
  };

  return (
    <Box 
      sx={{ 
        height: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #f8f9fa, #e9ecef)'
      }}
    >
      <Paper 
        elevation={3}
        sx={{ 
          p: 5, 
          borderRadius: 2,
          background: 'white',
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Stack spacing={4} alignItems="center">
          <Typography 
            variant="h3" 
            gutterBottom
            sx={{ 
              color: 'primary.main',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            Form Builder
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            fullWidth
            sx={{ 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            Create New Form
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<ViewIcon />}
            onClick={handleViewClick}
            fullWidth
            sx={{ 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            View Responses
          </Button>
        </Stack>
      </Paper>

      {/* Create Form Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>Choose Creation Method</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                setCreateDialogOpen(false);
                navigate('/create');
              }}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Create Manually
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => {
                setCreateDialogOpen(false);
                navigate('/upload');
              }}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Upload Template
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* View Responses Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => {
          setViewDialogOpen(false);
          setError('');
          setFormId('');
          setPassword('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>View Form Responses</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Form ID"
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleViewSubmit} 
            variant="contained"
            fullWidth
            sx={{ py: 1.5 }}
          >
            View Responses
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Home; 
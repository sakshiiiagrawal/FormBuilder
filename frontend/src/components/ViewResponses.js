import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

function ViewResponses() {
  const { uuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlPassword = params.get('password');
    
    if (urlPassword) {
      fetchResponses(urlPassword);
    } else {
      setShowPasswordDialog(true);
      setLoading(false);
    }
  }, [location.search]);

  const fetchResponses = async (pwd) => {
    setLoading(true);
    try {
      const formResponse = await axios.get(`http://localhost:8000/form/${uuid}`);
      setForm(formResponse.data);
      
      const responsesResponse = await axios.get(
        `http://localhost:8000/view-responses/${uuid}`,
        { params: { password: pwd } }
      );
      setResponses(responsesResponse.data);
      setShowPasswordDialog(false);
      // Update URL with password if it's not already there
      if (!location.search) {
        navigate(`/responses/${uuid}?password=${pwd}`, { replace: true });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Invalid password');
        setShowPasswordDialog(true);
      } else {
        setError(error.response?.data?.detail || 'Error loading responses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    fetchResponses(password);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !showPasswordDialog) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (showPasswordDialog) {
    return (
      <Dialog 
        open={showPasswordDialog} 
        onClose={() => navigate('/')}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>Enter Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handlePasswordSubmit} 
            variant="contained"
            fullWidth
            sx={{ py: 1.5 }}
          >
            View Responses
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!form || !responses.length) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom align="center">
            No responses yet
          </Typography>
        </Paper>
      </Box>
    );
  }

  const fields = Object.keys(form.fields);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          align="center"
          sx={{ 
            color: 'primary.main',
            fontWeight: 'bold',
            mb: 3
          }}
        >
          {form.title} - Responses
        </Typography>
        
        <TableContainer component={Paper} elevation={2} sx={{ mt: 3 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Response #</TableCell>
                {fields.map((field) => (
                  <TableCell key={field} sx={{ color: 'white', fontWeight: 'bold' }}>
                    {field}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.map((response, index) => (
                <TableRow 
                  key={response.id}
                  sx={{ 
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  {fields.map((field) => (
                    <TableCell key={field}>
                      {Array.isArray(response.response_data[field]) ? (
                        <Stack direction="row" spacing={1}>
                          {response.response_data[field].map((value) => (
                            <Chip 
                              key={value} 
                              label={value} 
                              size="small"
                              sx={{ bgcolor: 'primary.light', color: 'white' }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        response.response_data[field]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default ViewResponses; 
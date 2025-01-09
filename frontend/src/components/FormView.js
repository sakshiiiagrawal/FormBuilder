import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  Select,
  FormControl,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import axios from 'axios';
import SuccessDialog from './SuccessDialog';

function FormView() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/form/${uuid}`);
        setForm(response.data);
        // Initialize responses object with first option for dropdowns
        const initialResponses = {};
        Object.entries(response.data.fields).forEach(([fieldName, options]) => {
          if (options) {
            initialResponses[fieldName] = options[0]; // Default to first option for dropdowns
          } else {
            initialResponses[fieldName] = '';
          }
        });
        setResponses(initialResponses);
      } catch (error) {
        setError(error.response?.data?.detail || 'Error loading form');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [uuid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:8000/submit-form/${uuid}`, {
        response_data: responses
      });
      setSuccessDialogOpen(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error submitting form');
    }
  };

  const handleChange = (fieldName, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleCloseDialog = () => {
    setSuccessDialogOpen(false);
    navigate('/');
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">Loading form...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error">Form not found</Alert>
      </Box>
    );
  }

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 4,
            background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
          }}
        >
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
            {form.title}
          </Typography>
          <Divider sx={{ my: 3 }} />

          <Stack spacing={4}>
            {Object.entries(form.fields).map(([fieldName, options]) => (
              <Card 
                key={fieldName} 
                elevation={1}
                sx={{ 
                  '&:hover': { 
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: 'primary.main',
                          mb: 2
                        }}
                      >
                        {fieldName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth variant="outlined">
                        {options ? (
                          <Select
                            value={responses[fieldName]}
                            onChange={(e) => handleChange(fieldName, e.target.value)}
                            sx={{ 
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'background.paper' }
                            }}
                          >
                            {options.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                        ) : (
                          <TextField
                            value={responses[fieldName]}
                            onChange={(e) => handleChange(fieldName, e.target.value)}
                            fullWidth
                            variant="outlined"
                            placeholder="Your answer"
                            sx={{ 
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'background.paper' }
                            }}
                          />
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              endIcon={<SendIcon />}
              sx={{ 
                mt: 4,
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
              Submit Response
            </Button>
          </Stack>
        </Paper>
      </Box>

      <SuccessDialog
        open={successDialogOpen}
        onClose={handleCloseDialog}
        title="Response Submitted Successfully!"
        message="Thank you for submitting your response. You can share this form with others using the link below."
        link={window.location.href}
      />
    </>
  );
}

export default FormView; 
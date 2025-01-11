import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl, API_ENDPOINTS } from '../config';
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
  IconButton,
} from '@mui/material';
import { Send as SendIcon, CameraAlt, PhotoLibrary, LocationOn } from '@mui/icons-material';
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
  const [imageCapture, setImageCapture] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({});
  const [imageData, setImageData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await axios.get(getApiUrl(API_ENDPOINTS.GET_FORM(uuid)));
        setForm(response.data);
        // Initialize responses object with first option for dropdowns
        const initialResponses = {};
        Object.entries(response.data.fields).forEach(([fieldName, options]) => {
          if (options === 'image') {
            initialResponses[fieldName] = null;
          } else if (Array.isArray(options)) {
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
      await axios.post(getApiUrl(API_ENDPOINTS.SUBMIT_FORM(uuid)), {
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

  const handleSubmitAnother = () => {
    setSuccessDialogOpen(false);
    // Reset form responses
    const initialResponses = {};
    Object.entries(form.fields).forEach(([fieldName, options]) => {
      if (options === 'image') {
        initialResponses[fieldName] = null;
      } else if (Array.isArray(options)) {
        initialResponses[fieldName] = options[0];
      } else {
        initialResponses[fieldName] = '';
      }
    });
    setResponses(initialResponses);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please try again or use image upload.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const captureImage = async (fieldName, source) => {
    try {
      let imageFile;
      if (source === 'camera') {
        setShowCamera(true);
        await startCamera();
        return;
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        imageFile = await new Promise(resolve => {
          input.onchange = e => resolve(e.target.files[0]);
          input.click();
        });
        await processImage(fieldName, imageFile);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image. Please try again.');
    }
  };

  const handleCameraCapture = async (fieldName) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      
      const blob = await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.5);
      });
      
      await processImage(fieldName, blob);
      stopCamera();
    } catch (error) {
      console.error('Error capturing from camera:', error);
      setError('Failed to capture image. Please try again.');
    }
  };

  const processImage = async (fieldName, imageFile) => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = {
          base64: reader.result,
          timestamp: new Date().toISOString(),
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        };
        handleChange(fieldName, JSON.stringify(imageData));
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image. Please try again.');
    }
  };

  const renderField = (fieldName, options) => {
    if (options === 'image') {
      const imageData = responses[fieldName] ? JSON.parse(responses[fieldName]) : null;
      return (
        <Box>
          {imageData ? (
            <Box>
              <img 
                src={imageData.base64} 
                alt="Captured" 
                style={{ maxWidth: '100%', maxHeight: '200px' }} 
              />
              <Typography variant="caption" display="block">
                Taken at: {new Date(imageData.timestamp).toLocaleString()}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="text"
                  size="small"
                  href={`https://www.google.com/maps?q=${imageData.location.latitude},${imageData.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<LocationOn />}
                  sx={{ textTransform: 'none' }}
                >
                  Open Location in Maps
                </Button>
              </Box>
            </Box>
          ) : showCamera ? (
            <Box sx={{ 
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleCameraCapture(fieldName)}
                  startIcon={<CameraAlt />}
                >
                  Capture
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={stopCamera}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          ) : (
            <Stack direction="column" spacing={2} alignItems="center">
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Choose an option to add an image:
              </Typography>
              <Stack direction="row" spacing={3} justifyContent="center">
                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  onClick={() => captureImage(fieldName, 'camera')}
                  sx={{ 
                    minWidth: '150px',
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  Take Photo
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PhotoLibrary />}
                  onClick={() => captureImage(fieldName, 'gallery')}
                  sx={{ 
                    minWidth: '150px',
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  Upload Image
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      );
    }
    
    return options ? (
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
    );
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
                        {renderField(fieldName, options)}
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
        onSubmitAnother={handleSubmitAnother}
        title="Response Submitted Successfully!"
        message="Thank you for submitting your response."
      />
    </>
  );
}

export default FormView; 
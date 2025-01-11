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
  InputLabel,
  OutlinedInput,
  Chip,
  Slider,
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
        // Initialize responses object with empty values
        const initialResponses = {};
        Object.entries(response.data.fields).forEach(([fieldName, fieldConfig]) => {
          if (fieldConfig.type === 'image') {
            initialResponses[fieldName] = null;
          } else if (fieldConfig.type === 'dropdown' || fieldConfig.type === 'multiselect') {
            initialResponses[fieldName] = {
              value: fieldConfig.options[0] || '',
              subResponses: {}
            };
          } else {
            initialResponses[fieldName] = {
              value: '',
              subResponses: null
            };
          }
        });
        setResponses(initialResponses);
      } catch (error) {
        const errorMessage = error.response?.data?.detail || 
                           (error.response?.data?.msg ? JSON.stringify(error.response.data.msg) : 'Error loading form');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [uuid]);

  const handleChange = (fieldName, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldName]: typeof value === 'object' ? value : { value: value, subResponses: null }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const missingRequiredFields = [];
    Object.entries(form.fields).forEach(([fieldName, fieldConfig]) => {
      const isRequired = fieldConfig.required || false;
      if (isRequired) {
        const response = responses[fieldName];
        if (!response || !response.value || response.value.length === 0) {
          missingRequiredFields.push(fieldName);
        }
        
        // Check sub-questions if they exist and are required
        if (fieldConfig.subQuestions && response?.value) {
          const subQuestions = fieldConfig.subQuestions[response.value] || [];
          subQuestions.forEach(subQuestion => {
            if (subQuestion.required) {
              const subResponse = response.subResponses?.[subQuestion.name];
              if (!subResponse || (Array.isArray(subResponse) ? subResponse.length === 0 : !subResponse)) {
                missingRequiredFields.push(`${fieldName} > ${subQuestion.name}`);
              }
            }
          });
        }
      }
    });

    if (missingRequiredFields.length > 0) {
      setError(`Please fill in all required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }

    try {
      // Format response data according to the schema
      const formattedResponses = Object.entries(responses).reduce((acc, [key, value]) => {
        if (form.fields[key] === 'image') {
          acc[key] = { value: value, subResponses: null };
        } else {
          acc[key] = typeof value === 'object' ? value : { value: value, subResponses: null };
        }
        return acc;
      }, {});

      await axios.post(getApiUrl(API_ENDPOINTS.SUBMIT_FORM(uuid)), {
        response_data: formattedResponses
      });
      setSuccessDialogOpen(true);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         (error.response?.data?.msg ? JSON.stringify(error.response.data.msg) : 'Error submitting form');
      setError(errorMessage);
    }
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
      // Check if it's a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      const constraints = {
        video: isMobile ? { facingMode: 'environment' } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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

  const renderField = (fieldName, fieldConfig) => {
    // Add required indicator to field labels
    const isRequired = fieldConfig.required || false;
    const fieldLabel = isRequired ? `${fieldName} *` : fieldName;

    // Check if fieldConfig is an object with options property
    if (fieldConfig && typeof fieldConfig === 'object' && Array.isArray(fieldConfig.options)) {
      const mainField = (
        <FormControl fullWidth required={isRequired}>
          <InputLabel>{fieldLabel}</InputLabel>
          <Select
            value={responses[fieldName]?.value || ''}
            onChange={(e) => handleChange(fieldName, {
              value: e.target.value,
              subResponses: responses[fieldName]?.subResponses || {}
            })}
            input={<OutlinedInput label={fieldLabel} />}
            error={isRequired && (!responses[fieldName]?.value || responses[fieldName]?.value.length === 0)}
          >
            {fieldConfig.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

      // If there are sub-questions for the selected option
      const selectedOption = responses[fieldName]?.value;
      const subQuestions = fieldConfig.subQuestions?.[selectedOption] || [];

      return (
        <Stack spacing={2}>
          {mainField}
          {subQuestions.length > 0 && (
            <Box sx={{ ml: 4, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
              {subQuestions.map((subQuestion, index) => {
                const isSubRequired = subQuestion.required || false;
                const subLabel = isSubRequired ? `${subQuestion.name} *` : subQuestion.name;
                
                return (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {subLabel}
                    </Typography>
                    {subQuestion.type === 'text' ? (
                      <TextField
                        fullWidth
                        required={isSubRequired}
                        value={responses[fieldName]?.subResponses?.[subQuestion.name] || ''}
                        onChange={(e) => {
                          const newSubResponses = {
                            ...(responses[fieldName]?.subResponses || {}),
                            [subQuestion.name]: e.target.value
                          };
                          handleChange(fieldName, {
                            value: responses[fieldName]?.value,
                            subResponses: newSubResponses
                          });
                        }}
                        error={isSubRequired && !responses[fieldName]?.subResponses?.[subQuestion.name]}
                      />
                    ) : subQuestion.type === 'dropdown' ? (
                      <FormControl fullWidth required={isSubRequired}>
                        <Select
                          value={responses[fieldName]?.subResponses?.[subQuestion.name] || ''}
                          onChange={(e) => {
                            const newSubResponses = {
                              ...(responses[fieldName]?.subResponses || {}),
                              [subQuestion.name]: e.target.value
                            };
                            handleChange(fieldName, {
                              value: responses[fieldName]?.value,
                              subResponses: newSubResponses
                            });
                          }}
                          error={isSubRequired && !responses[fieldName]?.subResponses?.[subQuestion.name]}
                        >
                          {(subQuestion.options || []).map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : subQuestion.type === 'multiselect' ? (
                      <FormControl fullWidth required={isSubRequired}>
                        <Select
                          multiple
                          value={responses[fieldName]?.subResponses?.[subQuestion.name] || []}
                          onChange={(e) => {
                            const newSubResponses = {
                              ...(responses[fieldName]?.subResponses || {}),
                              [subQuestion.name]: e.target.value
                            };
                            handleChange(fieldName, {
                              value: responses[fieldName]?.value,
                              subResponses: newSubResponses
                            });
                          }}
                          error={isSubRequired && (!responses[fieldName]?.subResponses?.[subQuestion.name] || responses[fieldName]?.subResponses?.[subQuestion.name].length === 0)}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {(subQuestion.options || []).map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          )}
        </Stack>
      );
    }

    if (fieldConfig === 'image') {
      const imageData = responses[fieldName] ? JSON.parse(responses[fieldName]) : null;
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom color={isRequired ? 'error' : 'inherit'}>
            {fieldLabel}
          </Typography>
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

    switch (fieldConfig.type) {
      case 'slider':
        const steps = fieldConfig.sliderConfig?.steps || ['1', '2', '3', '4', '5'];
        const marks = steps.map((step, index) => ({
          value: index,
          label: step
        }));
        
        const currentValue = responses[fieldName]?.value 
          ? steps.indexOf(responses[fieldName].value)
          : steps.indexOf(fieldConfig.sliderConfig?.defaultValue || steps[0]);

        return (
          <Box sx={{ px: 2, py: 3 }}>
            <Slider
              value={currentValue}
              onChange={(_, newValue) => handleChange(fieldName, steps[newValue])}
              min={0}
              max={steps.length - 1}
              step={1}
              marks={marks}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => steps[value]}
              sx={{
                '& .MuiSlider-markLabel': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiSlider-thumb': {
                  height: 24,
                  width: 24,
                  backgroundColor: '#fff',
                  border: '2px solid currentColor',
                  '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                    boxShadow: 'inherit',
                  },
                },
                '& .MuiSlider-valueLabel': {
                  lineHeight: 1.2,
                  fontSize: 12,
                  background: 'unset',
                  padding: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50% 50% 50% 0',
                  backgroundColor: 'primary.main',
                  transformOrigin: 'bottom left',
                  transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
                  '&:before': { display: 'none' },
                  '&.MuiSlider-valueLabelOpen': {
                    transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
                  },
                  '& > *': {
                    transform: 'rotate(45deg)',
                  },
                },
              }}
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mt: 1, textAlign: 'center' }}
            >
              Selected: {responses[fieldName]?.value || fieldConfig.sliderConfig?.defaultValue || steps[0]}
            </Typography>
          </Box>
        );
      
      default:
        return null;
    }
  };

  const validateForm = () => {
    if (!form || !form.fields) return false;

    for (const [fieldName, fieldConfig] of Object.entries(form.fields)) {
      // Check if the field is required
      if (fieldConfig.required === true) {
        const response = responses[fieldName];
        
        // Check if the main field has a value
        if (!response?.value || response.value.length === 0) {
          return false;
        }

        // If this field has sub-questions for the selected option
        if (fieldConfig.subQuestions && response.value) {
          const subQuestions = fieldConfig.subQuestions[response.value] || [];
          
          // If there are sub-questions, ensure ALL of them are answered
          if (subQuestions.length > 0) {
            // Check if subResponses exists and has entries for all sub-questions
            if (!response.subResponses) return false;
            
            // Check each sub-question is answered, regardless of required status
            for (const subQuestion of subQuestions) {
              const subResponse = response.subResponses[subQuestion.name];
              
              // Handle different types of sub-responses
              if (!subResponse || 
                  (Array.isArray(subResponse) && subResponse.length === 0) || 
                  (typeof subResponse === 'string' && subResponse.trim() === '')) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
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
            {Object.entries(form.fields).map(([fieldName, fieldConfig]) => (
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
                        {renderField(fieldName, fieldConfig)}
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
              disabled={!validateForm()}
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
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)'
                }
              }}
            >
              Submit Responsee
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
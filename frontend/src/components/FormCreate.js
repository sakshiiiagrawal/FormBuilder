import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper,
  Stack,
  IconButton,
  MenuItem,
  Grid,
  Chip,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SuccessDialog from './SuccessDialog';
import { getApiUrl, API_ENDPOINTS } from '../config';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'dropdown', label: 'Single Select Dropdown' },
  { value: 'multiselect', label: 'Multi Select Dropdown' },
  { value: 'image', label: 'Image Input' }
];

// Helper function to get default expiry date (24 hours from now)
const getDefaultExpiry = () => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date.toISOString().slice(0, 16); // Format for datetime-local input
};

function FormCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{ name: '', type: 'text', options: [] }]);
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState(getDefaultExpiry());
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [currentOption, setCurrentOption] = useState('');

  const handleAddField = () => {
    setFields([...fields, { name: '', type: 'text', options: [], isImage: false }]);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, field) => {
    const newFields = [...fields];
    newFields[index] = { 
      ...newFields[index], 
      ...field,
      options: field.type === 'image' ? [] : newFields[index].options 
    };
    setFields(newFields);
  };

  const handleAddOption = (index) => {
    if (currentOption.trim()) {
      const newFields = [...fields];
      newFields[index] = {
        ...newFields[index],
        options: [...newFields[index].options, currentOption.trim()]
      };
      setFields(newFields);
      setCurrentOption('');
    }
  };

  const handleRemoveOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFields(newFields);
  };

  const handleKeyPress = (e, index) => {
    if (e.key === 'Enter' && currentOption.trim()) {
      e.preventDefault();
      handleAddOption(index);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        title,
        fields: fields.reduce((acc, field) => {
          if (field.type === 'text') {
            acc[field.name] = null;
          } else if (field.type === 'image') {
            acc[field.name] = 'image';
          } else {
            acc[field.name] = field.options;
          }
          return acc;
        }, {}),
        password: password,
        expiry: new Date(expiry).toISOString()
      };

      const response = await axios.post(getApiUrl(API_ENDPOINTS.CREATE_FORM), formData);
      const formUrl = `${window.location.origin}/form/${response.data.uuid}`;
      setFormLink(formUrl);
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const handleCloseDialog = () => {
    setSuccessDialogOpen(false);
    navigate('/');
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Create New Form
          </Typography>

          <Stack spacing={3}>
            <TextField
              label="Form Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />

            {fields.map((field, index) => (
              <Box key={index} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Field Name"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      label="Field Type"
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, { type: e.target.value })}
                      required
                      fullWidth
                    >
                      {FIELD_TYPES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={10} sm={3}>
                    {(field.type === 'dropdown' || field.type === 'multiselect') ? (
                      <Box>
                        <TextField
                          label="Add Option"
                          value={currentOption}
                          onChange={(e) => setCurrentOption(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          fullWidth
                          placeholder="Type and press Enter"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton 
                                  onClick={() => handleAddOption(index)}
                                  size="small"
                                  disabled={!currentOption.trim()}
                                >
                                  <AddIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {field.options.map((option, optionIndex) => (
                            <Chip
                              key={optionIndex}
                              label={option}
                              onDelete={() => handleRemoveOption(index, optionIndex)}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Box>
                        {field.options.length === 0 && (
                          <Typography variant="caption" color="error">
                            At least one option is required
                          </Typography>
                        )}
                      </Box>
                    ) : field.type === 'image' ? (
                      <Typography variant="body2" color="textSecondary">
                        Image upload will be enabled in the form
                      </Typography>
                    ) : null}
                  </Grid>
                  <Grid item xs={2} sm={1}>
                    <IconButton 
                      onClick={() => handleRemoveField(index)}
                      disabled={fields.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddField}
              variant="outlined"
            >
              Add Field
            </Button>

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              helperText="Password is required for viewing responses"
            />

            <TextField
              label="Expiry Date"
              type="datetime-local"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
              helperText="Form will expire after this time"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!title || !password || fields.some(f => !f.name || ((f.type === 'dropdown' || f.type === 'multiselect') && f.options.length === 0))}
            >
              Create Form
            </Button>
          </Stack>
        </Paper>
      </Box>

      <SuccessDialog
        open={successDialogOpen}
        onClose={handleCloseDialog}
        title="Form Created Successfully!"
        message="Your form has been created. Share the link below with others to collect responses."
        link={formLink}
        showShare={true}
      />
    </>
  );
}

export default FormCreate; 
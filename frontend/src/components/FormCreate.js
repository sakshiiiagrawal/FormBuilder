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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Select,
  OutlinedInput,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon, AddCircleOutline as AddCircleOutlineIcon } from '@mui/icons-material';
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

const getDefaultExpiry = () => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date.toISOString().slice(0, 16);
};

function SubQuestionDialog({ open, onClose, onSave, parentOption }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState([]);
  const [currentOption, setCurrentOption] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleAddOption = () => {
    if (currentOption.trim()) {
      setOptions([...options, currentOption.trim()]);
      setCurrentOption('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentOption.trim()) {
      e.preventDefault();
      handleAddOption();
    }
  };

  const handleSave = () => {
    onSave({
      name,
      type,
      options: type === 'dropdown' || type === 'multiselect' ? options : []
    });
    setName('');
    setType('text');
    setOptions([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Sub-question for "{parentOption}"
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Question Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            select
            label="Question Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            fullWidth
          >
            {FIELD_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {(type === 'dropdown' || type === 'multiselect') && (
            <Box>
              <TextField
                label="Add Option"
                value={currentOption}
                onChange={(e) => setCurrentOption(e.target.value)}
                onKeyPress={handleKeyPress}
                fullWidth
                placeholder="Type and press Enter"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={handleAddOption}
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
                {options.map((option, index) => (
                  <Chip
                    key={index}
                    label={option}
                    onDelete={() => setOptions(options.filter((_, i) => i !== index))}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
              {options.length === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  At least one option is required
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          disabled={!name.trim() || ((['dropdown', 'multiselect'].includes(type)) && !options.length)} 
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FormCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{ 
    name: '', 
    type: 'text', 
    options: [], 
    subQuestions: {}
  }]);
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState(getDefaultExpiry());
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [currentOption, setCurrentOption] = useState('');
  const [subQuestionDialog, setSubQuestionDialog] = useState({
    open: false,
    fieldIndex: null,
    option: null
  });

  const handleAddField = () => {
    const newField = {
      name: '',
      type: 'text',
      options: [],
      required: false
    };
    setFields([...fields, newField]);
  };

  const handleFieldChange = (index, field, value) => {
    const updatedFields = [...fields];
    if (field === 'type') {
      updatedFields[index] = {
        ...updatedFields[index],
        [field]: value,
        options: value === 'dropdown' || value === 'multiselect' ? [] : undefined
      };
    } else {
      updatedFields[index] = {
        ...updatedFields[index],
        [field]: value
      };
    }
    setFields(updatedFields);
  };

  const handleRemoveField = (index) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const handleAddOption = (index) => {
    if (currentOption.trim()) {
      const newFields = [...fields];
      const option = currentOption.trim();
      newFields[index] = {
        ...newFields[index],
        options: [...newFields[index].options, option],
        subQuestions: {
          ...newFields[index].subQuestions,
          [option]: []
        }
      };
      setFields(newFields);
      setCurrentOption('');
    }
  };

  const handleRemoveOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    const removedOption = newFields[fieldIndex].options[optionIndex];
    newFields[fieldIndex].options = newFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    delete newFields[fieldIndex].subQuestions[removedOption];
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
            acc[field.name] = {
              type: 'text',
              required: field.required || false
            };
          } else if (field.type === 'image') {
            acc[field.name] = {
              type: 'image',
              required: field.required || false
            };
          } else {
            // For dropdown and multiselect
            acc[field.name] = {
              type: field.type,
              options: field.options,
              required: field.required || false,
              subQuestions: field.subQuestions || {}
            };
          }
          return acc;
        }, {}),
        password: password || null,
        expiry: new Date(expiry).toISOString()
      };

      const response = await axios.post(getApiUrl(API_ENDPOINTS.CREATE_FORM), formData);
      setFormLink(`${window.location.origin}/form/${response.data.uuid}`);
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('Error creating form:', error);
    }
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
                <Grid container spacing={2} key={index}>
                  <Grid item sm={4}>
                    <TextField
                      fullWidth
                      label="Field Name"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        label="Type"
                      >
                        {FIELD_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item sm={4}>
                    {(field.type === 'dropdown' || field.type === 'multiselect') && (
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
                            <Box 
                              key={optionIndex} 
                              sx={{ 
                                width: '100%',
                                mb: 1
                              }}
                            >
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                }}
                              >
                                <Chip
                                  label={option}
                                  onDelete={() => handleRemoveOption(index, optionIndex)}
                                  color="primary"
                                  variant="outlined"
                                />
                                <Tooltip title="Add sub-question" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setSubQuestionDialog({
                                      open: true,
                                      fieldIndex: index,
                                      option
                                    })}
                                  >
                                    <AddCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                              {field.subQuestions[option]?.length > 0 && (
                                <Box sx={{ ml: 4, mt: 1 }}>
                                  {field.subQuestions[option].map((subQuestion, subQuestionIndex) => (
                                    <Box 
                                      key={subQuestionIndex} 
                                      sx={{ 
                                        p: 1, 
                                        mb: 1, 
                                        borderLeft: '2px solid #e0e0e0',
                                        position: 'relative'
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        sx={{ 
                                          position: 'absolute',
                                          right: 0,
                                          top: 0,
                                          padding: '2px',
                                          '&:hover': { 
                                            color: 'error.main',
                                            backgroundColor: 'error.lighter'
                                          }
                                        }}
                                        onClick={() => {
                                          const newFields = [...fields];
                                          newFields[index].subQuestions[option] = newFields[index].subQuestions[option].filter(
                                            (_, i) => i !== subQuestionIndex
                                          );
                                          setFields(newFields);
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                                        Sub-question: {subQuestion.name}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                                        Type: {FIELD_TYPES.find(t => t.value === subQuestion.type)?.label}
                                      </Typography>
                                      {(subQuestion.type === 'dropdown' || subQuestion.type === 'multiselect') && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {subQuestion.options.map((subOpt, subOptIndex) => (
                                            <Chip
                                              key={subOptIndex}
                                              label={subOpt}
                                              size="small"
                                              variant="outlined"
                                              sx={{ fontSize: '0.75rem' }}
                                            />
                                          ))}
                                        </Box>
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                        {field.options.length === 0 && (
                          <Typography variant="caption" color="error">
                            At least one option is required
                          </Typography>
                        )}
                      </Box>
                    )}
                    {field.type === 'image' && (
                      <Typography variant="body2" color="textSecondary">
                        Image upload will be enabled in the form
                      </Typography>
                    )}
                  </Grid>
                  <Grid item sm={1}>
                    <IconButton
                      onClick={() => handleRemoveField(index)}
                      sx={{
                        color: 'grey.500',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: 'error.lighter',
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item sm={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.required || false}
                          onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Required field"
                    />
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
              disabled={
                !title || 
                !password || 
                fields.some(f => 
                  !f.name || 
                  ((f.type === 'dropdown' || f.type === 'multiselect') && 
                    f.options.length === 0
                  )
                )
              }
            >
              Create Form
            </Button>
          </Stack>
        </Paper>
      </Box>

      <SubQuestionDialog
        open={subQuestionDialog.open}
        onClose={() => setSubQuestionDialog({ open: false, fieldIndex: null, option: null })}
        onSave={(subQuestion) => {
          const newFields = [...fields];
          const currentSubQuestions = newFields[subQuestionDialog.fieldIndex].subQuestions[subQuestionDialog.option] || [];
          newFields[subQuestionDialog.fieldIndex].subQuestions[subQuestionDialog.option] = [
            ...currentSubQuestions,
            subQuestion
          ];
          setFields(newFields);
        }}
        parentOption={subQuestionDialog.option}
      />

      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          navigate('/');
        }}
        title="Form Created Successfully!"
        message="Your form has been created. Share the link below with others to collect responses."
        link={formLink}
        showShare={true}
      />
    </>
  );
}

export default FormCreate; 
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

// Helper function to format dates consistently
const formatDate = (dateString) => {
  if (!dateString) return '';
  return dateString; // Already formatted as YYYY-MM-DD from API
};

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const uploadImageToServer = async (base64Image) => {
  try {
    const uploadApiUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API || '/api/upload-image';
    const response = await fetch(uploadApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Image upload failed: HTTP ${response.status}`);
    }
    const data = JSON.parse(text);
    if (!data.image_url) {
      throw new Error('No image URL returned from server');
    }
    const fullPath = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH || ''}/${data.image_url}`;
    if (!/^https?:\/\/.+/.test(fullPath)) {
      throw new Error('Invalid image URL returned from server');
    }
    return fullPath;
  } catch (error) {
    throw error;
  }
};

export default function DonorManagementPage() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'add', 'edit', 'delete'
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    address: '',
    imageUrl: '',
    status: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch donors on mount
  useEffect(() => {
    fetchDonors();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = donors.filter((donor) => {
      const matchesName = donor.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesEmail = donor.email.toLowerCase().includes(filterEmail.toLowerCase());
      const matchesCity = donor.city ? donor.city.toLowerCase().includes(filterCity.toLowerCase()) : true;
      const matchesStatus = filterStatus !== '' ? donor.status === (filterStatus === 'true') : true;
      return matchesName && matchesEmail && matchesCity && matchesStatus;
    });
    setFilteredDonors(filtered);
  }, [donors, filterName, filterEmail, filterCity, filterStatus]);

  const fetchDonors = async () => {
    try {
      const response = await fetch('/api/donor');
      const data = await response.json();
      console.log('API Response:', data); // Debug log to inspect response
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch donors`);
      }
      if (!Array.isArray(data)) {
        console.error('Unexpected response format:', data);
        throw new Error('Expected donors data to be an array');
      }
      setDonors(data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load donors: ${err.message}`);
      setDonors([]); // Fallback to empty array
      setLoading(false);
      console.error('Fetch error:', err);
    }
  };

  const handleModalOpen = (mode, donor = null) => {
    setModalMode(mode);
    setSelectedDonor(donor);
    if (mode === 'view' || mode === 'edit') {
      setFormData({
        name: donor?.name || '',
        email: donor?.email || '',
        password: '',
        phone: donor?.phone || '',
        city: donor?.city || '',
        address: donor?.address || '',
        imageUrl: donor?.imageUrl || '',
        status: donor?.status !== undefined ? donor.status : true,
      });
      setImagePreview(donor?.imageUrl || '');
    } else if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        address: '',
        imageUrl: '',
        status: true,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDonor(null);
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setImageFile(file);
        const base64 = await convertToBase64(file);
        setImagePreview(base64);
        setFormData({ ...formData, imageUrl: '' });
      } catch (error) {
        setError('Failed to process image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, phone, city, address, status } = formData;
    if (modalMode === 'add' || modalMode === 'edit') {
      if (!name || !email || (modalMode === 'add' && !password)) {
        setError('Name, email, and password (for new donors) are required');
        return;
      }
    }

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const base64Image = await convertToBase64(imageFile);
        imageUrl = await uploadImageToServer(base64Image);
      }

      let response;
      if (modalMode === 'add') {
        const payload = {
          name,
          email,
          password, // Should be hashed in production
          phone: phone || null,
          city: city || null,
          address: address || null,
          imageUrl: imageUrl || null,
          status,
        };
        response = await fetch('/api/donor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedDonor) {
        const payload = {
          name,
          email,
          phone: phone || null,
          city: city || null,
          address: address || null,
          imageUrl: imageUrl || selectedDonor.imageUrl || null,
          status,
        };
        response = await fetch(`/api/donor/${selectedDonor.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedDonor) {
        response = await fetch(`/api/donor/${selectedDonor.id}`, {
          method: 'DELETE',
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchDonors();
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  // Filter handlers
  const handleFilterNameChange = (e) => {
    setFilterName(e.target.value);
  };

  const handleFilterEmailChange = (e) => {
    setFilterEmail(e.target.value);
  };

  const handleFilterCityChange = (e) => {
    setFilterCity(e.target.value);
  };

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#FFF', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
          Donor Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleModalOpen('add')}
          sx={{ borderRadius: '20px', textTransform: 'none', boxShadow: '0 4px 10px rgba(0, 128, 0, 0.2)' }}
        >
          Add Donor
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Filter by Name"
          value={filterName}
          onChange={handleFilterNameChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Filter by Email"
          value={filterEmail}
          onChange={handleFilterEmailChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Filter by City"
          value={filterCity}
          onChange={handleFilterCityChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={handleFilterStatusChange}
            label="Filter by Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchDonors}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredDonors.length === 0 ? (
        <Typography>No donors found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '0px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#302E56' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>City</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Address</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDonors.map((donor) => (
                <TableRow key={donor.id} sx={{ '&:hover': { bgcolor: '#f0f0f0' } }}>
                  <TableCell>{donor.name}</TableCell>
                  <TableCell>{donor.email}</TableCell>
                  <TableCell>{donor.phone || 'N/A'}</TableCell>
                  <TableCell>{donor.city || 'N/A'}</TableCell>
                  <TableCell>{donor.address || 'N/A'}</TableCell>
                  <TableCell>
                    {donor.imageUrl ? (
                      <img
                        src={donor.imageUrl}
                        alt={donor.name}
                        style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      'No image'
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: donor.status ? '#e6f4ea' : '#fdeded',
                        color: donor.status ? '#2e7d32' : '#d32f2f',
                      }}
                    >
                      {donor.status ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(donor.created_at)}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton color="primary" onClick={() => handleModalOpen('view', donor)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleModalOpen('edit', donor)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleModalOpen('delete', donor)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a3c34', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {modalMode === 'add' ? 'Add Donor' : modalMode === 'edit' ? 'Edit Donor' : modalMode === 'view' ? 'View Donor' : 'Delete Donor'}
          <IconButton onClick={handleModalClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {modalMode !== 'delete' ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                disabled={modalMode === 'view'}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                disabled={modalMode === 'view'}
              />
              {modalMode === 'add' && (
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                />
              )}
              <TextField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                disabled={modalMode === 'view'}
              />
              <TextField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                disabled={modalMode === 'view'}
              />
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
                disabled={modalMode === 'view'}
              />
              {modalMode !== 'view' && (
                <TextField
                  type="file"
                  label="Donor Image"
                  InputLabelProps={{ shrink: true }}
                  name="image"
                  onChange={handleImageChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ accept: 'image/*' }}
                />
              )}
              {(imagePreview || formData.imageUrl) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Image Preview:
                  </Typography>
                  <img
                    src={imagePreview || formData.imageUrl}
                    alt="Donor preview"
                    style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </Box>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    color="success"
                    disabled={modalMode === 'view'}
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Box>
          ) : (
            <Typography>
              Are you sure you want to delete donor <strong>{selectedDonor?.name}</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} color="inherit">
            Cancel
          </Button>
          {modalMode === 'view' ? null : modalMode !== 'delete' ? (
            <Button
              type="submit"
              variant="contained"
              color="success"
              onClick={handleSubmit}
              sx={{ borderRadius: '20px', textTransform: 'none' }}
            >
              {modalMode === 'add' ? 'Add' : 'Update'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmit}
              sx={{ borderRadius: '20px', textTransform: 'none' }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
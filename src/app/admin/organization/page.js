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
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to format dates consistently
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0]; // Convert to YYYY-MM-DD
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

export default function OrganizationManagementPage() {
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'add', 'edit', 'delete'
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    address: '',
    website: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    ghlId: '',
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
  const [filterState, setFilterState] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = organizations.filter((org) => {
      const matchesName = org.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesEmail = org.email.toLowerCase().includes(filterEmail.toLowerCase());
      const matchesCity = org.city ? org.city.toLowerCase().includes(filterCity.toLowerCase()) : true;
      const matchesState = org.state ? org.state.toLowerCase().includes(filterState.toLowerCase()) : true;
      const matchesCountry = org.country ? org.country.toLowerCase().includes(filterCountry.toLowerCase()) : true;
      const matchesStatus = filterStatus !== '' ? org.status === (filterStatus === 'true') : true;
      return matchesName && matchesEmail && matchesCity && matchesState && matchesCountry && matchesStatus;
    });
    setFilteredOrganizations(filtered);
  }, [organizations, filterName, filterEmail, filterCity, filterState, filterCountry, filterStatus]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organization'); // Adjust to '/api/organization' if needed
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch organizations`);
      }
      if (!Array.isArray(data.organizations)) {
        console.error('Unexpected response format:', data);
        throw new Error('Expected organizations data to be an array');
      }
      setOrganizations(data.organizations);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load organizations: ${err.message}`);
      setOrganizations([]);
      setLoading(false);
      console.error('Fetch error:', err);
    }
  };

  const handleModalOpen = (mode, org = null) => {
    setModalMode(mode);
    setSelectedOrganization(org);
    if (mode === 'view' || mode === 'edit') {
      setFormData({
        name: org?.name || '',
        email: org?.email || '',
        password: '',
        phone: org?.phone || '',
        company: org?.company || '',
        address: org?.address || '',
        website: org?.website || '',
        city: org?.city || '',
        state: org?.state || '',
        country: org?.country || '',
        postalCode: org?.postalCode || '',
        ghlId: org?.ghlId || '',
        imageUrl: org?.imageUrl || '',
        status: org?.status !== undefined ? org.status : true,
      });
      setImagePreview(org?.imageUrl || '');
    } else if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        company: '',
        address: '',
        website: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        ghlId: '',
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
    setSelectedOrganization(null);
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

    const { name, email, password, phone, company, address, website, city, state, country, postalCode, ghlId, status } = formData;
    if (modalMode === 'add' || modalMode === 'edit') {
      if (!name || !email || (modalMode === 'add' && !password)) {
        setError('Name, email, and password (for new organizations) are required');
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
          company: company || null,
          address: address || null,
          website: website || null,
          city: city || null,
          state: state || null,
          country: country || null,
          postalCode: postalCode || null,
          ghlId: ghlId || null,
          imageUrl: imageUrl || null,
          status,
        };
        response = await fetch('/api/donor', { // Adjust to '/api/organization' if needed
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedOrganization) {
        const payload = {
          name,
          email,
          phone: phone || null,
          company: company || null,
          address: address || null,
          website: website || null,
          city: city || null,
          state: state || null,
          country: country || null,
          postalCode: postalCode || null,
          ghlId: ghlId || null,
          imageUrl: imageUrl || selectedOrganization.imageUrl || null,
          status,
        };
        response = await fetch(`/api/donor/${selectedOrganization.id}`, { // Adjust to '/api/organization/[id]' if needed
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedOrganization) {
        response = await fetch(`/api/donor/${selectedOrganization.id}`, { // Adjust to '/api/organization/[id]' if needed
          method: 'DELETE',
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchOrganizations();
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  // Filter handlers
  const handleFilterNameChange = (e) => setFilterName(e.target.value);
  const handleFilterEmailChange = (e) => setFilterEmail(e.target.value);
  const handleFilterCityChange = (e) => setFilterCity(e.target.value);
//   const handleFilterStateChange = (e) => setFilterState(e.target.value);
//   const handleFilterCountryChange = (e) => setFilterCountry(e.target.value);
  const handleFilterStatusChange = (e) => setFilterStatus(e.target.value);

  // Animation variants
  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  };

  const filterVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#FFF', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
          Organization Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleModalOpen('add')}
          sx={{ borderRadius: '20px', textTransform: 'none', boxShadow: '0 4px 10px rgba(0, 128, 0, 0.2)' }}
        >
          Add Organization
        </Button>
      </Box>

      {/* Filters */}
      <motion.div
        variants={filterVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5 }}
        sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}
      >
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
          {/* <TextField
            label="Filter by City"
            value={filterCity}
            onChange={handleFilterCityChange}
            variant="outlined"
            size="small"
            sx={{ minWidth: 200 }}
          /> */}
          {/* <TextField
            label="Filter by State"
            value={filterState}
            onChange={handleFilterStateChange}
            variant="outlined"
            size="small"
            sx={{ minWidth: 200 }}
          /> */}
          {/* <TextField
            label="Filter by Country"
            value={filterCountry}
            onChange={handleFilterCountryChange}
            variant="outlined"
            size="small"
            sx={{ minWidth: 200 }}
          /> */}
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
      </motion.div>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchOrganizations}>
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
      ) : filteredOrganizations.length === 0 ? (
        <Typography>No organizations found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '0px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#302E56' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Company</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Website</TableCell>
           
                 <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredOrganizations.map((org, index) => (
                  <motion.tr
                    key={org.id}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    sx={{ '&:hover': { bgcolor: '#f0f0f0' } }}
                  >
                    <TableCell>{org.name}</TableCell>
                    <TableCell>{org.email}</TableCell>
                    <TableCell>{org.phone || 'N/A'}</TableCell>
                    <TableCell>{org.company || 'N/A'}</TableCell>
                    <TableCell>
                      {org.website ? (
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {org.website}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
            
                  
                    <TableCell>
                      {org.imageUrl ? (
                        <img
                          src={org.imageUrl}
                          alt={org.name}
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
                          backgroundColor: org.status ? '#e6f4ea' : '#fdeded',
                          color: org.status ? '#2e7d32' : '#d32f2f',
                        }}
                      >
                        {org.status ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(org.created_at)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton color="primary" onClick={() => handleModalOpen('view', org)}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton color="primary" onClick={() => handleModalOpen('edit', org)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleModalOpen('delete', org)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Dialog
            open={modalOpen}
            onClose={handleModalClose}
            maxWidth="sm"
            fullWidth
            component={motion.div}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <DialogTitle sx={{ bgcolor: '#1a3c34', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {modalMode === 'add' ? 'Add Organization' : modalMode === 'edit' ? 'Edit Organization' : modalMode === 'view' ? 'View Organization' : 'Delete Organization'}
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
                    label="Company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    disabled={modalMode === 'view'}
                  />
                  <TextField
                    label="Website"
                    name="website"
                    value={formData.website}
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
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    disabled={modalMode === 'view'}
                  />
                  <TextField
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    disabled={modalMode === 'view'}
                  />
                  <TextField
                    label="Postal Code"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    disabled={modalMode === 'view'}
                  />
                  <TextField
                    label="GHL ID"
                    name="ghlId"
                    value={formData.ghlId}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    disabled={modalMode === 'view'}
                  />
                  {modalMode !== 'view' && (
                    <TextField
                      type="file"
                      label="Organization Image"
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
                        alt="Organization preview"
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
                  Are you sure you want to delete organization <strong>{selectedOrganization?.name}</strong>?
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
        )}
      </AnimatePresence>
    </Box>
  );
}
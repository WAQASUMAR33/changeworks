'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Button,
  CircularProgress,
  TablePagination,
  Modal,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  Skeleton,
  Snackbar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Package, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

// Constants
const ROLES = [
  { value: 'DONOR', label: 'Donor', color: 'primary' },
  { value: 'ADMIN', label: 'Admin', color: 'warning' },
  { value: 'MANAGER', label: 'Manager', color: 'info' },
  { value: 'SUPERADMIN', label: 'Superadmin', color: 'error' },
];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRoleColor = (role) => {
  return ROLES.find(r => r.value === role)?.color || 'default';
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateForm = (formData, isEdit = false) => {
  const errors = {};
  
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!isEdit && !formData.password?.trim()) {
    errors.password = 'Password is required';
  }
  
  if (!isEdit && formData.password && formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return errors;
};

// Loading skeleton component
const UserTableSkeleton = () => (
  <Card className="mb-6">
    <CardContent>
      {[...Array(5)].map((_, index) => (
        <Box key={index} className="flex items-center space-x-4 py-4">
          <Skeleton variant="text" width="5%" />
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="25%" />
          <Skeleton variant="rectangular" width="10%" height={24} />
          <Skeleton variant="text" width="15%" />
          <Box className="flex space-x-2">
            <Skeleton variant="rectangular" width={60} height={32} />
            <Skeleton variant="rectangular" width={60} height={32} />
          </Box>
        </Box>
      ))}
    </CardContent>
  </Card>
);

export default function UserManagementPage() {
  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState('');
  const [filterNameEmail, setFilterNameEmail] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch users with error handling and loading states
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/user?page=${page + 1}&limit=${rowsPerPage}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch users`);
      }

      if (!data.users || !Array.isArray(data.users)) {
        throw new Error('Invalid response format');
      }

      setUsers(data.users);
      setTotalCount(data.totalCount || data.users.length);
    } catch (err) {
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
      setTotalCount(0);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced filtering
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      const filtered = users.filter((user) => {
        const matchesNameEmail = filterNameEmail
          ? (user.name?.toLowerCase().includes(filterNameEmail.toLowerCase())) ||
            user.email.toLowerCase().includes(filterNameEmail.toLowerCase())
          : true;
        const matchesRole = filterRole ? user.role === filterRole : true;
        return matchesNameEmail && matchesRole;
      });
      setFilteredUsers(filtered);
    }, 300);
    
    setSearchTimeout(timeout);
    
    return () => clearTimeout(timeout);
  }, [users, filterNameEmail, filterRole]);

  // Event handlers
  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setFormData(
      user
        ? { name: user.name || '', email: user.email, password: '', role: user.role }
        : { name: '', email: '', password: '', role: 'DONOR' }
    );
    setFormErrors({});
    setShowPassword(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '', password: '', role: 'DONOR' });
    setFormErrors({});
    setShowPassword(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm(formData, !!selectedUser);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      const url = selectedUser ? `/api/user/${selectedUser.id}` : '/api/user';
      const method = selectedUser ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${selectedUser ? 'update' : 'create'} user`);
      }

      setSuccess(`User ${selectedUser ? 'updated' : 'created'} successfully!`);
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.name || user.email}?`)) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      
      setSuccess('User deleted successfully!');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterNameEmailChange = (e) => {
    setFilterNameEmail(e.target.value);
  };

  const handleFilterRoleChange = (e) => {
    setFilterRole(e.target.value);
  };

  const clearFilters = () => {
    setFilterNameEmail('');
    setFilterRole('');
  };

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'Name', 'Email', 'Role', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.name || '',
        user.email,
        user.role,
        formatDate(user.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gray-50 p-6"
    >
      <Box className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-8">
          <div>
            <Typography variant="h4" className="font-bold text-gray-900 mb-2">
              User Management
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Manage and organize your users efficiently
            </Typography>
          </div>
          <div className="flex gap-2">
            <Tooltip title="Export Users">
              <Button
                variant="outlined"
                onClick={exportUsers}
                startIcon={<Download className="w-4 h-4" />}
                disabled={filteredUsers.length === 0}
              >
                Export
              </Button>
            </Tooltip>
            <Tooltip title="Refresh">
              <Button
                variant="outlined"
                onClick={fetchUsers}
                startIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenModal()}
              startIcon={<Plus className="w-4 h-4" />}
              className="shadow-lg"
            >
              Add User
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {ROLES.map((role) => {
            const count = users.filter(user => user.role === role.value).length;
            return (
              <Card key={role.value} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography variant="body2" className="text-gray-600 mb-1">
                        {role.label}s
                      </Typography>
                      <Typography variant="h5" className="font-bold">
                        {count}
                      </Typography>
                    </div>
                    <Chip 
                      label={role.label} 
                      color={role.color} 
                      size="small"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 flex-wrap">
                <Typography variant="h6" className="text-gray-900 flex items-center gap-2 min-w-fit">
                  <Filter className="w-5 h-5" />
                  Filters
                </Typography>
                <TextField
                  label="Search by Name or Email"
                  value={filterNameEmail}
                  onChange={handleFilterNameEmailChange}
                  variant="outlined"
                  size="small"
                  className="min-w-[250px]"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="w-4 h-4 text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl className="min-w-[180px]" size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filterRole}
                    onChange={handleFilterRoleChange}
                    label="Role"
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    {ROLES.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {(filterNameEmail || filterRole) && (
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    size="small"
                    className="text-gray-600"
                  >
                    Clear Filters
                  </Button>
                )}
                <div className="ml-auto text-sm text-gray-600">
                  {filteredUsers.length} of {totalCount} users
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={itemVariants} className="mb-6">
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={fetchUsers}>
                  Retry
                </Button>
              }
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Table */}
        <motion.div variants={itemVariants}>
          {loading ? (
            <UserTableSkeleton />
          ) : (
            <Card className="overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-900 font-mono">
                              #{user.id}
                            </Typography>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                  {(user.name || user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <Typography variant="body2" className="text-gray-900 font-medium">
                                  {user.name || 'No Name'}
                                </Typography>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600">
                              {user.email}
                            </Typography>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Chip
                              label={user.role}
                              color={getRoleColor(user.role)}
                              size="small"
                              className="font-medium"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600">
                              {formatDate(user.created_at)}
                            </Typography>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Tooltip title="Edit User">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenModal(user)}
                                  className="text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete User">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(user)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <Typography variant="h6" className="text-gray-500 mb-2">
                    No users found
                  </Typography>
                  <Typography variant="body2" className="text-gray-400 mb-6">
                    {filterNameEmail || filterRole 
                      ? 'No users match your current filters. Try adjusting your search criteria.'
                      : 'Get started by adding your first user.'
                    }
                  </Typography>
                  {(filterNameEmail || filterRole) && (
                    <Button variant="outlined" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}

              {filteredUsers.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  className="border-t border-gray-200 bg-gray-50"
                />
              )}
            </Card>
          )}
        </motion.div>

        {/* Modal for Add/Edit User */}
        <Modal 
          open={openModal} 
          onClose={handleCloseModal}
          closeAfterTransition
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4"
            >
              <Typography variant="h5" className="mb-6 text-gray-900 font-bold">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </Typography>
              
              {formErrors.submit && (
                <Alert severity="error" className="mb-4">
                  {formErrors.submit}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <TextField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  fullWidth
                  variant="outlined"
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
                
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  fullWidth
                  variant="outlined"
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
                
                {!selectedUser && (
                  <TextField
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleFormChange}
                    fullWidth
                    variant="outlined"
                    error={!!formErrors.password}
                    helperText={formErrors.password || 'Minimum 6 characters'}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    label="Role"
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Chip label={role.label} color={role.color} size="small" />
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outlined" 
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={submitting}
                    startIcon={submitting && <CircularProgress size={16} />}
                    className="min-w-[100px]"
                  >
                    {submitting 
                      ? 'Processing...' 
                      : selectedUser ? 'Update User' : 'Create User'
                    }
                  </Button>
                </div>
              </form>
            </Box>
          </motion.div>
        </Modal>

        {/* Success Snackbar */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSuccess('')} 
            severity="success" 
            className="shadow-lg"
          >
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
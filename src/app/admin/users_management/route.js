'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Package } from 'lucide-react';

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState('');
  const [filterNameEmail, setFilterNameEmail] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR',
  });
  const [formError, setFormError] = useState('');

  // Fetch users on mount and when page/rowsPerPage change
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  // Apply filters
  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesNameEmail = filterNameEmail
        ? (user.name && user.name.toLowerCase().includes(filterNameEmail.toLowerCase())) ||
          user.email.toLowerCase().includes(filterNameEmail.toLowerCase())
        : true;
      const matchesRole = filterRole ? user.role === filterRole : true;
      return matchesNameEmail && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [users, filterNameEmail, filterRole]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/user?page=${page + 1}&limit=${rowsPerPage}`);
      const data = await response.json();
      console.log('API Response:', data);
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch users`);
      }

      if (!data.users || !Array.isArray(data.users)) {
        console.error('Unexpected response format:', data);
        throw new Error('Expected users data to be an array');
      }

      setUsers(data.users);
      setTotalCount(data.totalCount || data.users.length);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
      setTotalCount(0);
      setLoading(false);
      console.error('Fetch error:', err);
    }
  };

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setFormData(
      user
        ? { name: user.name || '', email: user.email, password: '', role: user.role }
        : { name: '', email: '', password: '', role: 'DONOR' }
    );
    setFormError('');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '', password: '', role: 'DONOR' });
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

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

      fetchUsers();
      handleCloseModal();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`/api/user/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
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

  const handleFilterNameEmailChange = (e) => setFilterNameEmail(e.target.value);
  const handleFilterRoleChange = (e) => setFilterRole(e.target.value);

  const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#FFF', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenModal()}
          startIcon={<Users className="w-5 h-5" />}
        >
          Add User
        </Button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex gap-4 flex-wrap"
      >
        <TextField
          label="Filter by Name/Email"
          value={filterNameEmail}
          onChange={handleFilterNameEmailChange}
          variant="outlined"
          size="small"
          className="min-w-[200px]"
        />
        <FormControl className="min-w-[200px]" size="small">
          <InputLabel>Filter by Role</InputLabel>
          <Select
            value={filterRole}
            onChange={handleFilterRoleChange}
            label="Filter by Role"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="MANAGER">Manager</MenuItem>
            <MenuItem value="SUPERADMIN">Superadmin</MenuItem>
            <MenuItem value="DONOR">Donor</MenuItem>
          </Select>
        </FormControl>
      </motion.div>

      {error && (
        <div className="mb-6">
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchUsers}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-6">
          <CircularProgress />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(user.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => handleOpenModal(user)}
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">No users match your filters.</p>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              className="border-t border-gray-200"
            />
          )}
        </div>
      )}

      {/* Modal for Add/Edit User */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'white',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            minWidth: 400,
            maxWidth: 600,
          }}
        >
          <Typography variant="h6" className="mb-4">
            {selectedUser ? 'Edit User' : 'Add User'}
          </Typography>
          {formError && (
            <Alert severity="error" className="mb-4">
              {formError}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            {!selectedUser && (
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
                required
              />
            )}
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                label="Role"
              >
                <MenuItem value="DONOR">Donor</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="SUPERADMIN">Superadmin</MenuItem>
              </Select>
            </FormControl>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outlined" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {selectedUser ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Box>
      </Modal>
    </Box>
  );
}
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function verifyAdminToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.type === 'admin' ? decoded : null;
  } catch (error) {
    return null;
  }
}

export function createAdminToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      type: 'admin',
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No admin token found');
      return false;
    }
    
    const decoded = verifyAdminToken(token);
    const isValid = decoded && decoded.type === 'admin' && decoded.role === 'ADMIN';
    
    console.log('Admin token validation:', { 
      hasToken: !!token, 
      decoded: !!decoded, 
      type: decoded?.type, 
      role: decoded?.role, 
      isValid 
    });
    
    return isValid;
  } catch (error) {
    console.error('Admin auth check error:', error);
    return false;
  }
}

export function getAdminUser() {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('adminUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function clearAdminAuth() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
}

export function clearAllAuthData() {
  if (typeof window === 'undefined') return;
  
  // Clear admin auth
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  
  // Clear organization auth
  localStorage.removeItem('orgToken');
  localStorage.removeItem('orgUser');
  localStorage.removeItem('orgRememberMe');
  
  // Clear donor auth
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  
  // Clear session storage
  sessionStorage.removeItem('orgToken');
  sessionStorage.removeItem('orgUser');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

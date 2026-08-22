const API_BASE = '/api';

const getHeaders = (explicitToken) => {
  const token = explicitToken || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  // `token` (if provided) overrides the stored token — used by pending-MFA calls.
  const { token: explicitToken, ...config } = options;
  if (!config.headers) {
    config.headers = getHeaders(explicitToken);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    // fetch() rejects on network failure / DNS / CORS / mixed-content.
    throw new Error('Unable to connect to server. Check your internet connection and try again.');
  }

  // Some failures (proxies, stale caches) return non-JSON bodies; never let
  // JSON parsing errors mask the real HTTP status.
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Stale/invalid session token cleanup. Auth endpoints are excluded so a
    // failed login attempt never clears unrelated state. A hard redirect
    // guarantees no role/session data lingers in React state.
    if (response.status === 401 && !endpoint.startsWith('/auth')) {
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        sessionStorage.setItem('sessionExpired', '1');
        window.location.replace('/login');
      }
    }
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  return data;
};

export const authAPI = {
  login: (username, password) =>
    apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (userData) =>
    apiCall('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiCall('/auth/me'),
  resetUserPassword: (userId, newPassword) =>
    apiCall('/auth/reset-user-password', { method: 'POST', body: JSON.stringify({ userId, newPassword }) }),
};

export const studentAPI = {
  getAll: (params = '') => apiCall(`/students?${params}`),
  getOne: (id) => apiCall(`/students/${id}`),
  create: (data) => apiCall('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/students/${id}`, { method: 'DELETE' }),
};

export const teacherAPI = {
  getAll: () => apiCall('/teachers'),
  getOne: (id) => apiCall(`/teachers/${id}`),
  create: (data) => apiCall('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/teachers/${id}`, { method: 'DELETE' }),
};

export const batchAPI = {
  getAll: () => apiCall('/batches'),
  getOne: (id) => apiCall(`/batches/${id}`),
  create: (data) => apiCall('/batches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/batches/${id}`, { method: 'DELETE' }),
  addStudent: (batchId, studentId) =>
    apiCall(`/batches/${batchId}/students`, { method: 'POST', body: JSON.stringify({ studentId }) }),
  removeStudent: (batchId, studentId) =>
    apiCall(`/batches/${batchId}/students/${studentId}`, { method: 'DELETE' }),
};

export const attendanceAPI = {
  getAll: (params = '') => apiCall(`/attendance?${params}`),
  mark: (data) => apiCall('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getSummary: (studentId) => apiCall(`/attendance/summary/${studentId}`),
};

export const feeAPI = {
  getAll: (params = '') => apiCall(`/fees?${params}`),
  create: (data) => apiCall('/fees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/fees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSummary: () => apiCall('/fees/summary'),
  getStudentFees: (studentId) => apiCall(`/fees/student/${studentId}`),
  getPendingRange: (params) => apiCall(`/fees/pending-range?${params}`),
  recordRangePayment: (data) => apiCall('/fees/record-range', { method: 'POST', body: JSON.stringify(data) }),
};

export const homeworkAPI = {
  getAll: (params = '') => apiCall(`/homework?${params}`),
  create: (data) => apiCall('/homework', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/homework/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/homework/${id}`, { method: 'DELETE' }),
};

export const examAPI = {
  getAll: (params = '') => apiCall(`/exams?${params}`),
  create: (data) => apiCall('/exams', { method: 'POST', body: JSON.stringify(data) }),
};

export const resultAPI = {
  getAll: (params = '') => apiCall(`/results?${params}`),
  create: (data) => apiCall('/results', { method: 'POST', body: JSON.stringify(data) }),
  getStudentResults: (studentId) => apiCall(`/results/student/${studentId}`),
};

export const noticeAPI = {
  getAll: (params = '') => apiCall(`/notices?${params}`),
  create: (data) => apiCall('/notices', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/notices/${id}`, { method: 'DELETE' }),
};

export const routineAPI = {
  getAll: () => apiCall('/routine'),
  create: (data) => apiCall('/routine', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/routine/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/routine/${id}`, { method: 'DELETE' }),
};

export const queryAPI = {
  getAll: (params = '') => apiCall(`/queries?${params}`),
  create: (data) => apiCall('/queries', { method: 'POST', body: JSON.stringify(data) }),
  reply: (id, data) => apiCall(`/queries/${id}/reply`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const dashboardAPI = {
  getAdmin: () => apiCall('/dashboard/admin'),
  getTeacher: () => apiCall('/dashboard/teacher'),
  getStudent: () => apiCall('/dashboard/student'),
  getPerformance: (studentId) => apiCall(`/dashboard/performance/${studentId}`),
};

export const API_BASE_URL = 'http://localhost:8000/api';

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  USER: `${API_BASE_URL}/auth/user`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
};

export const ADMIN_ENDPOINTS = {
  // Documents
  UPLOAD_DOCUMENT: `${API_BASE_URL}/admin/documents`,
  GET_DOCUMENTS: `${API_BASE_URL}/admin/documents`,
  UPDATE_DOCUMENT: `${API_BASE_URL}/admin/documents`,
  TOGGLE_DOCUMENT_STATUS: `${API_BASE_URL}/admin/documents`,
  DELETE_DOCUMENT: `${API_BASE_URL}/admin/documents`,
  
  // Document Categories
  DOCUMENT_CATEGORIES: `${API_BASE_URL}/admin/document-categories`,
  
  // News
  NEWS: `${API_BASE_URL}/admin/news`,
  TOGGLE_NEWS_STATUS: `${API_BASE_URL}/admin/news`,
  
  // News Categories
  NEWS_CATEGORIES: `${API_BASE_URL}/admin/news-categories`,
  
  // Courses
  COURSES: `${API_BASE_URL}/admin/courses`,
  TOGGLE_COURSE_STATUS: `${API_BASE_URL}/admin/courses`,
  
  // Course Categories
  COURSE_CATEGORIES: `${API_BASE_URL}/admin/course-categories`,
  
  // Course Materials
  COURSE_MATERIALS: `${API_BASE_URL}/admin/course-materials`,
  
  // Tests
  TESTS: `${API_BASE_URL}/admin/tests`,
  DUPLICATE_TEST: `${API_BASE_URL}/admin/tests`,
  PARSE_TEST_EXCEL: `${API_BASE_URL}/admin/tests/parse-excel`,
  
  // Users
  USERS: `${API_BASE_URL}/admin/users`,
  TOGGLE_USER_ADMIN: `${API_BASE_URL}/admin/users`,
  
  // Categories (legacy)
  CATEGORIES: `${API_BASE_URL}/admin/categories`,
};


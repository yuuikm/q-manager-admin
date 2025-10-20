import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { checkAuth, getCurrentUser } from "store/authSlice";
import Login from "pages/Login";
import Dashboard from "pages/Dashboard";
import DocumentUpload from "pages/DocumentUpload";
import DocumentList from "pages/DocumentList";
import DocumentCategories from "pages/DocumentCategories";
import CourseUpload from "pages/CourseUpload";
import CourseList from "pages/CourseList";
import CourseCategories from "pages/CourseCategories";
import NewsUpload from "pages/NewsUpload";
import NewsList from "pages/NewsList";
import NewsCategories from "pages/NewsCategories";
import Tests from "pages/Tests";
import Users from "pages/Users";
import RouteWrapper from "components/RouteWrapper";
import "./App.css";
import { LINKS } from "constants/routes.ts";

// Component that handles authentication logic with navigation
function AppContent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAppSelector(
    (state: any) => state.auth,
  );
  
  // Local state to track if we've completed initial auth check
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      dispatch(checkAuth());
      dispatch(getCurrentUser()).catch((error) => {
        console.error('Failed to get current user:', error);
        localStorage.removeItem("auth_token");
        navigate(LINKS.loginLink);
      }).finally(() => {
        setAuthChecked(true);
      });
    } else {
      setAuthChecked(true);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user && user.role !== "admin") {
      localStorage.removeItem("auth_token");
      navigate(LINKS.loginLink);
    }
  }, [isAuthenticated, user]);

  // Show loading only during initial authentication check
  if (!authChecked || (isLoading && localStorage.getItem("auth_token"))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Always render the same route structure to prevent re-renders
  return (
    <Routes>
      <Route path={LINKS.loginLink} element={<Login />} />
      <Route
        path={LINKS.homeLink}
        element={
          <RouteWrapper>
            <Navigate to={LINKS.dashboardLink} replace />
          </RouteWrapper>
        }
      />
      <Route 
        path={LINKS.dashboardLink} 
        element={
          <RouteWrapper>
            <Dashboard />
          </RouteWrapper>
        } 
      />
      <Route 
        path={LINKS.documentsLink} 
        element={
          <RouteWrapper>
            <DocumentList />
          </RouteWrapper>
        } 
      />
      <Route
        path={LINKS.documentsUploadLink}
        element={
          <RouteWrapper>
            <DocumentUpload />
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.documentsCategoryLink}
        element={
          <RouteWrapper>
            <DocumentCategories />
          </RouteWrapper>
        }
      />
      <Route 
        path={LINKS.coursesLink} 
        element={
          <RouteWrapper>
            <CourseList />
          </RouteWrapper>
        } 
      />
      <Route 
        path={LINKS.coursesUploadLink} 
        element={
          <RouteWrapper>
            <CourseUpload />
          </RouteWrapper>
        } 
      />
      <Route
        path={LINKS.coursesCategoryLink}
        element={
          <RouteWrapper>
            <CourseCategories />
          </RouteWrapper>
        }
      />
      <Route 
        path={LINKS.newsLink} 
        element={
          <RouteWrapper>
            <NewsList />
          </RouteWrapper>
        } 
      />
      <Route 
        path={LINKS.newsUploadLink} 
        element={
          <RouteWrapper>
            <NewsUpload />
          </RouteWrapper>
        } 
      />
      <Route 
        path={LINKS.newsCategoryLink} 
        element={
          <RouteWrapper>
            <NewsCategories />
          </RouteWrapper>
        } 
      />
      <Route 
        path={LINKS.testsLink} 
        element={
          <RouteWrapper>
            <Tests />
          </RouteWrapper>
        } 
      />
      <Route 
        path={LINKS.usersLink} 
        element={
          <RouteWrapper>
            <Users />
          </RouteWrapper>
        } 
      />
      <Route path="*" element={<Navigate to={LINKS.loginLink} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

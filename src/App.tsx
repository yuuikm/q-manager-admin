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
import InternalDocumentList from "pages/InternalDocumentList";
import InternalDocumentUpload from "pages/InternalDocumentUpload";
import InternalDocumentView from "pages/InternalDocumentView";
import ManagerHelpList from "pages/ManagerHelpList";
import ManagerHelpUpload from "pages/ManagerHelpUpload";
import ManagerHelpCategories from "pages/ManagerHelpCategories";
import SliderList from "pages/SliderList";
import SliderUpload from "pages/SliderUpload";
import RouteWrapper from "components/RouteWrapper";
import "./App.css";
import ErrorBoundary from '@/components/ErrorBoundary';
import { LINKS } from '@/constants/routes';

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
  }, [isAuthenticated, user, navigate]);

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
      <Route
        path={LINKS.internalDocumentsLink}
        element={
          <RouteWrapper>
            <InternalDocumentList />
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.internalDocumentsUploadLink}
        element={
          <RouteWrapper>
            <InternalDocumentUpload />
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.internalDocumentsViewLink}
        element={
          <RouteWrapper>
            <InternalDocumentView />
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.managerHelpLink}
        element={
          <RouteWrapper>
            <ErrorBoundary>
              <ManagerHelpList />
            </ErrorBoundary>
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.managerHelpUploadLink}
        element={
          <RouteWrapper>
            <ManagerHelpUpload />
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.managerHelpCategoryLink}
        element={
          <RouteWrapper>
            <ManagerHelpCategories />
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.sliderLink}
        element={
          <RouteWrapper>
            <SliderList />
          </RouteWrapper>
        }
      />
      <Route
        path={LINKS.sliderUploadLink}
        element={
          <RouteWrapper>
            <SliderUpload />
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

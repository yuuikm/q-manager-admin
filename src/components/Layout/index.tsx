import { type FC, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "store/hooks";
import { layoutMenuItems, type LayoutMenuItem } from "./config";
import { LINKS } from "constants/routes";

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: any) => state.auth);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate(LINKS.loginLink);
  };

  const isActive = (item: LayoutMenuItem) => {
    return item.isActive
      ? item.isActive(location.pathname)
      : location.pathname === item.path;
  };

  const getUserDisplayName = () => {
    if (user) {
      return `${user.username}`;
    }
    return "Admin";
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="sidebar w-64">
        <div className="p-4">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-white">Q-Manager Admin</h1>
          </div>

          <nav className="space-y-2">
            {layoutMenuItems.map((item: LayoutMenuItem) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive(item) ? "active" : ""
                }`}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="admin-header px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {layoutMenuItems.find((item) => isActive(item))?.label ||
                  "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Добро пожаловать,</p>
                <p className="text-sm font-medium text-gray-800">
                  {getUserDisplayName()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="admin-button admin-button-secondary cursor-pointer"
              >
                Выйти
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content flex-1 p-6">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

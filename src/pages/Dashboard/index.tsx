import { type FC } from "react";
import { Link } from "react-router-dom";
import { menuItems, type MenuItem } from "./config";

const Dashboard: FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Панель администратора
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item: MenuItem) => {
          const card = (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
              <div className={item.color}>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
              </div>
            </div>
          );

          return item.path ? (
            <Link
              key={item.id}
              to={item.path}
              className="admin-card hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              {card}
            </Link>
          ) : (
            <div key={item.id} className="admin-card">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;

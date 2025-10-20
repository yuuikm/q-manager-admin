import {
  type TableColumn,
  type TableAction,
} from "@/components/shared/DataTable";

// Utility functions
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Column configurations without JSX
export const newsColumns: TableColumn[] = [
  {
    key: "news",
    label: "Новость",
  },
  {
    key: "category",
    label: "Категория",
  },
  {
    key: "statistics",
    label: "Статистика",
  },
  {
    key: "status",
    label: "Статус",
  },
  {
    key: "created_at",
    label: "Создана",
  },
];

// Action configurations without JSX
export const newsActions: TableAction[] = [
  {
    key: "actions",
    label: "Действия",
  },
];

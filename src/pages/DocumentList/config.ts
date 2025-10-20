import {
  type TableColumn,
  type TableAction,
} from "@/components/shared/DataTable";

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Байт";
  const sizes = ["Байт", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

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
export const documentColumns: TableColumn[] = [
  {
    key: "document",
    label: "Документ",
  },
  {
    key: "category",
    label: "Категория",
  },
  {
    key: "price",
    label: "Цена",
  },
  {
    key: "status",
    label: "Статус",
  },
  {
    key: "created_at",
    label: "Создан",
  },
];

// Action configurations without JSX
export const documentActions: TableAction[] = [
  {
    key: "actions",
    label: "Действия",
  },
];

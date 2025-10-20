import {
  type TableColumn,
  type TableAction,
} from "@/components/shared/DataTable";

// Utility functions
export const getTypeLabel = (type: string) => {
  switch (type) {
    case "online":
      return "Онлайн";
    case "self_learning":
      return "Самообучение";
    case "offline":
      return "Офлайн";
    default:
      return type;
  }
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
  }).format(price);
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
export const courseColumns: TableColumn[] = [
  {
    key: "course",
    label: "Курс",
  },
  {
    key: "type_category",
    label: "Тип / Категория",
  },
  {
    key: "students",
    label: "Слушатели",
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
export const courseActions: TableAction[] = [
  {
    key: "actions",
    label: "Действия",
  },
];

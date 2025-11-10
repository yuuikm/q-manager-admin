import {
  type TableColumn,
  type TableAction,
} from "@/components/shared/DataTable";

// Utility functions
const TYPE_LABELS: Record<string, string> = {
  online: "Онлайн",
  offline: "Оффлайн",
  self_learning: "Дистанционное обучение",
};

export const getTypeLabel = (type: string | string[]) => {
  if (Array.isArray(type)) {
    return type
      .map((item) => TYPE_LABELS[item] ?? item)
      .join(" • ");
  }

  return TYPE_LABELS[type] ?? type;
};

export const formatPrice = (price: number) => {
  return `${price}₸`;
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

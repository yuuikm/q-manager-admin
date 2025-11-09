import {
  type TableColumn,
  type TableAction,
} from "@/components/shared/DataTable";

export interface InternalDocumentAuthor {
  id: number;
  username: string;
  email: string;
}

export interface InternalDocument {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  author: InternalDocumentAuthor | null;
}

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

export const internalDocumentColumns: TableColumn[] = [
  {
    key: "document",
    label: "Документ",
  },
  {
    key: "file_info",
    label: "Информация о файле",
  },
  {
    key: "author",
    label: "Автор",
  },
  {
    key: "created_at",
    label: "Дата создания",
  },
];

export const internalDocumentActions: TableAction[] = [
  {
    key: "actions",
    label: "Действия",
  },
];


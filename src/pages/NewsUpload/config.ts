import * as Yup from "yup";
import { type FormField } from "@/components/shared/FormController";

// Validation schema
export const newsValidationSchema = Yup.object({
  title: Yup.string()
    .required("Заголовок новости обязателен")
    .min(5, "Заголовок должен содержать минимум 5 символов"),
  description: Yup.string()
    .required("Краткое описание обязательно")
    .min(20, "Описание должно содержать минимум 20 символов"),
  content: Yup.string()
    .required("Содержимое новости обязательно")
    .min(100, "Содержимое должно содержать минимум 100 символов"),
  category: Yup.string()
    .required("Категория обязательна")
    .min(2, "Название категории должно содержать минимум 2 символа"),
  image: Yup.mixed().when("editMode", {
    is: true,
    then: (schema) => schema.nullable(),
    otherwise: (schema) =>
      schema
        .test(
          "fileSize",
          "Изображение слишком большое (максимум 5MB)",
          (value) => {
            if (!value) return true;
            return (value as File).size <= 5 * 1024 * 1024;
          },
        )
        .test("fileType", "Неподдерживаемый тип изображения", (value) => {
          if (!value) return true;
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ];
          return allowedTypes.includes((value as File).type);
        }),
  }),
  is_published: Yup.boolean(),
  is_featured: Yup.boolean(),
});

// Form fields configuration
export const newsFormFields: FormField[] = [
  {
    name: "title",
    type: "text",
    label: "Заголовок новости",
    placeholder: "Введите заголовок новости",
    required: true,
  },
  {
    name: "description",
    type: "textarea",
    label: "Краткое описание",
    placeholder: "Введите краткое описание новости",
    required: true,
    rows: 3,
  },
  {
    name: "content",
    type: "textarea",
    label: "Содержимое новости",
    placeholder: "Введите полное содержимое новости",
    required: true,
    rows: 10,
  },
  {
    name: "category",
    type: "searchable-select",
    label: "Категория",
    placeholder: "Введите название категории или выберите существующую",
    required: true,
    options: [], // Will be populated dynamically
  },
  {
    name: "image",
    type: "file",
    label: "Изображение новости",
    accept: "image/jpeg,image/png,image/gif,image/webp",
  },
  {
    name: "is_published",
    type: "checkbox",
    label: "Опубликовать сразу",
  },
  {
    name: "is_featured",
    type: "checkbox",
    label: "Рекомендуемая новость",
  },
];

// Initial values
export const getNewsInitialValues = (editMode: boolean, newsData: any) => ({
  id: editMode && newsData ? newsData.id : null,
  editMode,
  title: editMode && newsData ? newsData.title : "",
  description: editMode && newsData ? newsData.description : "",
  content: editMode && newsData ? newsData.content : "",
  category: editMode && newsData ? newsData.category?.name : "",
  image: null,
  is_published: editMode && newsData ? newsData.is_published : false,
  is_featured: editMode && newsData ? newsData.is_featured : false,
});

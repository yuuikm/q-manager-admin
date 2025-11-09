import * as Yup from 'yup';
import { type FormField } from '@/components/shared/FormController';

// Validation schema
export const documentValidationSchema = Yup.object({
  title: Yup.string()
    .required('Название документа обязательно')
    .min(3, 'Название должно содержать минимум 3 символа'),
  description: Yup.string()
    .transform((value) => (typeof value === 'string' ? value.trim() : value))
    .nullable()
    .notRequired()
    .max(500, 'Описание не должно превышать 500 символов'),
  price: Yup.number()
    .required('Цена обязательна')
    .min(0, 'Цена не может быть отрицательной'),
  preview_pages: Yup.number()
    .when('editMode', {
      is: true,
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema
        .required('Количество страниц в превью обязательно')
        .min(1, 'Минимум 1 страница')
        .max(10, 'Максимум 10 страниц'),
    }),
  category: Yup.string()
    .required('Категория обязательна')
    .min(2, 'Название категории должно содержать минимум 2 символа'),
  file: Yup.mixed().when('editMode', {
    is: true,
    then: (schema) => schema.nullable(),
    otherwise: (schema) => schema
      .required('Файл обязателен')
      .test('fileSize', 'Файл слишком большой (максимум 10MB)', (value) => {
        if (!value) return true;
        return (value as File).size <= 10 * 1024 * 1024;
      })
      .test('fileType', 'Неподдерживаемый тип файла', (value) => {
        if (!value) return true;
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/gif'
        ];
        return allowedTypes.includes((value as File).type);
      }),
  }),
});

// Form fields configuration
export const documentFormFields: FormField[] = [
  {
    name: 'title',
    type: 'text',
    label: 'Название документа',
    placeholder: 'Введите название документа',
    required: true,
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Описание',
    placeholder: 'Введите описание документа',
    required: false,
    rows: 4,
  },
  {
    name: 'price',
    type: 'number',
    label: 'Цена (KZT)',
    placeholder: '0.00',
    required: true,
    min: 0,
    step: 0.01,
  },
  {
    name: 'preview_pages',
    type: 'number',
    label: 'Количество страниц в превью',
    placeholder: '3',
    required: true,
    min: 1,
    max: 10,
    step: 1,
  },
  {
    name: 'category',
    type: 'searchable-select',
    label: 'Категория',
    placeholder: 'Введите название категории или выберите существующую',
    required: true,
    options: [], // Will be populated dynamically
  },
  {
    name: 'file',
    type: 'file',
    label: 'Файл документа',
    required: true,
    accept: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif',
  },
];

// Initial values
export const getDocumentInitialValues = (editMode: boolean, documentData: any) => ({
  id: editMode && documentData ? documentData.id : null,
  editMode,
  title: editMode && documentData ? documentData.title : '',
  description: editMode && documentData ? documentData.description : '',
  price: editMode && documentData ? documentData.price : 0,
  preview_pages: editMode && documentData ? (documentData.preview_pages || 3) : 3,
  category: editMode && documentData ? documentData.category?.name : '',
  file: undefined, // Use undefined instead of null for file input
  currentFileName: editMode && documentData ? documentData.file_name : undefined,
});

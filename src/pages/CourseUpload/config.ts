import * as Yup from 'yup';
import { type FormField } from '@/components/shared/FormController';

// Validation schema
export const courseValidationSchema = Yup.object({
  title: Yup.string()
    .required('Название курса обязательно')
    .min(5, 'Название должно содержать минимум 5 символов'),
  description: Yup.string()
    .required('Описание курса обязательно')
    .min(20, 'Описание должно содержать минимум 20 символов'),
  content: Yup.string()
    .required('Содержимое курса обязательно')
    .min(100, 'Содержимое должно содержать минимум 100 символов'),
  price: Yup.number()
    .required('Цена обязательна')
    .min(0, 'Цена не может быть отрицательной'),
  type: Yup.string()
    .required('Тип курса обязателен')
    .oneOf(['online', 'self_learning', 'offline'], 'Неверный тип курса'),
  category_id: Yup.number()
    .required('Категория обязательна'),
  featured_image: Yup.mixed()
    .nullable()
    .test('fileSize', 'Изображение слишком большое (максимум 5MB)', (value) => {
      if (!value) return true;
      return (value as File).size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Неподдерживаемый тип изображения', (value) => {
      if (!value) return true;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      return allowedTypes.includes((value as File).type);
    }),
  max_students: Yup.number()
    .min(1, 'Минимум 1 студент')
    .max(1000, 'Максимум 1000 студентов')
    .nullable(),
  duration_hours: Yup.number()
    .min(1, 'Минимум 1 час')
    .max(1000, 'Максимум 1000 часов')
    .nullable(),
  requirements: Yup.string().nullable(),
  learning_outcomes: Yup.string().nullable(),
  zoom_link: Yup.string().nullable().test('url', 'Неверный формат ссылки', function(value) {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }),
  is_published: Yup.boolean(),
  is_featured: Yup.boolean(),
  materials: Yup.array().of(
    Yup.object({
      title: Yup.string().required('Название материала обязательно'),
      type: Yup.string().required('Тип материала обязателен'),
    })
  ).min(1, 'Необходимо добавить хотя бы один материал курса'),
});

// Form fields configuration
export const courseFormFields: FormField[] = [
  {
    name: 'title',
    type: 'text',
    label: 'Название курса',
    placeholder: 'Введите название курса',
    required: true,
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Описание курса',
    placeholder: 'Введите описание курса',
    required: true,
    rows: 4,
  },
  {
    name: 'content',
    type: 'textarea',
    label: 'Содержимое курса',
    placeholder: 'Введите полное содержимое курса',
    required: true,
    rows: 8,
  },
  {
    name: 'price',
    type: 'number',
    label: 'Цена (USD)',
    placeholder: '0.00',
    required: true,
    min: 0,
    step: 0.01,
  },
  {
    name: 'type',
    type: 'select',
    label: 'Тип курса',
    placeholder: 'Выберите тип курса',
    required: true,
    options: [
      { value: 'online', label: 'Онлайн' },
      { value: 'self_learning', label: 'Самообучение' },
      { value: 'offline', label: 'Офлайн' },
    ],
  },
  {
    name: 'category_id',
    type: 'searchable-select',
    label: 'Категория',
    placeholder: 'Выберите категорию',
    required: true,
    options: [],
  },
  {
    name: 'featured_image',
    type: 'file',
    label: 'Изображение курса',
    accept: 'image/jpeg,image/png,image/gif,image/webp',
  },
  {
    name: 'max_students',
    type: 'number',
    label: 'Максимальное количество студентов',
    placeholder: '50',
    min: 1,
    max: 1000,
  },
  {
    name: 'duration_hours',
    type: 'number',
    label: 'Продолжительность (часы)',
    placeholder: '40',
    min: 1,
    max: 1000,
  },
  {
    name: 'requirements',
    type: 'textarea',
    label: 'Требования',
    placeholder: 'Введите требования к курсу',
    rows: 3,
  },
  {
    name: 'learning_outcomes',
    type: 'textarea',
    label: 'Результаты обучения',
    placeholder: 'Введите что студенты узнают после курса',
    rows: 3,
  },
  {
    name: 'zoom_link',
    type: 'text',
    label: 'Zoom ссылка (для онлайн курсов)',
    placeholder: 'https://zoom.us/j/...',
  },
  {
    name: 'is_published',
    type: 'checkbox',
    label: 'Опубликовать сразу',
  },
  {
    name: 'is_featured',
    type: 'checkbox',
    label: 'Рекомендуемый курс',
  },
  {
    name: 'materials',
    type: 'custom',
    label: 'Материалы курса *',
    required: true,
  },
];

// Initial values
export const getCourseInitialValues = (editMode: boolean, courseData: any, onMaterialsChange?: (materials: any[]) => void) => ({
  id: editMode && courseData ? courseData.id : null,
  editMode: editMode,
  title: editMode && courseData ? courseData.title : '',
  description: editMode && courseData ? courseData.description : '',
  content: editMode && courseData ? courseData.content : '',
  price: editMode && courseData ? courseData.price : 0,
  type: editMode && courseData ? courseData.type : 'online',
  category_id: editMode && courseData ? courseData.category?.id : '',
  featured_image: null,
  max_students: editMode && courseData ? courseData.max_students : 50,
  duration_hours: editMode && courseData ? courseData.duration_hours : 40,
  requirements: editMode && courseData ? courseData.requirements : '',
  learning_outcomes: editMode && courseData ? courseData.learning_outcomes : '',
  zoom_link: editMode && courseData ? courseData.zoom_link : '',
  is_published: editMode && courseData ? courseData.is_published : false,
  is_featured: editMode && courseData ? courseData.is_featured : false,
  materials: editMode && courseData ? courseData.materials || [] : [],
  onMaterialsChange: onMaterialsChange,
});
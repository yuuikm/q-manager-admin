import * as Yup from 'yup';
import { type FormField } from '@/components/shared/FormController';

// Validation schema
export const internalDocumentValidationSchema = Yup.object({
  title: Yup.string()
    .required('Название документа обязательно')
    .min(3, 'Название должно содержать минимум 3 символа'),
  file: Yup.mixed().when('editMode', {
    is: true,
    then: (schema) => schema.nullable(),
    otherwise: (schema) => schema
      .required('Файл обязателен')
      .test('fileSize', 'Файл слишком большой (максимум 10MB)', (value) => {
        if (!value) return true;
        return (value as File).size <= 10 * 1024 * 1024;
      })
      .test('fileType', 'Неподдерживаемый тип файла. Разрешенные типы: PDF, DOC, DOCX', (value) => {
        if (!value) return true;
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        return allowedTypes.includes((value as File).type);
      }),
  }),
});

// Form fields configuration
export const internalDocumentFormFields: FormField[] = [
  {
    name: 'title',
    type: 'text',
    label: 'Название документа',
    placeholder: 'Введите название документа',
    required: true,
  },
  {
    name: 'file',
    type: 'file',
    label: 'Файл документа',
    required: true,
    accept: '.pdf,.doc,.docx',
  },
];

// Initial values
export const getInternalDocumentInitialValues = (editMode: boolean, documentData: any) => ({
  id: editMode && documentData ? documentData.id : null,
  editMode,
  title: editMode && documentData ? documentData.title : '',
  file: undefined,
  currentFileName: editMode && documentData ? documentData.file_name : undefined,
});


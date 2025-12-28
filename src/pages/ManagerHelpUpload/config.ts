import * as Yup from 'yup';
import { type FormField } from '@/components/shared/FormController';

export const managerHelpFormFields: FormField[] = [
    {
        name: 'title',
        label: 'Заголовок',
        type: 'text',
        placeholder: 'Введите заголовок',
        required: true,
    },
    {
        name: 'category',
        label: 'Категория',
        type: 'searchable-select',
        placeholder: 'Введите название категории или выберите существующую',
        required: true,
        options: [], // Will be filled in the component
    },
    {
        name: 'description',
        label: 'Описание',
        type: 'textarea',
        placeholder: 'Введите описание',
    },
    {
        name: 'document',
        label: 'Документ (PDF, DOC)',
        type: 'file',
    },
    {
        name: 'youtube_url',
        label: 'Ссылка на YouTube видео',
        type: 'text',
        placeholder: 'https://www.youtube.com/watch?v=...',
    },
    {
        name: 'is_active',
        label: 'Активно',
        type: 'checkbox',
    },
];

export const managerHelpValidationSchema = Yup.object().shape({
    title: Yup.string().required('Заголовок обязателен'),
    category: Yup.string().required('Категория обязательна'),
    description: Yup.string().nullable(),
    youtube_url: Yup.string().url('Введите корректную ссылку').nullable(),
    is_active: Yup.boolean(),
});

export const getInitialValues = (editMode: boolean, data: any) => {
    if (editMode && data) {
        return {
            title: data.title || '',
            category: data.category?.name || '',
            description: data.description || '',
            youtube_url: data.youtube_url || '',
            is_active: data.is_active ?? true,
        };
    }
    return {
        title: '',
        category: '',
        description: '',
        youtube_url: '',
        is_active: true,
    };
};

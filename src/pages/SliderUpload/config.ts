import * as Yup from 'yup';
import { FormField } from '@/components/shared/FormController';

export const sliderFormFields: FormField[] = [
    {
        name: 'title',
        label: 'Заголовок (необязательно)',
        type: 'text',
        placeholder: 'Введите заголовок слайда',
    },
    {
        name: 'description',
        label: 'Описание (необязательно)',
        type: 'textarea',
        placeholder: 'Введите краткое описание',
    },
    {
        name: 'image',
        label: 'Изображение',
        type: 'file',
        accept: 'image/*',
        required: true,
    },
    {
        name: 'link_url',
        label: 'Ссылка (необязательно)',
        type: 'text',
        placeholder: 'Например: /courses/1 или https://example.com',
    },
    {
        name: 'order',
        label: 'Порядок отображения',
        type: 'number',
        placeholder: '0',
    },
    {
        name: 'is_active',
        label: 'Активен',
        type: 'checkbox',
    },
];

export const sliderValidationSchema = Yup.object().shape({
    title: Yup.string().max(255, 'Слишком длинный заголовок'),
    description: Yup.string().nullable(),
    image: Yup.mixed().when('$editMode', {
        is: false,
        then: (schema) => schema.required('Изображение обязательно для нового слайда'),
        otherwise: (schema) => schema.nullable(),
    }),
    link_url: Yup.string().max(500, 'Слишком длинная ссылка').nullable(),
    order: Yup.number().integer().default(0),
    is_active: Yup.boolean().default(true),
});

export const getInitialValues = (editMode: boolean, sliderData: any) => {
    if (editMode && sliderData) {
        return {
            title: sliderData.title || '',
            description: sliderData.description || '',
            link_url: sliderData.link_url || '',
            order: sliderData.order || 0,
            is_active: sliderData.is_active,
            image: null,
        };
    }
    return {
        title: '',
        description: '',
        link_url: '',
        order: 0,
        is_active: true,
        image: null,
    };
};

import { type FC, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LINKS } from 'constants/routes';
import FormController from '@/components/shared/FormController';
import {
    managerHelpFormFields,
    managerHelpValidationSchema,
    getInitialValues
} from './config';
import { type FormField, type SelectOption } from '@/components/shared/FormController';
import { managerHelpAPI, ManagerHelpCategory } from '@/api/managerHelp';

const ManagerHelpUpload: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });
    const [categories, setCategories] = useState<ManagerHelpCategory[]>([]);

    const editMode = location.state?.editMode || false;
    const helpData = location.state?.helpData || null;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await managerHelpAPI.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        setStatus({ type: null, message: '' });

        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('category', values.category);
            if (values.description) formData.append('description', values.description);
            if (values.youtube_url) formData.append('youtube_url', values.youtube_url);
            formData.append('is_active', values.is_active ? '1' : '0');

            if (values.document) {
                formData.append('document', values.document);
            }

            if (editMode && helpData) {
                await managerHelpAPI.updateHelp(helpData.id, formData);
                setStatus({ type: 'success', message: 'Успешно обновлено' });
            } else {
                await managerHelpAPI.createHelp(formData);
                setStatus({ type: 'success', message: 'Успешно создано' });
            }

            setTimeout(() => navigate(LINKS.managerHelpLink), 2000);
        } catch (error: any) {
            console.error('Error saving manager help:', error);
            setStatus({ type: 'error', message: error.message || 'Произошла ошибка' });
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions: SelectOption[] = categories.map(cat => ({
        value: cat.name,
        label: cat.name,
    }));

    const formFields: FormField[] = managerHelpFormFields.map(field => {
        if (field.name === 'category') {
            return { ...field, options: categoryOptions };
        }
        return field;
    });

    const formConfig = {
        title: editMode ? 'Редактирование' : 'Создание',
        description: editMode ? 'Измените данные' : 'Добавьте новую запись',
        fields: formFields,
        submitButtonText: editMode ? 'Обновить' : 'Создать',
        cancelButtonText: 'Отмена',
        onSubmit: handleSubmit,
        onCancel: () => navigate(LINKS.managerHelpLink),
        initialValues: getInitialValues(editMode, helpData),
        validationSchema: managerHelpValidationSchema,
        loading: loading,
    };

    return (
        <div className="p-6">
            {status.type && (
                <div className={`mb-4 p-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {status.message}
                </div>
            )}
            <FormController {...formConfig} />
        </div>
    );
};

export default ManagerHelpUpload;

import { type FC, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LINKS } from '@/constants/routes';
import FormController from '@/components/shared/FormController';
import {
    sliderFormFields,
    sliderValidationSchema,
    getInitialValues
} from './config';
import { sliderAPI } from '@/api/slider';

const SliderUpload: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    const editMode = location.state?.editMode || false;
    const sliderData = location.state?.sliderData || null;

    const handleSubmit = async (values: any) => {
        setLoading(true);
        setStatus({ type: null, message: '' });

        try {
            const formData = new FormData();
            if (values.title) formData.append('title', values.title);
            if (values.description) formData.append('description', values.description);
            if (values.link_url) formData.append('link_url', values.link_url);
            formData.append('order', values.order.toString());
            formData.append('is_active', values.is_active ? '1' : '0');

            if (values.image) {
                formData.append('image', values.image);
            }

            if (editMode && sliderData) {
                await sliderAPI.updateSlider(sliderData.id, formData);
                setStatus({ type: 'success', message: 'Слайд успешно обновлен' });
            } else {
                await sliderAPI.createSlider(formData);
                setStatus({ type: 'success', message: 'Слайд успешно создан' });
            }

            setTimeout(() => navigate(LINKS.sliderLink), 1500);
        } catch (error: any) {
            console.error('Error saving slider:', error);
            setStatus({ type: 'error', message: error.message || 'Произошла ошибка' });
        } finally {
            setLoading(false);
        }
    };

    const formConfig = {
        title: editMode ? 'Редактировать слайд' : 'Добавить слайд',
        description: editMode ? 'Измените данные слайда' : 'Заполните форму для создания слайда',
        fields: sliderFormFields,
        submitButtonText: editMode ? 'Обновить' : 'Создать',
        cancelButtonText: 'Отмена',
        onSubmit: handleSubmit,
        onCancel: () => navigate(LINKS.sliderLink),
        initialValues: getInitialValues(editMode, sliderData),
        validationSchema: sliderValidationSchema,
        loading: loading,
        context: { editMode }
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {status.type && (
                    <div className={`mb-4 p-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {status.message}
                    </div>
                )}
                <FormController {...formConfig} />
            </div>
        </div>
    );
};

export default SliderUpload;

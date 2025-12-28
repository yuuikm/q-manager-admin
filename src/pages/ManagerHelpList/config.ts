export const managerHelpColumns = [
    { key: 'help', label: 'Название и описание' },
    { key: 'category', label: 'Категория' },
    { key: 'files', label: 'Файлы / Видео' },
    { key: 'status', label: 'Статус' },
    { key: 'created_at', label: 'Дата создания' },
];

export const managerHelpActions = [
    { key: 'actions', label: 'Действия' },
];

export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

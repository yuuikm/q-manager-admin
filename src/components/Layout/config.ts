import {LINKS} from '@/constants/routes';

export interface LayoutMenuItem {
    path: string;
    label: string;
    icon: string;
    isActive?: (pathname: string) => boolean;
}

export const layoutMenuItems: LayoutMenuItem[] = [
    {
        path: LINKS.dashboardLink,
        label: 'Дешборд',
        icon: '📊',
        isActive: (pathname: string) => pathname === LINKS.dashboardLink,
    },
    {
        path: LINKS.documentsLink,
        label: 'Платная документация',
        icon: '📄',
        isActive: (pathname: string) => pathname.startsWith(LINKS.documentsLink),
    },
    {
        path: LINKS.newsLink,
        label: 'Новости',
        icon: '📰',
        isActive: (pathname: string) => pathname.startsWith(LINKS.newsLink),
    },
    {
        path: LINKS.coursesLink,
        label: 'Курсы / Семинары',
        icon: '🎓',
        isActive: (pathname: string) => pathname.startsWith(LINKS.coursesLink),
    },
    {
        path: LINKS.testsLink,
        label: 'Тестирование',
        icon: '📝',
        isActive: (pathname: string) => pathname === LINKS.testsLink,
    },
    {
        path: LINKS.managerHelpLink,
        label: 'Помощь менеджеру',
        icon: '💡',
        isActive: (pathname: string) => pathname.startsWith(LINKS.managerHelpLink),
    },
    {
        path: LINKS.internalDocumentsLink,
        label: 'Внутренние документы',
        icon: '📋',
        isActive: (pathname: string) => pathname.startsWith(LINKS.internalDocumentsLink),
    },
    {
        path: LINKS.sliderLink,
        label: 'Слайдер',
        icon: '🖼️',
        isActive: (pathname: string) => pathname.startsWith(LINKS.sliderLink),
    },
    {
        path: LINKS.usersLink,
        label: 'Пользователи',
        icon: '👥',
        isActive: (pathname: string) => pathname.startsWith(LINKS.usersLink),
    },
    {
        path: LINKS.mediaFilesLink,
        label: 'Медиафайлы',
        icon: '🗂️',
        isActive: (pathname: string) => pathname.startsWith(LINKS.mediaFilesLink),
    },
    {
        path: LINKS.applicationsLink,
        label: 'Заявки',
        icon: '📝',
        isActive: (pathname: string) => pathname.startsWith(LINKS.applicationsLink),
    },
];

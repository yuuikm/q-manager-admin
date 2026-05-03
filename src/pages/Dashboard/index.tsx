import { type FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import { LINKS } from '@/constants/routes';
import { menuItems, type MenuItem } from './config';

interface DashboardStats {
    users: { total: number; admins: number };
    enrollments: { total: number; enrolled: number; in_progress: number; completed: number };
    certificates: { total: number };
    document_purchases: { total: number };
    courses: { total: number; active: number };
    documents: { total: number; active: number };
    news: { total: number; published: number };
}

async function fetchStats(): Promise<DashboardStats> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(ADMIN_ENDPOINTS.DASHBOARD_STATS, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Ошибка загрузки статистики');
    return response.json();
}

interface StatCardProps {
    label: string;
    value: number | string;
    icon: string;
    color: string;
    bg: string;
    sub?: string;
    to?: string;
}

const StatCard: FC<StatCardProps> = ({ label, value, icon, color, bg, sub, to }) => {
    const content = (
        <div className={`admin-card flex items-start gap-4 ${to ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}`}>
            <div className={`${bg} rounded-xl p-3 flex-shrink-0`}>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-sm text-gray-500 truncate">{label}</p>
                <p className={`text-3xl font-bold mt-0.5 ${color}`}>{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
            </div>
        </div>
    );

    return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
};

const Dashboard: FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats()
            .then(setStats)
            .catch((err) => setStatsError(err.message))
            .finally(() => setStatsLoading(false));
    }, []);

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
                <p className="text-gray-500 mt-1 text-sm">Общая статистика платформы</p>
            </div>

            {/* Stats section */}
            <section>
                <h2 className="text-base font-semibold text-gray-700 mb-4">Статистика</h2>

                {statsError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                        {statsError}
                    </div>
                )}

                {statsLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="admin-card animate-pulse">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                                        <div className="h-7 bg-gray-200 rounded w-1/2" />
                                        <div className="h-2.5 bg-gray-100 rounded w-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {stats && !statsLoading && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard
                                label="Зарегистрированных пользователей"
                                value={stats.users.total}
                                icon="👥"
                                color="text-blue-700"
                                bg="bg-blue-50"
                                sub={`Администраторов: ${stats.users.admins}`}
                                to={LINKS.usersLink}
                            />
                            <StatCard
                                label="Записей на курсы"
                                value={stats.enrollments.total}
                                icon="🎓"
                                color="text-green-700"
                                bg="bg-green-50"
                                sub={`В процессе: ${stats.enrollments.in_progress} · Ожидают: ${stats.enrollments.enrolled}`}
                                to={LINKS.coursesLink}
                            />
                            <StatCard
                                label="Курсов завершено"
                                value={stats.enrollments.completed}
                                icon="✅"
                                color="text-emerald-700"
                                bg="bg-emerald-50"
                                sub={`Из ${stats.enrollments.total} записей`}
                            />
                            <StatCard
                                label="Сертификатов выдано"
                                value={stats.certificates.total}
                                icon="🏆"
                                color="text-yellow-700"
                                bg="bg-yellow-50"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                            <StatCard
                                label="Документов куплено"
                                value={stats.document_purchases.total}
                                icon="🛒"
                                color="text-purple-700"
                                bg="bg-purple-50"
                                to={LINKS.documentsLink}
                            />
                            <StatCard
                                label="Курсов на платформе"
                                value={stats.courses.total}
                                icon="📚"
                                color="text-indigo-700"
                                bg="bg-indigo-50"
                                sub={`Активных: ${stats.courses.active}`}
                                to={LINKS.coursesLink}
                            />
                            <StatCard
                                label="Документов"
                                value={stats.documents.total}
                                icon="📄"
                                color="text-cyan-700"
                                bg="bg-cyan-50"
                                sub={`Активных: ${stats.documents.active}`}
                                to={LINKS.documentsLink}
                            />
                            <StatCard
                                label="Новостей"
                                value={stats.news.total}
                                icon="📰"
                                color="text-rose-700"
                                bg="bg-rose-50"
                                sub={`Опубликовано: ${stats.news.published}`}
                                to={LINKS.newsLink}
                            />
                        </div>

                        {stats.enrollments.total > 0 && (
                            <div className="admin-card mt-5">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Статус записей на курсы</h3>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <p className="text-2xl font-bold text-blue-600">{stats.enrollments.enrolled}</p>
                                        <p className="text-xs text-gray-500 mt-1">Записан</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <p className="text-2xl font-bold text-orange-500">{stats.enrollments.in_progress}</p>
                                        <p className="text-xs text-gray-500 mt-1">В процессе</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <p className="text-2xl font-bold text-green-600">{stats.enrollments.completed}</p>
                                        <p className="text-xs text-gray-500 mt-1">Завершено</p>
                                    </div>
                                </div>
                                <div className="flex rounded-full overflow-hidden h-2.5 bg-gray-100">
                                    <div className="bg-blue-400" style={{ width: `${(stats.enrollments.enrolled / stats.enrollments.total) * 100}%` }} />
                                    <div className="bg-orange-400" style={{ width: `${(stats.enrollments.in_progress / stats.enrollments.total) * 100}%` }} />
                                    <div className="bg-green-500" style={{ width: `${(stats.enrollments.completed / stats.enrollments.total) * 100}%` }} />
                                </div>
                                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Записан</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />В процессе</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Завершено</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Navigation cards — original menu */}
            <section>
                <h2 className="text-base font-semibold text-gray-700 mb-4">Управление</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item: MenuItem) => {
                        const card = (
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                                    <p className="text-gray-600">{item.description}</p>
                                </div>
                                <div className={item.color}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                </div>
                            </div>
                        );

                        return item.path ? (
                            <Link
                                key={item.id}
                                to={item.path}
                                className="admin-card hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                            >
                                {card}
                            </Link>
                        ) : (
                            <div key={item.id} className="admin-card">
                                {card}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;

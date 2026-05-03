import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { mediaAPI, MediaFile } from '@/api/media';

const FILE_TYPE_LABELS: Record<string, string> = {
    image: 'Изображение',
    pdf: 'PDF',
    word: 'Word',
    excel: 'Excel',
    video: 'Видео',
    other: 'Прочее',
};

const FILE_TYPE_ICONS: Record<string, string> = {
    image: '🖼️',
    pdf: '📕',
    word: '📘',
    excel: '📗',
    video: '🎬',
    other: '📎',
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

const MediaFiles: React.FC = () => {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [directories, setDirectories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unusedCount, setUnusedCount] = useState(0);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [folderFilter, setFolderFilter] = useState('');
    const [usedFilter, setUsedFilter] = useState<'' | 'true' | 'false'>('');

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;
            if (folderFilter) params.folder = folderFilter;
            if (usedFilter !== '') params.used = usedFilter;

            const data = await mediaAPI.getFiles(params as never);
            setFiles(data.files);
            setDirectories(data.directories);
            setUnusedCount(data.unused_count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки файлов');
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter, folderFilter, usedFilter]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFiles();
    };

    const handleResetFilters = () => {
        setSearch('');
        setTypeFilter('');
        setFolderFilter('');
        setUsedFilter('');
    };

    const toggleSelect = (path: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === files.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(files.map((f) => f.path)));
        }
    };

    const handleDeleteSingle = useCallback(async (file: MediaFile) => {
        if (!confirm(`Удалить файл "${file.name}"?`)) return;
        try {
            setDeleting(true);
            await mediaAPI.deleteFile(file.path);
            setFiles((prev) => prev.filter((f) => f.path !== file.path));
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(file.path);
                return next;
            });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Ошибка при удалении');
        } finally {
            setDeleting(false);
        }
    }, []);

    const handleDeleteSelected = useCallback(async () => {
        const paths = Array.from(selected);
        if (!paths.length) return;
        if (!confirm(`Удалить ${paths.length} файл(ов)? Это действие нельзя отменить.`)) return;
        try {
            setDeleting(true);
            const result = await mediaAPI.deleteFiles(paths);
            setFiles((prev) => prev.filter((f) => !result.deleted.includes(f.path)));
            setSelected(new Set());
            if (result.failed.length > 0) {
                alert(`Не удалось удалить ${result.failed.length} файл(ов)`);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Ошибка при удалении');
        } finally {
            setDeleting(false);
        }
    }, [selected]);

    const selectedUnused = useMemo(
        () => files.filter((f) => selected.has(f.path) && !f.is_used).length,
        [files, selected]
    );

    const handleSelectUnused = () => {
        setSelected(new Set(files.filter((f) => !f.is_used).map((f) => f.path)));
    };

    return (
        <div className="space-y-6">
            <div className="admin-card">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Медиафайлы</h1>
                        <p className="text-gray-600 mt-1">Управление файлами, загруженными на сервер</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {unusedCount > 0 && (
                            <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                                Неиспользуемых: {unusedCount}
                            </span>
                        )}
                        <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            Всего: {files.length}
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Поиск по имени</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Введите имя файла..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        <div className="w-44">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Тип файла</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Все типы</option>
                                {Object.entries(FILE_TYPE_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-52">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Папка</label>
                            <select
                                value={folderFilter}
                                onChange={(e) => setFolderFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Все папки</option>
                                {directories.map((dir) => (
                                    <option key={dir} value={dir}>{dir}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-44">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Использование</label>
                            <select
                                value={usedFilter}
                                onChange={(e) => setUsedFilter(e.target.value as '' | 'true' | 'false')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Все файлы</option>
                                <option value="true">Используемые</option>
                                <option value="false">Неиспользуемые</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                                Найти
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                            >
                                Сбросить
                            </button>
                        </div>
                    </form>
                </div>

                {/* Bulk actions */}
                {files.length > 0 && (
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <button
                            onClick={toggleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {selected.size === files.length ? 'Снять выделение' : 'Выбрать все'}
                        </button>
                        {unusedCount > 0 && (
                            <button
                                onClick={handleSelectUnused}
                                className="text-sm text-orange-600 hover:text-orange-800"
                            >
                                Выбрать неиспользуемые ({unusedCount})
                            </button>
                        )}
                        {selected.size > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                disabled={deleting}
                                className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                            >
                                {deleting ? 'Удаление...' : `Удалить выбранные (${selected.size})`}
                                {selectedUnused > 0 && selected.size !== selectedUnused && (
                                    <span className="ml-1 text-xs opacity-75">
                                        ({selectedUnused} из них не используются)
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                {error && (
                    <div className="text-center py-8">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchFiles}
                            className="mt-3 text-sm text-blue-600 hover:underline"
                        >
                            Повторить
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                    </div>
                )}

                {!loading && !error && files.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-lg">Файлы не найдены</p>
                        <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
                    </div>
                )}

                {!loading && !error && files.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selected.size === files.length && files.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-blue-600"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                        Файл
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Имя
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Папка
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Тип
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Размер
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Дата
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Статус
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Действия
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {files.map((file) => (
                                    <tr
                                        key={file.path}
                                        className={`hover:bg-gray-50 transition-colors ${selected.has(file.path) ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(file.path)}
                                                onChange={() => toggleSelect(file.path)}
                                                className="rounded border-gray-300 text-blue-600"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {file.type === 'image' ? (
                                                <button
                                                    onClick={() => setPreviewFile(file)}
                                                    className="block w-12 h-12 rounded overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                                                    title="Предпросмотр"
                                                >
                                                    <img
                                                        src={file.url}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </button>
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-2xl">
                                                    {FILE_TYPE_ICONS[file.type] ?? '📎'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={file.name}>
                                                {file.name}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate max-w-xs" title={file.path}>
                                                {file.path}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {file.folder}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-600">
                                                {FILE_TYPE_LABELS[file.type] ?? file.mime_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-600 whitespace-nowrap">
                                                {formatBytes(file.size)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {file.last_modified.slice(0, 10)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {file.is_used ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Используется
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    Не используется
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                    title="Открыть файл"
                                                >
                                                    🔗
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteSingle(file)}
                                                    disabled={deleting}
                                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                    title="Удалить файл"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Image preview modal */}
            {previewFile && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewFile(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-5 py-4 border-b">
                            <div>
                                <p className="font-semibold text-gray-900 truncate max-w-md">{previewFile.name}</p>
                                <p className="text-xs text-gray-500">{formatBytes(previewFile.size)} · {previewFile.folder}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={previewFile.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Открыть
                                </a>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-center bg-gray-50 max-h-[70vh]">
                            <img
                                src={previewFile.url}
                                alt={previewFile.name}
                                className="max-w-full max-h-[65vh] object-contain rounded"
                            />
                        </div>
                        <div className="px-5 py-3 border-t flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${previewFile.is_used ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {previewFile.is_used ? 'Используется' : 'Не используется'}
                            </span>
                            {!previewFile.is_used && (
                                <button
                                    onClick={() => {
                                        setPreviewFile(null);
                                        handleDeleteSingle(previewFile);
                                    }}
                                    className="text-sm text-red-600 hover:text-red-800"
                                >
                                    Удалить файл
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaFiles;

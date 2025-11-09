import React from "react";

export interface ActionsProps {
  onEdit: () => void;
  onToggleStatus?: () => void;
  onDelete: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  isActive?: boolean;
  isPublished?: boolean;
  editLabel?: string;
  toggleLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
  duplicateLabel?: string;
  showToggle?: boolean;
  showToggleStatus?: boolean;
  showDuplicate?: boolean;
  showView?: boolean;
}

const Actions: React.FC<ActionsProps> = ({
  onEdit,
  onToggleStatus,
  onDelete,
  onView,
  onDuplicate,
  isActive,
  isPublished,
  editLabel = "Редактировать",
  toggleLabel = "Переключить статус",
  deleteLabel = "Удалить",
  viewLabel = "Просмотреть",
  duplicateLabel = "Дублировать",
  showToggle = true,
  showToggleStatus = true,
  showDuplicate = false,
  showView = false,
}) => {
  // Determine status for toggle button
  const getStatus = () => {
    if (isActive !== undefined) return isActive;
    if (isPublished !== undefined) return isPublished;
    return true;
  };

  const status = getStatus();

  return (
    <div className="flex items-center space-x-2">
      {/* Edit Button */}
      <button
        onClick={onEdit}
        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
        title={editLabel}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>

      {/* View Button */}
      {showView && onView && (
        <button
          onClick={onView}
          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
          title={viewLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      )}

      {/* Toggle Status Button */}
      {showToggle && showToggleStatus && onToggleStatus && (
        <button
          onClick={onToggleStatus}
          className={`p-2 rounded-lg transition-colors ${
            status
              ? "text-orange-600 hover:text-orange-900 hover:bg-orange-50"
              : "text-green-600 hover:text-green-900 hover:bg-green-50"
          }`}
          title={toggleLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                status
                  ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                  : "M5 13l4 4L19 7"
              }
            />
          </svg>
        </button>
      )}

      {/* Duplicate Button */}
      {showDuplicate && onDuplicate && (
        <button
          onClick={onDuplicate}
          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
          title={duplicateLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      )}

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
        title={deleteLabel}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
};

export default Actions;

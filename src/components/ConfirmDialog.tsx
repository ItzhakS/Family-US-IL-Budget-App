import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useConfirmDialog } from '../contexts/ConfirmDialogContext';

export function ConfirmDialog() {
  const { state, handleConfirm, handleCancel } = useConfirmDialog();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.isOpen) {
      cancelButtonRef.current?.focus();
    }
  }, [state.isOpen]);

  useEffect(() => {
    if (!state.isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.isOpen, handleCancel]);

  if (!state.isOpen) return null;

  const isDanger = state.variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          ref={dialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            {isDanger && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
              </div>
            )}
            <div className="flex-1">
              {state.title && (
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-50"
                >
                  {state.title}
                </h3>
              )}
              <p
                id="confirm-dialog-description"
                className={`text-sm text-gray-600 dark:text-gray-300 ${state.title ? 'mt-2' : ''}`}
              >
                {state.message}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
            >
              {state.cancelLabel || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                isDanger
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400'
              }`}
            >
              {state.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

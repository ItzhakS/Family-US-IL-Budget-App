import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, ToastVariant, Toast } from '../contexts/ToastContext';

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    icon: React.ElementType;
    bgClass: string;
    borderClass: string;
    textClass: string;
    iconClass: string;
  }
> = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-950/60',
    borderClass: 'border-green-200 dark:border-green-800',
    textClass: 'text-green-800 dark:text-green-200',
    iconClass: 'text-green-500 dark:text-green-400',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-950/60',
    borderClass: 'border-red-200 dark:border-red-800',
    textClass: 'text-red-800 dark:text-red-200',
    iconClass: 'text-red-500 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-800 dark:text-amber-200',
    iconClass: 'text-amber-500 dark:text-amber-400',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-800 dark:text-blue-200',
    iconClass: 'text-blue-500 dark:text-blue-400',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 150);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 150);
    }, 3850);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm
        transition-all duration-150 ease-out
        ${config.bgClass} ${config.borderClass}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClass}`} aria-hidden />
      <p className={`flex-1 text-sm font-medium ${config.textClass}`}>{toast.message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className={`shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${config.textClass}`}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end justify-start p-4 sm:p-6"
    >
      <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

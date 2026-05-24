import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
}

interface ConfirmDialogContextValue {
  state: ConfirmDialogState;
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export const useConfirmDialog = () => {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  return ctx;
};

const initialState: ConfirmDialogState = {
  isOpen: false,
  message: '',
  title: undefined,
  confirmLabel: undefined,
  cancelLabel: undefined,
  variant: 'default',
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmDialogState>(initialState);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        ...options,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState(initialState);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState(initialState);
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ state, confirm, handleConfirm, handleCancel }}>
      {children}
    </ConfirmDialogContext.Provider>
  );
};

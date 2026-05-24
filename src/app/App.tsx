import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ConfirmDialogProvider } from '../contexts/ConfirmDialogContext';
import { ToastContainer } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <RouterProvider router={router} />
            <ToastContainer />
            <ConfirmDialog />
          </ConfirmDialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

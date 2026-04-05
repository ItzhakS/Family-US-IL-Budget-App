import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastContainer } from '../components/ToastContainer';

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <>
          <RouterProvider router={router} />
          <ToastContainer />
        </>
      </ThemeProvider>
    </AuthProvider>
  );
}

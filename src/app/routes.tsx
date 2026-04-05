import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from './AppShell';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MaaserPage } from '../pages/MaaserPage';
import { RecurringPage } from '../pages/RecurringPage';
import { InvestmentsPage } from '../pages/InvestmentsPage';
import { YearlySummaryPage } from '../pages/YearlySummaryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ImportPage } from '../pages/ImportPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'maaser',
        element: <MaaserPage />,
      },
      {
        path: 'recurring',
        element: <RecurringPage />,
      },
      {
        path: 'investments',
        element: <InvestmentsPage />,
      },
      {
        path: 'yearly',
        element: <YearlySummaryPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'import',
        element: <ImportPage />,
      },
    ],
  },
]);

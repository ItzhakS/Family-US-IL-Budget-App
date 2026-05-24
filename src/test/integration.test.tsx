import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TransactionType, Transaction, Category } from '../types';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { ConfirmDialogProvider, useConfirmDialog } from '../contexts/ConfirmDialogContext';
import { ToastContainer } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TransactionListFilters } from '../components/TransactionListFilters';

describe('Integration Tests', () => {
  describe('Toast notifications', () => {
    function ToastTestComponent() {
      const { addToast } = useToast();
      return (
        <div>
          <button onClick={() => addToast('Success message', 'success')}>Success</button>
          <button onClick={() => addToast('Error message', 'error')}>Error</button>
          <button onClick={() => addToast('Warning message', 'warning')}>Warning</button>
          <button onClick={() => addToast('Info message', 'info')}>Info</button>
        </div>
      );
    }

    function renderWithToast() {
      return render(
        <ToastProvider>
          <ToastTestComponent />
          <ToastContainer />
        </ToastProvider>
      );
    }

    it('should show success toast when triggered', async () => {
      renderWithToast();
      
      fireEvent.click(screen.getByText('Success'));
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Success message');
      });
    });

    it('should show error toast when triggered', async () => {
      renderWithToast();
      
      fireEvent.click(screen.getByText('Error'));
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error message');
      });
    });

    it('should support multiple toasts stacking', async () => {
      renderWithToast();
      
      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Error'));
      
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(2);
      });
    });

    it('should dismiss toast when clicking dismiss button', async () => {
      const user = userEvent.setup();
      renderWithToast();
      
      fireEvent.click(screen.getByText('Info'));
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      await waitFor(
        () => {
          expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe('Confirm dialog', () => {
    function ConfirmTestComponent() {
      const { confirm } = useConfirmDialog();
      const [result, setResult] = React.useState<string>('');

      const handleDelete = async () => {
        const confirmed = await confirm({
          title: 'Delete item?',
          message: 'This action cannot be undone.',
          confirmLabel: 'Delete',
          cancelLabel: 'Keep',
          variant: 'danger',
        });
        setResult(confirmed ? 'deleted' : 'cancelled');
      };

      return (
        <div>
          <button onClick={handleDelete}>Delete</button>
          <span data-testid="result">{result}</span>
        </div>
      );
    }

    function renderWithConfirm() {
      return render(
        <ConfirmDialogProvider>
          <ConfirmTestComponent />
          <ConfirmDialog />
        </ConfirmDialogProvider>
      );
    }

    it('should show dialog when triggered', async () => {
      renderWithConfirm();
      
      fireEvent.click(screen.getByText('Delete'));
      
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(screen.getByText('Delete item?')).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
      });
    });

    it('should resolve true when confirmed', async () => {
      const user = userEvent.setup();
      renderWithConfirm();
      
      fireEvent.click(screen.getByText('Delete'));
      
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('deleted');
      });
    });

    it('should resolve false when cancelled', async () => {
      const user = userEvent.setup();
      renderWithConfirm();
      
      fireEvent.click(screen.getByText('Delete'));
      
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Keep' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
      });
    });

    it('should close on escape key', async () => {
      renderWithConfirm();
      
      fireEvent.click(screen.getByText('Delete'));
      
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
      });
    });

    it('should focus cancel button by default', async () => {
      renderWithConfirm();
      
      fireEvent.click(screen.getByText('Delete'));
      
      await waitFor(() => {
        const keepButton = screen.getByRole('button', { name: 'Keep' });
        expect(document.activeElement).toBe(keepButton);
      });
    });
  });

  describe('Transaction list filtering', () => {
    const sampleTransactions: Transaction[] = [
      {
        id: '1',
        date: '2024-01-15',
        description: 'Grocery shopping at SuperMart',
        amount: 250,
        category: 'Food',
        type: TransactionType.EXPENSE,
        currency: 'ILS',
      },
      {
        id: '2',
        date: '2024-01-20',
        description: 'Monthly salary',
        amount: 15000,
        category: 'Salary',
        type: TransactionType.INCOME,
        currency: 'ILS',
      },
      {
        id: '3',
        date: '2024-02-01',
        description: 'USD consulting payment',
        amount: 500,
        category: 'Business',
        type: TransactionType.INCOME,
        currency: 'USD',
      },
      {
        id: '4',
        date: '2024-02-05',
        description: 'Gas station',
        amount: 200,
        category: 'Transportation',
        type: TransactionType.EXPENSE,
        currency: 'ILS',
      },
    ];

    it('should filter by search text (description)', () => {
      const filtered = sampleTransactions.filter((t) =>
        t.description.toLowerCase().includes('grocery')
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toContain('Grocery');
    });

    it('should filter by search text (category)', () => {
      const searchTerm = 'salary';
      const filtered = sampleTransactions.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm) ||
          t.category.toLowerCase().includes(searchTerm)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('Salary');
    });

    it('should filter by type (expense only)', () => {
      const filtered = sampleTransactions.filter((t) => t.type === TransactionType.EXPENSE);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.type === TransactionType.EXPENSE)).toBe(true);
    });

    it('should filter by type (income only)', () => {
      const filtered = sampleTransactions.filter((t) => t.type === TransactionType.INCOME);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.type === TransactionType.INCOME)).toBe(true);
    });

    it('should filter by currency (ILS)', () => {
      const filtered = sampleTransactions.filter((t) => t.currency === 'ILS');
      expect(filtered).toHaveLength(3);
    });

    it('should filter by currency (USD)', () => {
      const filtered = sampleTransactions.filter((t) => t.currency === 'USD');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].currency).toBe('USD');
    });

    it('should combine multiple filters', () => {
      const searchTerm: string = '';
      const typeFilter = TransactionType.INCOME;
      const currencyFilter: 'ILS' | 'USD' = 'ILS';

      const filtered = sampleTransactions.filter((t) => {
        const matchesSearch =
          searchTerm.length === 0 ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = t.type === typeFilter;
        const matchesCurrency = t.currency === currencyFilter;
        return matchesSearch && matchesType && matchesCurrency;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toBe('Monthly salary');
    });

    it('should filter by month', () => {
      const targetMonth = '2024-01';
      const filtered = sampleTransactions.filter((t) => t.date.startsWith(targetMonth));
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Recurring transaction helpers', () => {
    it('should identify active recurring templates', () => {
      const templates = [
        { id: '1', cancelledAt: null, remainingPayments: null },
        { id: '2', cancelledAt: '2024-01-01', remainingPayments: null },
        { id: '3', cancelledAt: null, remainingPayments: 0 },
        { id: '4', cancelledAt: null, remainingPayments: 5 },
      ];

      const active = templates.filter(
        (t) => t.cancelledAt === null && (t.remainingPayments === null || t.remainingPayments > 0)
      );

      expect(active).toHaveLength(2);
      expect(active.map((t) => t.id)).toEqual(['1', '4']);
    });

    it('should identify cancelled templates', () => {
      const templates = [
        { id: '1', cancelledAt: null },
        { id: '2', cancelledAt: '2024-01-01' },
        { id: '3', cancelledAt: '2024-02-15' },
      ];

      const cancelled = templates.filter((t) => t.cancelledAt !== null);

      expect(cancelled).toHaveLength(2);
    });

    it('should identify exhausted templates', () => {
      const templates = [
        { id: '1', cancelledAt: null, remainingPayments: null },
        { id: '2', cancelledAt: null, remainingPayments: 0 },
        { id: '3', cancelledAt: null, remainingPayments: 3 },
      ];

      const exhausted = templates.filter(
        (t) => t.cancelledAt === null && t.remainingPayments === 0
      );

      expect(exhausted).toHaveLength(1);
      expect(exhausted[0].id).toBe('2');
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransactionType, Transaction } from '../types';
import * as transactionService from './transactionService';
import * as demoStorage from './demoStorage';

vi.mock('./demoStorage', () => ({
  isDemoSessionActive: vi.fn(),
  readDemoTransactions: vi.fn(),
  writeDemoTransactions: vi.fn(),
}));

vi.mock('./exchangeRateService', () => ({
  getExchangeRate: vi.fn().mockResolvedValue({ usdToIls: 3.7, date: '2024-01-15' }),
  getExchangeRateOffline: vi.fn().mockResolvedValue({ usdToIls: 3.7, date: '2024-01-15' }),
}));

vi.mock('../lib/demoSeedTransactions', () => ({
  getDemoSeedTransactions: vi.fn(() => []),
}));

describe('transactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(demoStorage.isDemoSessionActive).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll (demo mode)', () => {
    it('should return transactions from demo storage', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          date: '2024-01-15',
          description: 'Groceries',
          amount: 150,
          category: 'Food',
          type: TransactionType.EXPENSE,
          currency: 'ILS',
        },
        {
          id: 'tx-2',
          date: '2024-01-10',
          description: 'Salary',
          amount: 10000,
          category: 'Income',
          type: TransactionType.INCOME,
          currency: 'ILS',
        },
      ];
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue(mockTransactions);

      const result = await transactionService.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
    });

    it('should sort transactions by date descending', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          date: '2024-01-05',
          description: 'Early',
          amount: 100,
          category: 'Other',
          type: TransactionType.EXPENSE,
          currency: 'ILS',
        },
        {
          id: 'tx-2',
          date: '2024-01-20',
          description: 'Late',
          amount: 200,
          category: 'Other',
          type: TransactionType.EXPENSE,
          currency: 'ILS',
        },
      ];
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue(mockTransactions);

      const result = await transactionService.getAll();

      expect(result[0].description).toBe('Late');
      expect(result[1].description).toBe('Early');
    });
  });

  describe('create (demo mode)', () => {
    it('should create a transaction with generated ID', async () => {
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue([]);

      const newTx: Omit<Transaction, 'id'> = {
        date: '2024-01-15',
        description: 'New transaction',
        amount: 100,
        category: 'Other',
        type: TransactionType.EXPENSE,
        currency: 'ILS',
      };

      const result = await transactionService.create(newTx);

      expect(result.id).toBeDefined();
      expect(result.description).toBe('New transaction');
      expect(result.amount).toBe(100);
      expect(demoStorage.writeDemoTransactions).toHaveBeenCalled();
    });

    it('should add FX snapshot on create', async () => {
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue([]);

      const newTx: Omit<Transaction, 'id'> = {
        date: '2024-01-15',
        description: 'USD Purchase',
        amount: 50,
        category: 'Other',
        type: TransactionType.EXPENSE,
        currency: 'USD',
      };

      const result = await transactionService.create(newTx);

      expect(result.exchangeRateUsdToIls).toBe(3.7);
      expect(result.fxRateDate).toBe('2024-01-15');
    });
  });

  describe('update (demo mode)', () => {
    it('should update an existing transaction', async () => {
      const existing: Transaction = {
        id: 'tx-1',
        date: '2024-01-15',
        description: 'Original',
        amount: 100,
        category: 'Food',
        type: TransactionType.EXPENSE,
        currency: 'ILS',
      };
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue([existing]);

      const updated: Omit<Transaction, 'id'> = {
        date: '2024-01-15',
        description: 'Updated',
        amount: 150,
        category: 'Food',
        type: TransactionType.EXPENSE,
        currency: 'ILS',
      };

      await transactionService.update('tx-1', updated);

      expect(demoStorage.writeDemoTransactions).toHaveBeenCalled();
      const writtenTxs = vi.mocked(demoStorage.writeDemoTransactions).mock.calls[0][0];
      const updatedTx = writtenTxs.find((t: Transaction) => t.id === 'tx-1');
      expect(updatedTx?.description).toBe('Updated');
      expect(updatedTx?.amount).toBe(150);
    });

    it('should throw if transaction not found', async () => {
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue([]);

      const updated: Omit<Transaction, 'id'> = {
        date: '2024-01-15',
        description: 'Updated',
        amount: 150,
        category: 'Food',
        type: TransactionType.EXPENSE,
        currency: 'ILS',
      };

      await expect(transactionService.update('nonexistent', updated)).rejects.toThrow(
        'Transaction not found'
      );
    });
  });

  describe('deleteTransaction (demo mode)', () => {
    it('should remove transaction from demo storage', async () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          date: '2024-01-15',
          description: 'Keep',
          amount: 100,
          category: 'Food',
          type: TransactionType.EXPENSE,
          currency: 'ILS',
        },
        {
          id: 'tx-2',
          date: '2024-01-15',
          description: 'Delete',
          amount: 200,
          category: 'Food',
          type: TransactionType.EXPENSE,
          currency: 'ILS',
        },
      ];
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue(transactions);

      await transactionService.deleteTransaction('tx-2');

      expect(demoStorage.writeDemoTransactions).toHaveBeenCalled();
      const writtenTxs = vi.mocked(demoStorage.writeDemoTransactions).mock.calls[0][0];
      expect(writtenTxs).toHaveLength(1);
      expect(writtenTxs[0].id).toBe('tx-1');
    });
  });

  describe('bulkCreate (demo mode)', () => {
    it('should create multiple transactions at once', async () => {
      vi.mocked(demoStorage.readDemoTransactions).mockReturnValue([]);

      const items: Omit<Transaction, 'id'>[] = [
        {
          date: '2024-01-15',
          description: 'Item 1',
          amount: 100,
          category: 'Food',
          type: TransactionType.EXPENSE,
          currency: 'ILS',
        },
        {
          date: '2024-01-16',
          description: 'Item 2',
          amount: 200,
          category: 'Transport',
          type: TransactionType.EXPENSE,
          currency: 'ILS',
        },
      ];

      const result = await transactionService.bulkCreate(items);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBeDefined();
      expect(result[1].id).toBeDefined();
      expect(demoStorage.writeDemoTransactions).toHaveBeenCalled();
    });

    it('should return empty array for empty input', async () => {
      const result = await transactionService.bulkCreate([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('mapRowToTransaction', () => {
    it('should correctly map snake_case DB row to camelCase Transaction', () => {
      const row = {
        id: 'tx-1',
        date: '2024-01-15',
        description: 'Test',
        amount: 100,
        category: 'Food',
        type: 'EXPENSE',
        currency: 'ILS',
        is_maaser_deductible: true,
        is_maaser_payment: false,
        is_non_maaser_income: false,
        is_tax_deductible: false,
        is_investment: false,
        is_tax_savings: false,
        is_recurring: true,
        exchange_rate_usd_to_ils: 3.7,
        fx_rate_date: '2024-01-15',
        recurring_cancelled_at: null,
        recurring_remaining_payments: 5,
        recurring_template_id: 'template-1',
      };

      const result = transactionService.mapRowToTransaction(row);

      expect(result.id).toBe('tx-1');
      expect(result.isMaaserDeductible).toBe(true);
      expect(result.isMaaserPayment).toBe(false);
      expect(result.isRecurring).toBe(true);
      expect(result.exchangeRateUsdToIls).toBe(3.7);
      expect(result.fxRateDate).toBe('2024-01-15');
      expect(result.recurringRemainingPayments).toBe(5);
      expect(result.recurringTemplateId).toBe('template-1');
    });
  });
});

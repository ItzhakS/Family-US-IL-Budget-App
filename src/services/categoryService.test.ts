import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransactionType, Category } from '../types';
import * as categoryService from './categoryService';
import * as demoStorage from './demoStorage';

vi.mock('./demoStorage', () => ({
  isDemoSessionActive: vi.fn(),
  readDemoCategories: vi.fn(),
  writeDemoCategories: vi.fn(),
}));

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(demoStorage.isDemoSessionActive).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll (demo mode)', () => {
    it('should return categories from demo storage', async () => {
      const mockCategories: Category[] = [
        {
          id: 'cat-1',
          familyId: 'demo',
          name: 'Food',
          kind: TransactionType.EXPENSE,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'cat-2',
          familyId: 'demo',
          name: 'Salary',
          kind: TransactionType.INCOME,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue(mockCategories);

      const result = await categoryService.getAll();

      expect(result).toHaveLength(2);
      expect(result.find((c) => c.name === 'Food')).toBeDefined();
    });
  });

  describe('createCategory (demo mode)', () => {
    it('should create a new category with generated ID', async () => {
      const existingCategories: Category[] = [
        {
          id: 'cat-1',
          familyId: 'demo',
          name: 'Food',
          kind: TransactionType.EXPENSE,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue(existingCategories);

      const result = await categoryService.createCategory('Transport', TransactionType.EXPENSE);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Transport');
      expect(result.kind).toBe(TransactionType.EXPENSE);
      expect(result.sortOrder).toBe(1);
      expect(demoStorage.writeDemoCategories).toHaveBeenCalled();
    });

    it('should throw error for empty name', async () => {
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue([]);

      await expect(categoryService.createCategory('', TransactionType.EXPENSE)).rejects.toThrow(
        'Category name required'
      );
      await expect(categoryService.createCategory('  ', TransactionType.EXPENSE)).rejects.toThrow(
        'Category name required'
      );
    });

    it('should throw error for duplicate category name', async () => {
      const existingCategories: Category[] = [
        {
          id: 'cat-1',
          familyId: 'demo',
          name: 'Food',
          kind: TransactionType.EXPENSE,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue(existingCategories);

      await expect(categoryService.createCategory('Food', TransactionType.EXPENSE)).rejects.toThrow(
        'A category with this name already exists'
      );
    });

    it('should allow same name for different kinds', async () => {
      const existingCategories: Category[] = [
        {
          id: 'cat-1',
          familyId: 'demo',
          name: 'Other',
          kind: TransactionType.EXPENSE,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue(existingCategories);

      const result = await categoryService.createCategory('Other', TransactionType.INCOME);

      expect(result.name).toBe('Other');
      expect(result.kind).toBe(TransactionType.INCOME);
    });
  });

  describe('renameCategory (demo mode)', () => {
    it('should rename an existing category', async () => {
      const existingCategories: Category[] = [
        {
          id: 'cat-1',
          familyId: 'demo',
          name: 'Food',
          kind: TransactionType.EXPENSE,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue(existingCategories);

      const result = await categoryService.renameCategory('cat-1', 'Food & Dining');

      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Food & Dining');
      expect(demoStorage.writeDemoCategories).toHaveBeenCalled();
    });

    it('should throw error for empty new name', async () => {
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue([]);

      await expect(categoryService.renameCategory('cat-1', '')).rejects.toThrow(
        'Category name required'
      );
    });

    it('should throw error if category not found', async () => {
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue([]);

      await expect(categoryService.renameCategory('nonexistent', 'New Name')).rejects.toThrow(
        'Category not found'
      );
    });

    it('should throw error for duplicate name within same kind', async () => {
      const existingCategories: Category[] = [
        {
          id: 'cat-1',
          familyId: 'demo',
          name: 'Food',
          kind: TransactionType.EXPENSE,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'cat-2',
          familyId: 'demo',
          name: 'Transport',
          kind: TransactionType.EXPENSE,
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue(existingCategories);

      await expect(categoryService.renameCategory('cat-2', 'Food')).rejects.toThrow(
        'A category with this name already exists'
      );
    });
  });

  describe('deleteCategory (demo mode)', () => {
    it('should delete an existing category', async () => {
      const existingCategories: Category[] = [
        {
          id: 'cat-1',
          familyId: 'demo',
          name: 'Food',
          kind: TransactionType.EXPENSE,
          sortOrder: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'cat-2',
          familyId: 'demo',
          name: 'Transport',
          kind: TransactionType.EXPENSE,
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue(existingCategories);

      await categoryService.deleteCategory('cat-2');

      expect(demoStorage.writeDemoCategories).toHaveBeenCalled();
      const writtenCategories = vi.mocked(demoStorage.writeDemoCategories).mock.calls[0][0];
      expect(writtenCategories).toHaveLength(1);
      expect(writtenCategories[0].id).toBe('cat-1');
    });

    it('should throw error if category not found', async () => {
      vi.mocked(demoStorage.readDemoCategories).mockReturnValue([]);

      await expect(categoryService.deleteCategory('nonexistent')).rejects.toThrow(
        'Category not found'
      );
    });
  });
});

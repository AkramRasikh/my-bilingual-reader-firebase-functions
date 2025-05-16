import { db } from '../db';
import { arabic } from '../language-keys';
import { wordsRef } from '../refs';
import { getDataSnapshot } from './get-data-snapshot';
import { removeItemFromSnapshot } from './remove-item-from-snapshot';

jest.mock('./get-data-snapshot');

// Mock dependencies
jest.mock('../db');

const createSnapshot = (...items) => items;

describe('removeItemFromSnapshot', () => {
  it('removes the item with matching id', async () => {
    const mockSnapshot = createSnapshot(
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    );
    (getDataSnapshot as jest.Mock).mockResolvedValue(mockSnapshot);
    const setMock = jest.fn().mockResolvedValue(null);

    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    const deletedId = await removeItemFromSnapshot({
      ref: wordsRef,
      language: arabic,
      id: 1,
    });

    expect(deletedId).toBe(1);
    expect(setMock).toHaveBeenCalledWith([{ id: 2, name: 'Item 2' }]);
  });

  it('ignores invalid items (null, undefined, empty objects)', async () => {
    const mockSnapshot = createSnapshot(
      null,
      undefined,
      {},
      { id: 3, name: 'Valid Item' },
    );
    (getDataSnapshot as jest.Mock).mockResolvedValue(mockSnapshot);
    const setMock = jest.fn().mockResolvedValue(null);
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    const deletedId = await removeItemFromSnapshot({
      ref: wordsRef,
      language: arabic,
      id: 3,
    });

    expect(deletedId).toBe(3);
    expect(setMock).toHaveBeenCalledWith([]);
  });

  it('returns undefined if no matching item is found', async () => {
    const mockSnapshot = createSnapshot(
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    );
    (getDataSnapshot as jest.Mock).mockResolvedValue(mockSnapshot);
    const setMock = jest.fn().mockResolvedValue(null);

    (db.ref as jest.Mock).mockReturnValue({ set: setMock });
    const deletedId = await removeItemFromSnapshot({
      ref: wordsRef,
      language: arabic,
      id: 99,
    });

    expect(deletedId).toBeUndefined();
    expect(setMock).toHaveBeenCalledWith(mockSnapshot);
  });

  it('handles empty snapshot gracefully', async () => {
    (getDataSnapshot as jest.Mock).mockResolvedValue([]);
    const setMock = jest.fn().mockResolvedValue(null);
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    const deletedId = await removeItemFromSnapshot({
      ref: wordsRef,
      language: arabic,
      id: 1,
    });

    expect(deletedId).toBeUndefined();
    expect(setMock).toHaveBeenCalledWith([]);
  });
});

import { Request, Response } from 'express';

import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { updateDatabaseViaIndex } from '../../firebase-utils/update-database-via-index';

import { updateWordRoute } from './update-word';

jest.mock('../../firebase-utils/get-data-snapshot');
jest.mock('../../firebase-utils/update-database-via-index');

const mockRequest = (body: any) => ({ body } as Request);
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const chineseWord = {
  baseForm: '受惠者',
  contexts: ['mock-contextId'],
  definition: 'Beneficiary',
  id: 'fa224044-7034-4ac4-a827-e5532ed612f6',
  phonetic: 'Shòu huì zhě',
  reviewData: {},
  surfaceForm: '受惠者',
  transliteration: 'Shòu huì zhě',
};

describe('updateWordRoute', () => {
  it('should update the word successfully', async () => {
    const req = mockRequest({
      id: chineseWord.id,
      language: 'chinese',
      fieldToUpdate: { definition: 'Updated' },
    });
    const res = mockResponse();

    (getDataSnapshot as jest.Mock).mockResolvedValue([chineseWord]);
    (updateDatabaseViaIndex as jest.Mock).mockResolvedValue({
      ...chineseWord,
      definition: 'Updated',
    });

    await updateWordRoute(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ...chineseWord,
      definition: 'Updated',
    });
  });

  it('should handle nested null in snapshot array', async () => {
    const req = mockRequest({
      id: chineseWord.id,
      language: 'chinese',
      fieldToUpdate: { definition: 'Updated' },
    });
    const res = mockResponse();

    (getDataSnapshot as jest.Mock).mockResolvedValue([null, chineseWord]);
    (updateDatabaseViaIndex as jest.Mock).mockResolvedValue({
      ...chineseWord,
      definition: 'Updated',
    });

    await updateWordRoute(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 when word is not found', async () => {
    const req = mockRequest({
      id: 'non-existent',
      language: 'chinese',
      fieldToUpdate: { definition: 'Updated' },
    });
    const res = mockResponse();

    (getDataSnapshot as jest.Mock).mockResolvedValue([]);

    await updateWordRoute(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Word not found in DB' });
  });

  it('should handle updateDatabaseViaIndex failure', async () => {
    const req = mockRequest({
      id: chineseWord.id,
      language: 'chinese',
      fieldToUpdate: { definition: 'Updated' },
    });
    const res = mockResponse();

    (getDataSnapshot as jest.Mock).mockResolvedValue([chineseWord]);
    (updateDatabaseViaIndex as jest.Mock).mockRejectedValue(
      new Error('DB update error'),
    );

    await updateWordRoute(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB update error' });
  });
});

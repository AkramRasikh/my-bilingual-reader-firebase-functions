import { Request, Response } from 'express';
import { db } from '../../db';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { getTranslationData } from './get-translation';
import { addWordRoute } from './add-word';
import { japanese } from '../../language-keys';

jest.mock('../../db'); // Mock the entire db module
jest.mock('../../firebase-utils/get-data-snapshot'); // Mock getDataSnapshot function
jest.mock('./get-translation'); // Mock getTranslationData function

describe('addWordRoute', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockReq = {
      body: {
        word: 'こんにちは',
        language: japanese,
        context: '7eee7194-2841-48b2-bb78-8876bd63e3bf', // change to contextId or sentenceId
        contextSentence: 'こんにちは、ご機嫌いかがですか?',
        isGoogle: true,
        reviewData: {
          difficulty: 7.1949,
          due: '2025-05-14T17: 08: 39.934Z',
          ease: 2.5,
          elapsed_days: 0,
          interval: 0,
          lapses: 0,
          last_review: '2025-05-14T17: 07: 39.934Z',
          reps: 1,
          scheduled_days: 0,
          stability: 0.40255,
          state: 1,
        },
      },
    };

    jest.clearAllMocks();
  });

  it('should add the word successfully when not a duplicate', async () => {
    // Mock getDataSnapshot to return an empty array (no existing words)
    (getDataSnapshot as jest.Mock) = jest.fn().mockResolvedValue([]);

    // Mock getTranslationData to return mocked translation data
    (getTranslationData as jest.Mock) = jest.fn().mockResolvedValue({
      id: 'unique-id-123',
      baseForm: 'こんにちは',
      definition: 'hello',
      phonetic: 'kon-ni-chi-wa',
      surfaceForm: 'こんにちは',
    });

    const setMock = jest.fn().mockResolvedValue(null);
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    await addWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      word: expect.objectContaining({
        baseForm: 'こんにちは',
        definition: 'hello',
        surfaceForm: 'こんにちは',
      }),
    });
  });

  it('should return 409 if the word already exists', async () => {
    // Mock getDataSnapshot to return an array containing the word
    (getDataSnapshot as jest.Mock) = jest
      .fn()
      .mockResolvedValue([
        { baseForm: 'こんにちは', surfaceForm: 'こんにちは' },
      ]);

    await addWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(409);
  });

  it('should return 500 if db.ref().set() fails', async () => {
    // Mock getDataSnapshot to return an empty array
    (getDataSnapshot as jest.Mock) = jest.fn().mockResolvedValue([]);

    // Mock getTranslationData to return mocked translation data
    (getTranslationData as jest.Mock) = jest.fn().mockResolvedValue({
      id: 'unique-id-123',
      baseForm: 'こんにちは',
      definition: 'hello',
      phonetic: 'kon-ni-chi-wa',
      surfaceForm: 'こんにちは',
    });

    // Mock db.ref().set() to throw an error
    const setMock = jest.fn().mockRejectedValue(new Error());
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    await addWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error trying to add word into DB',
    });
  });

  it('should return 500 if getTranslationData throws an error', async () => {
    (getDataSnapshot as jest.Mock) = jest.fn().mockResolvedValue([]);

    (getTranslationData as jest.Mock) = jest
      .fn()
      .mockRejectedValue(new Error('Error trying to translate via google'));

    await addWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error trying to translate via google',
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    const errMsg = 'Error adding こんにちは in japanese' as string;
    // Mock getDataSnapshot to throw an error
    (getDataSnapshot as jest.Mock) = jest
      .fn()
      .mockRejectedValue(new Error(errMsg));

    await addWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: errMsg,
    });
  });
});

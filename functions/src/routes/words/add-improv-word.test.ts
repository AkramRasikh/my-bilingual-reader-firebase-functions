import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { deepSeekChatAPI } from '../../ai-utils';
import { db } from '../../db';
import { addSentencesBulk } from '../../firebase-utils/add-sentences-bulk';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { japanese } from '../../language-keys';
import { synthesizeSpeech } from '../text-to-speech';
import { addImprovWordRoute, parseImprovAiResult } from './add-improv-word';

jest.mock('../../ai-utils', () => ({
  deepSeekChatAPI: jest.fn(),
}));
jest.mock('../../firebase-utils/add-sentences-bulk', () => ({
  addSentencesBulk: jest.fn(),
}));
jest.mock('../text-to-speech', () => ({
  synthesizeSpeech: jest.fn(),
}));
jest.mock('../../firebase-utils/get-data-snapshot');
jest.mock('../../db');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));
jest.mock('../../srs-utils', () => ({
  getInitSentenceCard: jest.fn(() => ({ due: '2026-01-01T00:00:00.000Z' })),
  getInitVocabCard: jest.fn(() => ({ due: '2026-01-01T00:00:00.000Z' })),
}));

const aiResult = {
  word: {
    surfaceForm: '準軍事組織',
    baseForm: '準軍事組織',
    definition: 'paramilitary organization',
    transliteration: 'jun-gunji-soshiki',
    phonetic: 'じゅんぐんじそしき',
    notes: 'More specific than 軍隊 (army).',
  },
  sentence: {
    targetLang: 'その国には準軍事組織がある。',
    baseLang: 'That country has a paramilitary organization.',
    notes: 'Uses the term where army would be too broad.',
  },
};

describe('parseImprovAiResult', () => {
  it('accepts a complete AI payload', () => {
    expect(parseImprovAiResult(aiResult).word.baseForm).toBe('準軍事組織');
  });

  it('throws when sentence fields are missing', () => {
    expect(() =>
      parseImprovAiResult({
        word: aiResult.word,
        sentence: { targetLang: '' },
      }),
    ).toThrow(/missing word/);
  });
});

describe('addImprovWordRoute', () => {
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
        language: japanese,
        inquiry: 'How do you say paramilitary instead of just army',
      },
    };

    jest.clearAllMocks();
    (uuidv4 as jest.Mock)
      .mockReturnValueOnce('sentence-id-1')
      .mockReturnValueOnce('word-id-1');
    (deepSeekChatAPI as jest.Mock).mockResolvedValue(aiResult);
    (addSentencesBulk as jest.Mock).mockResolvedValue([
      { id: 'sentence-id-1' },
    ]);
    (synthesizeSpeech as jest.Mock).mockResolvedValue('audio/sentence-id-1.mp3');
    (getDataSnapshot as jest.Mock).mockResolvedValue([]);
    const setMock = jest.fn().mockResolvedValue(null);
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });
  });

  it('saves a word and sentence from an inquiry', async () => {
    await addImprovWordRoute(mockReq as Request, mockRes as Response);

    expect(addSentencesBulk).toHaveBeenCalledWith(
      expect.objectContaining({
        language: japanese,
        sentencesBulk: [
          expect.objectContaining({
            id: 'sentence-id-1',
            topic: 'sentence-helper',
            inquiry: mockReq.body.inquiry,
            targetLang: aiResult.sentence.targetLang,
          }),
        ],
      }),
    );
    expect(synthesizeSpeech).toHaveBeenCalledWith({
      id: 'sentence-id-1',
      text: aiResult.sentence.targetLang,
      language: japanese,
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      word: expect.objectContaining({
        id: 'word-id-1',
        baseForm: '準軍事組織',
        contexts: ['sentence-id-1'],
      }),
      sentence: expect.objectContaining({
        id: 'sentence-id-1',
        topic: 'sentence-helper',
      }),
    });
  });

  it('returns 409 if the word already exists', async () => {
    (getDataSnapshot as jest.Mock).mockResolvedValue([
      { baseForm: '準軍事組織', surfaceForm: '準軍事組織' },
    ]);

    await addImprovWordRoute(mockReq as Request, mockRes as Response);

    expect(addSentencesBulk).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Word already exists' });
  });

  it('returns 400 when inquiry is missing', async () => {
    mockReq.body = { language: japanese };

    await addImprovWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(deepSeekChatAPI).not.toHaveBeenCalled();
  });

  it('returns 400 when language is invalid', async () => {
    mockReq.body = { language: 'spanish', inquiry: 'hello' };

    await addImprovWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('returns 500 if the AI payload is malformed', async () => {
    (deepSeekChatAPI as jest.Mock).mockResolvedValue({ word: {} });

    await addImprovWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error:
        'Improv AI result missing word (baseForm/surfaceForm/definition) or sentence (targetLang/baseLang)',
    });
  });

  it('returns 500 if TTS fails', async () => {
    (synthesizeSpeech as jest.Mock).mockRejectedValue(
      new Error('Error uploading audio file for japanese'),
    );

    await addImprovWordRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error uploading audio file for japanese',
    });
  });
});

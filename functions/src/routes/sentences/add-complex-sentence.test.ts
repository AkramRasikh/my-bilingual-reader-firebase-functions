import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { deepSeekChatAPI } from '../../ai-utils';
import { db } from '../../db';
import { addSentencesBulk } from '../../firebase-utils/add-sentences-bulk';
import { japanese } from '../../language-keys';
import { synthesizeSpeech } from '../text-to-speech';
import { buildComplexSentencePrompt } from './add-complex-sentence-prompt';
import {
  addComplexSentenceRoute,
  parseComplexSentenceResult,
} from './add-complex-sentence';
import { GRAMMAR_CATEGORIES } from './complex-sentence-grammar';

jest.mock('../../ai-utils', () => ({
  deepSeekChatAPI: jest.fn(),
}));
jest.mock('../../db', () => ({
  db: { ref: jest.fn() },
}));
jest.mock('../../firebase-utils/add-sentences-bulk', () => ({
  addSentencesBulk: jest.fn(),
}));
jest.mock('../text-to-speech', () => ({
  synthesizeSpeech: jest.fn(),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));
jest.mock('../../srs-utils', () => ({
  getInitSentenceCard: jest.fn(() => ({ due: '2026-01-01T00:00:00.000Z' })),
}));

const word = {
  surfaceForm: '信じる',
  baseForm: '信じる',
  definition: 'to believe',
  localContext: '彼はそれを信じている。',
};

const aiResult = {
  targetLang: '昨日の話にもかかわらず、彼はまだ信じている。',
  baseLang: 'Despite yesterday’s conversation, he still believes it.',
  transliteration: 'Kinō no hanashi ni mo kakawarazu, kare wa mada shinjite iru.',
  notes: 'Uses a concessive phrase.',
  vocab: [
    {
      surfaceForm: '昨日の話',
      meaning: "yesterday's conversation",
      transliteration: 'kinō no hanashi',
    },
    {
      surfaceForm: 'にもかかわらず',
      meaning: 'despite',
      transliteration: 'ni mo kakawarazu',
    },
    { surfaceForm: '彼は', meaning: 'he', transliteration: 'kare wa' },
    { surfaceForm: 'まだ', meaning: 'still', transliteration: 'mada' },
    {
      surfaceForm: '信じている',
      meaning: 'believes',
      transliteration: 'shinjite iru',
    },
  ],
  sentenceStructure:
    '昨日の話 (yesterday\'s conversation) + にもかかわらず (despite) + 彼は (he) + まだ (still) + 信じている (believes)',
  meaning: 'Despite yesterday’s conversation, he still believes it.',
};

const validBody = {
  language: japanese,
  words: [word],
};

describe('buildComplexSentencePrompt', () => {
  it('treats an omitted config as auto for every category', () => {
    const prompt = buildComplexSentencePrompt({
      language: japanese,
      words: [word],
    });

    for (const category of GRAMMAR_CATEGORIES) {
      expect(prompt).toContain(`${category}: auto`);
    }
    expect(prompt).toContain('Difficulty: advanced');
    expect(prompt).toContain('Selection mode: auto');
    expect(prompt).toContain('Romaji: auto');
    expect(prompt).not.toMatch(/informal speech/i);
  });

  it('tells the model to use a coherent subset and does not ask about skipped words', () => {
    const prompt = buildComplexSentencePrompt({
      language: 'french',
      words: [word, { ...word, surfaceForm: 'hier', baseForm: 'hier' }],
    });

    expect(prompt).toContain('coherent subset');
    expect(prompt).toContain('Do not force every item into the sentence');
    expect(prompt).not.toMatch(/skipped/i);
  });

  it('asks for Hepburn with macrons in Japanese and romanization in other languages', () => {
    const japanesePrompt = buildComplexSentencePrompt({
      language: japanese,
      words: [word],
    });
    const frenchPrompt = buildComplexSentencePrompt({
      language: 'french',
      words: [word],
    });

    expect(japanesePrompt).toContain('Hepburn');
    expect(japanesePrompt).toContain('macrons');
    expect(japanesePrompt).toContain(
      '"transliteration": "romanization of this token"',
    );
    expect(frenchPrompt).toContain('consistent romanization of the complete french sentence');
    expect(frenchPrompt).not.toContain('Hepburn');
    expect(frenchPrompt).toContain(
      'Do not add a transliteration field to vocab items',
    );
    expect(frenchPrompt).not.toContain(
      '"transliteration": "romanization of this token"',
    );
  });

  it('keeps explicit true and false settings and leaves the rest on auto', () => {
    const prompt = buildComplexSentencePrompt({
      language: japanese,
      words: [word],
      config: {
        conditionals: false,
        clauseEmbedding: true,
      },
    });

    expect(prompt).toContain('conditionals: false');
    expect(prompt).toContain('clauseEmbedding: true');
    expect(prompt).toContain('mood: auto');
  });

  it('asks for the same breakdown fields as a broken-down sentence', () => {
    const prompt = buildComplexSentencePrompt({
      language: japanese,
      words: [word],
    });

    expect(prompt).toContain('entire targetLang');
    expect(prompt).toContain('not only the supplied study items');
    expect(prompt).toContain('"vocab"');
    expect(prompt).toContain('"surfaceForm"');
    expect(prompt).toContain('"sentenceStructure"');
    expect(prompt).toContain('"meaning"');
    expect(prompt).toContain('word (meaning) + word (meaning)');
  });
});

describe('parseComplexSentenceResult', () => {
  it('requires the target sentence, English translation, and transliteration', () => {
    expect(() =>
      parseComplexSentenceResult({ targetLang: '文', baseLang: 'A sentence' }),
    ).toThrow(/transliteration/);
  });

  it('requires vocab, sentence structure, and the full-sentence meaning', () => {
    expect(() =>
      parseComplexSentenceResult({
        targetLang: '文',
        baseLang: 'A sentence',
        transliteration: 'bun',
      }),
    ).toThrow(/vocab/);
  });

  it('rejects vocab that covers only some of the target sentence', () => {
    expect(() =>
      parseComplexSentenceResult(
        {
          ...aiResult,
          vocab: [aiResult.vocab[0]],
        },
        'japanese',
      ),
    ).toThrow(/targetLang/);
  });

  it('requires a transliteration on each vocab item', () => {
    expect(() =>
      parseComplexSentenceResult(
        {
          ...aiResult,
          vocab: [{ surfaceForm: '文', meaning: 'sentence' }],
        },
        'japanese',
      ),
    ).toThrow(/vocab transliteration/);
  });

  it('omits vocab transliteration for french', () => {
    const parsed = parseComplexSentenceResult(
      {
        ...aiResult,
        vocab: aiResult.vocab.map((item) => ({
          ...item,
          transliteration: 'should-drop',
        })),
      },
      'french',
    );

    expect(parsed.vocab[0]).toEqual({
      surfaceForm: '昨日の話',
      meaning: "yesterday's conversation",
    });
    expect(parsed.vocab[0]).not.toHaveProperty('transliteration');
  });
});

describe('addComplexSentenceRoute', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let setMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockReq = { body: { ...validBody, words: [{ ...word }] } };
    setMock = jest.fn().mockResolvedValue(null);

    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('sentence-id-1');
    (deepSeekChatAPI as jest.Mock).mockResolvedValue(aiResult);
    (synthesizeSpeech as jest.Mock).mockResolvedValue('audio/sentence-id-1.mp3');
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });
  });

  it('returns 400 when the language is invalid', async () => {
    mockReq.body = { ...validBody, language: 'spanish' };

    await addComplexSentenceRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(deepSeekChatAPI).not.toHaveBeenCalled();
    expect(db.ref).not.toHaveBeenCalled();
  });

  it('returns 400 when the word list is empty', async () => {
    mockReq.body = { language: japanese, words: [] };

    await addComplexSentenceRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(deepSeekChatAPI).not.toHaveBeenCalled();
  });

  it('returns 400 when a word is missing a required field', async () => {
    mockReq.body = {
      language: japanese,
      words: [{ surfaceForm: '信じる', baseForm: '信じる', localContext: '' }],
    };

    await addComplexSentenceRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(deepSeekChatAPI).not.toHaveBeenCalled();
  });

  it('allows an empty localContext string', async () => {
    mockReq.body = {
      language: japanese,
      words: [{ ...word, localContext: '' }],
    };

    await addComplexSentenceRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('saves one ID-keyed sentence and does not append an array', async () => {
    mockReq.body = {
      ...validBody,
      notes: '  keep the concessive sense  ',
    };

    await addComplexSentenceRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).toHaveBeenCalledWith('japanese/sentences/sentence-id-1');
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sentence-id-1',
        topic: 'sentence-helper',
        hasAudio: true,
        targetLang: aiResult.targetLang,
        baseLang: aiResult.baseLang,
        transliteration: aiResult.transliteration,
        notes: aiResult.notes,
        inquiry: 'keep the concessive sense',
        vocab: aiResult.vocab,
        sentenceStructure: aiResult.sentenceStructure,
        meaning: aiResult.meaning,
      }),
    );
    expect(addSentencesBulk).not.toHaveBeenCalled();
    expect(synthesizeSpeech).toHaveBeenCalledWith({
      id: 'sentence-id-1',
      text: aiResult.targetLang,
      language: japanese,
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    const prompt = (deepSeekChatAPI as jest.Mock).mock.calls[0][0].sentence;
    expect(prompt).not.toMatch(/skipped/i);
  });

  it('omits inquiry when the caller sends no notes', async () => {
    await addComplexSentenceRoute(mockReq as Request, mockRes as Response);

    const saved = setMock.mock.calls[0][0];
    expect(saved.inquiry).toBeUndefined();
    expect(saved.notes).toBe(aiResult.notes);
  });

  it('returns 500 when the model result is incomplete', async () => {
    (deepSeekChatAPI as jest.Mock).mockResolvedValue({ targetLang: '文' });

    await addComplexSentenceRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(db.ref).not.toHaveBeenCalled();
  });
});

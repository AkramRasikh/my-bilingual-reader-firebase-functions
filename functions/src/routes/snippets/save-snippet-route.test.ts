import { Request, Response } from 'express';
import { db } from '../../db';
import { saveSnippetRoute } from './save-snippet';

jest.mock('../../db');

describe('saveSnippetRoute', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      body: {
        language: 'japanese',
        contentId: 'content-123',
        snippetData: {
          id: 'snippet-456',
          baseLang: 'Hello world',
          targetLang: 'こんにちは世界',
          time: 5.5,
        },
      },
    };

    mockRes = {
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  it('should save a snippet successfully and return 200', async () => {
    const setMock = jest.fn().mockResolvedValue(undefined);
    const refMock = jest.fn().mockReturnValue({ set: setMock });
    (db.ref as jest.Mock).mockReturnValue(refMock());

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(setMock).toHaveBeenCalledWith({
      id: 'snippet-456',
      baseLang: 'Hello world',
      targetLang: 'こんにちは世界',
      time: 5.5,
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: 'snippet-456',
      baseLang: 'Hello world',
      targetLang: 'こんにちは世界',
      time: 5.5,
    });
  });

  it('should save snippet with all optional fields', async () => {
    mockReq.body.snippetData = {
      id: 'snippet-full',
      baseLang: 'Complete',
      targetLang: '完全',
      time: 10.5,
      focusedText: 'Focus here',
      isContracted: true,
      isPreSnippet: false,
      suggestedFocusText: 'Suggested',
      reviewData: {
        difficulty: 5,
        due: new Date('2026-02-01'),
        ease: 2.5,
        elapsed_days: 1,
        interval: 3,
        lapses: 0,
        last_review: new Date('2026-01-26'),
        reps: 1,
        scheduled_days: 3,
        stability: 2.0,
        state: 1,
      },
    };

    const setMock = jest.fn().mockResolvedValue(undefined);
    const refMock = jest.fn().mockReturnValue({ set: setMock });
    (db.ref as jest.Mock).mockReturnValue(refMock());

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'snippet-full',
        focusedText: 'Focus here',
        reviewData: expect.any(Object),
      }),
    );
  });

  describe('sentence snippets', () => {
    const sentenceSnippet = {
      id: 'clip-1',
      baseLang: 'It is Japanese',
      targetLang: '日本語です',
      time: 64.95,
      isPreSnippet: false,
      sentenceId: 'sentence-1',
      start: 64.5,
      end: 65.4,
      origin: 'sentence',
    };
    const mockWrite = () => {
      const setMock = jest.fn().mockResolvedValue(undefined);
      (db.ref as jest.Mock).mockReturnValue({ set: setMock });
      return setMock;
    };
    const expect400 = () => {
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.any(Array) }),
      );
    };

    it('saves a clip nested in a sentence with its edges', async () => {
      const setMock = mockWrite();
      mockReq.body.snippetData = sentenceSnippet;

      await saveSnippetRoute(mockReq as Request, mockRes as Response);

      expect(setMock).toHaveBeenCalledWith(sentenceSnippet);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('rejects a clip missing some of the sentence fields', async () => {
      const setMock = mockWrite();
      const { end, ...partial } = sentenceSnippet;
      mockReq.body.snippetData = partial;

      await saveSnippetRoute(mockReq as Request, mockRes as Response);

      expect400();
      expect(setMock).not.toHaveBeenCalled();
    });

    it('rejects a clip whose end is not after its start', async () => {
      const setMock = mockWrite();
      mockReq.body.snippetData = { ...sentenceSnippet, end: 64.5 };

      await saveSnippetRoute(mockReq as Request, mockRes as Response);

      expect400();
      expect(setMock).not.toHaveBeenCalled();
    });

    it('rejects an unknown origin', async () => {
      const setMock = mockWrite();
      mockReq.body.snippetData = { ...sentenceSnippet, origin: 'other' };

      await saveSnippetRoute(mockReq as Request, mockRes as Response);

      expect400();
      expect(setMock).not.toHaveBeenCalled();
    });
  });

  it('should return 500 if database write fails', async () => {
    const setMock = jest
      .fn()
      .mockRejectedValue(new Error('Database write failed'));
    const refMock = jest.fn().mockReturnValue({ set: setMock });
    (db.ref as jest.Mock).mockReturnValue(refMock());

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Database write failed',
    });
  });

  it('should return 400 when language is missing', async () => {
    mockReq.body.language = undefined;

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when language is invalid', async () => {
    mockReq.body.language = 'invalid-language';

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when contentId is missing', async () => {
    mockReq.body.contentId = undefined;

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetData is missing', async () => {
    mockReq.body.snippetData = undefined;

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetData.id is missing', async () => {
    mockReq.body.snippetData = {
      baseLang: 'Hello',
      targetLang: 'こんにちは',
      time: 5.0,
    };

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetData.baseLang is missing', async () => {
    mockReq.body.snippetData = {
      id: 'snippet-123',
      targetLang: 'こんにちは',
      time: 5.0,
    };

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetData.targetLang is missing', async () => {
    mockReq.body.snippetData = {
      id: 'snippet-123',
      baseLang: 'Hello',
      time: 5.0,
    };

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetData.time is missing', async () => {
    mockReq.body.snippetData = {
      id: 'snippet-123',
      baseLang: 'Hello',
      targetLang: 'こんにちは',
    };

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetData.time is not a number', async () => {
    mockReq.body.snippetData = {
      id: 'snippet-123',
      baseLang: 'Hello',
      targetLang: 'こんにちは',
      time: 'not-a-number',
    };

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when request body contains unexpected fields', async () => {
    mockReq.body = {
      language: 'japanese',
      contentId: 'content-123',
      snippetData: {
        id: 'snippet-456',
        baseLang: 'Hello world',
        targetLang: 'こんにちは世界',
        time: 5.5,
      },
      unexpectedField: 'should not be here',
      anotherBadField: 'also bad',
    };

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Unexpected fields'),
          }),
        ]),
      }),
    );
  });

  it('should return 400 when snippetData contains unexpected fields', async () => {
    mockReq.body = {
      language: 'japanese',
      contentId: 'content-123',
      snippetData: {
        id: 'snippet-456',
        baseLang: 'Hello world',
        targetLang: 'こんにちは世界',
        time: 5.5,
        maliciousField: 'injected data',
        extraProperty: 'not allowed',
      },
    };

    await saveSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Unexpected snippetData fields'),
          }),
        ]),
      }),
    );
  });
});

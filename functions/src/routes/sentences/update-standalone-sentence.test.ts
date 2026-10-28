import { Request, Response } from 'express';

import { db } from '../../db';
import { japanese } from '../../language-keys';
import { deleteAssetFromCloudFlare } from '../../firebase-utils/delete-asset-from-cloudflare';
import { updateStandaloneSentenceRoute } from './update-standalone-sentence';

jest.mock('../../db', () => ({
  db: { ref: jest.fn() },
}));
jest.mock('../../firebase-utils/delete-asset-from-cloudflare', () => ({
  deleteAssetFromCloudFlare: jest.fn(),
}));

const sentenceId = 'sentence-id-1';

describe('updateStandaloneSentenceRoute', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let updateMock: jest.Mock;
  let removeMock: jest.Mock;
  let onceMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
    updateMock = jest.fn().mockResolvedValue(null);
    removeMock = jest.fn().mockResolvedValue(null);
    onceMock = jest.fn().mockResolvedValue({ exists: () => true });
    jest.clearAllMocks();
    (db.ref as jest.Mock).mockReturnValue({
      once: onceMock,
      update: updateMock,
      remove: removeMock,
    });
    (deleteAssetFromCloudFlare as jest.Mock).mockResolvedValue(null);
    mockReq = {
      body: {
        id: sentenceId,
        language: japanese,
        fieldToUpdate: {
          targetLang: '新しい文',
          baseLang: 'A new sentence',
          notes: 'edited',
          sentenceStructure: '新しい (new) + 文 (sentence)',
          meaning: 'A new sentence.',
          vocab: [{ surfaceForm: '新しい', meaning: 'new' }],
        },
      },
    };
  });

  it('updates only that sentence key', async () => {
    await updateStandaloneSentenceRoute(
      mockReq as Request,
      mockRes as Response,
    );

    expect(db.ref).toHaveBeenCalledWith('japanese/sentences/sentence-id-1');
    expect(db.ref).not.toHaveBeenCalledWith('japanese/sentences');
    expect(updateMock).toHaveBeenCalledWith({
      targetLang: '新しい文',
      baseLang: 'A new sentence',
      notes: 'edited',
      sentenceStructure: '新しい (new) + 文 (sentence)',
      meaning: 'A new sentence.',
      vocab: [{ surfaceForm: '新しい', meaning: 'new' }],
    });
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('clears review data the same way a content sentence does', async () => {
    mockReq.body.fieldToUpdate = {
      removeReview: true,
      reviewData: { due: '2026-01-01T00:00:00.000Z', reps: 2 },
    };

    await updateStandaloneSentenceRoute(
      mockReq as Request,
      mockRes as Response,
    );

    expect(updateMock).toHaveBeenCalledWith({ reviewData: null });
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('writes review data onto that sentence key', async () => {
    const reviewData = {
      due: '2026-04-29T19:56:54.008Z',
      reps: 3,
      interval: 4,
    };
    mockReq.body.fieldToUpdate = { reviewData };

    await updateStandaloneSentenceRoute(
      mockReq as Request,
      mockRes as Response,
    );

    expect(updateMock).toHaveBeenCalledWith({ reviewData });
  });

  it('deletes that sentence key and its audio', async () => {
    mockReq.body = { id: sentenceId, language: japanese, delete: true };

    await updateStandaloneSentenceRoute(
      mockReq as Request,
      mockRes as Response,
    );

    expect(db.ref).toHaveBeenCalledWith('japanese/sentences/sentence-id-1');
    expect(db.ref).not.toHaveBeenCalledWith('japanese/sentences');
    expect(removeMock).toHaveBeenCalled();
    expect(deleteAssetFromCloudFlare).toHaveBeenCalledWith(
      'japanese-audio/sentence-id-1.mp3',
    );
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Sentence deleted successfully.',
      id: sentenceId,
    });
  });

  it('returns 404 when the sentence key is missing', async () => {
    onceMock.mockResolvedValue({ exists: () => false });

    await updateStandaloneSentenceRoute(
      mockReq as Request,
      mockRes as Response,
    );

    expect(updateMock).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('returns 400 when no sentence field is supplied', async () => {
    mockReq.body = { id: sentenceId, language: japanese, fieldToUpdate: {} };

    await updateStandaloneSentenceRoute(
      mockReq as Request,
      mockRes as Response,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(db.ref).not.toHaveBeenCalled();
  });
});

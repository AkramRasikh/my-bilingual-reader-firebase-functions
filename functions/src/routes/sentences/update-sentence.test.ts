import { Request, Response } from 'express';

import { db } from '../../db';
import { updateSentenceRoute } from './update-sentence';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';

jest.mock('../../db');
jest.mock('../../firebase-utils/get-data-snapshot');

// add delete functionality
// currently just passing reviewData: {} deletes the review
const mockContentForSentenceUpdate = [
  {
    content: [
      {
        baseLang: '? Actually, this is not Malaysia,',
        id: '68170de1-0ad4-4486-8cba-d06528fc2206',
        targetLang: '国内这个其实啊，这个不是马来西亚',
        time: 0,
      },
      {
        baseLang: 'this is a Muslim. . He has this doctrine',
        id: '2b57b65e-9b31-4a49-90b7-0bba9e7e386c',
        targetLang: '这是穆斯林. 他有这个教义上',
        time: 3,
      },
    ],
    title: 'huimin-marriage-miya-4',
    hasAudio: true,
    hasVideo: true,
    interval: 60,
    nextReview: '2025-04-15T15:28:21.897Z',
    origin: 'youtube',
    realStartTime: 180,
    reviewHistory: ['2025-04-12T15:28:23.145Z'],
  },
];
const mockContentForSentenceUpdateWithUndefinded = [
  {
    content: [
      undefined,
      {
        baseLang: '? Actually, this is not Malaysia,',
        id: '68170de1-0ad4-4486-8cba-d06528fc2206',
        targetLang: '国内这个其实啊，这个不是马来西亚',
        time: 0,
      },
      {
        baseLang: 'this is a Muslim. . He has this doctrine',
        id: '2b57b65e-9b31-4a49-90b7-0bba9e7e386c',
        targetLang: '这是穆斯林. 他有这个教义上',
        time: 3,
      },
    ],
    title: 'huimin-marriage-miya-4',
    hasAudio: true,
    hasVideo: true,
    interval: 60,
    nextReview: '2025-04-15T15:28:21.897Z',
    origin: 'youtube',
    realStartTime: 180,
    reviewHistory: ['2025-04-12T15:28:23.145Z'],
  },
];
const updateReviewData = {
  reviewData: {
    due: '2026-04-29T19:56:54.008Z',
  },
};

describe('updateSentenceRoute', () => {
  let mockReq: Partial<Request>;
  let mockReqReviewData: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      body: {
        id: '68170de1-0ad4-4486-8cba-d06528fc2206',
        title: 'huimin-marriage-miya-4',
        language: 'chinese',
        fieldToUpdate: { targetLang: '新目标语言' },
      },
    };

    mockReqReviewData = {
      body: {
        id: '68170de1-0ad4-4486-8cba-d06528fc2206',
        title: 'huimin-marriage-miya-4',
        language: 'chinese',
        fieldToUpdate: { ...updateReviewData },
      },
    };

    mockRes = {
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  it('should update a sentence successfully', async () => {
    // getDataSnapshot returns content mock
    (getDataSnapshot as jest.Mock).mockResolvedValue(
      mockContentForSentenceUpdate,
    );

    const updateMock = jest.fn().mockResolvedValue(undefined);
    const childMock = jest.fn().mockReturnValue({ update: updateMock });
    (db.ref as jest.Mock).mockReturnValue({ child: childMock });

    await updateSentenceRoute(mockReq as Request, mockRes as Response);

    expect(updateMock).toHaveBeenCalledWith({ targetLang: '新目标语言' });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ targetLang: '新目标语言' });
  });
  it('should update a sentence successfully (reviewData)', async () => {
    // getDataSnapshot returns content mock
    (getDataSnapshot as jest.Mock).mockResolvedValue(
      mockContentForSentenceUpdate,
    );

    const updateMock = jest.fn().mockResolvedValue(undefined);
    const childMock = jest.fn().mockReturnValue({ update: updateMock });
    (db.ref as jest.Mock).mockReturnValue({ child: childMock });

    await updateSentenceRoute(
      mockReqReviewData as Request,
      mockRes as Response,
    );

    expect(updateMock).toHaveBeenCalledWith(updateReviewData);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(updateReviewData);
  });

  it('should update a sentence successfully (with corrupt content file- null/undefined)', async () => {
    // getDataSnapshot returns content mock
    (getDataSnapshot as jest.Mock).mockResolvedValue(
      mockContentForSentenceUpdateWithUndefinded,
    );

    // db.ref().child().update() chain
    const updateMock = jest.fn().mockResolvedValue(undefined);
    const childMock = jest.fn().mockReturnValue({ update: updateMock });
    (db.ref as jest.Mock).mockReturnValue({ child: childMock });

    await updateSentenceRoute(mockReq as Request, mockRes as Response);

    expect(updateMock).toHaveBeenCalledWith({ targetLang: '新目标语言' });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      targetLang: '新目标语言',
    });
  });

  it('should return 500 if sentence not found', async () => {
    mockReq.body.id = 'non-existent-id';

    (getDataSnapshot as jest.Mock).mockResolvedValue(
      mockContentForSentenceUpdate,
    );

    const updateMock = jest.fn();
    const childMock = jest.fn().mockReturnValue({ update: updateMock });
    (db.ref as jest.Mock).mockReturnValue({ child: childMock });

    await updateSentenceRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock.mock.calls[0][0].error).toMatch(
      /cannot find sentence index/i,
    );
  });

  it('should return 500 if db update fails', async () => {
    (getDataSnapshot as jest.Mock).mockResolvedValue(
      mockContentForSentenceUpdate,
    );

    const updateMock = jest.fn().mockRejectedValue(new Error('Firebase error'));
    const childMock = jest.fn().mockReturnValue({ update: updateMock });
    (db.ref as jest.Mock).mockReturnValue({ child: childMock });

    await updateSentenceRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error: Firebase error',
    });
  });
});

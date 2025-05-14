import { Request, Response } from 'express';
import { db } from '../../db';
import { addSnippetRoute } from './add-snippet';
import { arabic } from '../../language-keys';

jest.mock('../../db');

describe('addSnippetRoute', () => {
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
        language: arabic,
        snippet: {
          id: '12345',
          sentenceId: '56789',
          duration: 10,
          pointInAudio: 5,
          topicName: 'Test Topic',
          url: 'http://example.com/audio.mp3',
        },
      },
    };

    jest.clearAllMocks();
  });

  it('should add a snippet if it does not exist', async () => {
    // Mock db.ref().set() to avoid actual database interaction
    const setMock = jest.fn().mockResolvedValue(null);
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    // Mock getDataSnapshot to return an empty array (no duplicates)
    jest
      .spyOn(
        require('../../firebase-utils/get-data-snapshot'),
        'getDataSnapshot',
      )
      .mockResolvedValueOnce([]);

    await addSnippetRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).toHaveBeenCalledWith('arabic/snippets');
    expect(setMock).toHaveBeenCalledWith([mockReq.body.snippet]);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockReq.body.snippet);
  });

  it('should return a 500 status when there is a duplicate snippet', async () => {
    // Mock getDataSnapshot to return a list with a duplicate snippet
    jest
      .spyOn(
        require('../../firebase-utils/get-data-snapshot'),
        'getDataSnapshot',
      )
      .mockResolvedValueOnce([
        {
          id: '12345',
          sentenceId: '56789',
          duration: 10,
          pointInAudio: 5,
          topicName: 'Test Topic',
          url: 'http://example.com/audio.mp3',
        },
      ]);

    await addSnippetRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error snippet already exists arabic',
    });
  });

  it('should handle unexpected errors and respond with 500', async () => {
    const setMock = jest.fn().mockRejectedValue(new Error());
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    await addSnippetRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).toHaveBeenCalledWith('arabic/snippets');
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error getting snapshot of snippets for arabic',
    });
  });
});

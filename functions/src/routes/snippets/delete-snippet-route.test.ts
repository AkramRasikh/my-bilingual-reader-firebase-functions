import { Request, Response } from 'express';
import { db } from '../../db';
import { deleteSnippetRoute } from './delete-snippet';

jest.mock('../../db');

describe('deleteSnippetRoute', () => {
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
        snippetId: 'snippet-456',
      },
    };

    mockRes = {
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  it('should delete a snippet successfully and return 200', async () => {
    const removeMock = jest.fn().mockResolvedValue(undefined);
    const refMock = jest.fn().mockReturnValue({ remove: removeMock });
    (db.ref as jest.Mock).mockReturnValue(refMock());

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(removeMock).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Snippet deleted successfully',
    });
  });

  it('should return 500 if database delete fails', async () => {
    const removeMock = jest
      .fn()
      .mockRejectedValue(new Error('Database delete failed'));
    const refMock = jest.fn().mockReturnValue({ remove: removeMock });
    (db.ref as jest.Mock).mockReturnValue(refMock());

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Database delete failed',
    });
  });

  it('should return 400 when language is missing', async () => {
    mockReq.body.language = undefined;

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when language is invalid', async () => {
    mockReq.body.language = 'invalid-language';

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when contentId is missing', async () => {
    mockReq.body.contentId = undefined;

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when contentId is not a string', async () => {
    mockReq.body.contentId = 123;

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetId is missing', async () => {
    mockReq.body.snippetId = undefined;

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      }),
    );
  });

  it('should return 400 when snippetId is not a string', async () => {
    mockReq.body.snippetId = 456;

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

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
      snippetId: 'snippet-456',
      unexpectedField: 'should not be here',
      anotherBadField: 'also bad',
    };

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

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
});

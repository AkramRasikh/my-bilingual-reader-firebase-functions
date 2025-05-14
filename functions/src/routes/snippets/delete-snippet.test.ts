import { Request, Response } from 'express';
import { db } from '../../db';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { deleteSnippetRoute } from './delete-snippet';

jest.mock('../../db'); // Mock the entire db module

describe('deleteSnippetRoute', () => {
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
        language: 'japanese', // Use any of "arabic", "japanese", "chinese"
        id: '12345',
      },
    };

    jest.clearAllMocks();
  });

  it('should delete the snippet successfully', async () => {
    // Mocked snapshot data containing the snippet to be deleted
    const existingSnippets = [
      { id: '12345', text: 'Sample text' },
      { id: '67890', text: 'Another text' },
    ];

    // Mock getDataSnapshot to return the existing snippets
    (getDataSnapshot as jest.Mock) = jest
      .fn()
      .mockResolvedValue(existingSnippets);

    // Mock db.ref().set() to simulate a successful update
    const setMock = jest.fn().mockResolvedValue(null);
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).toHaveBeenCalledWith('japanese/snippets');
    expect(setMock).toHaveBeenCalledWith([
      { id: '67890', text: 'Another text' },
    ]);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ snippetId: '12345' });
  });

  xit('should return 500 if the snippet is not found', async () => {
    // no need to update if none found but think about this case
    (getDataSnapshot as jest.Mock) = jest.fn().mockResolvedValue([]);

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).not.toHaveBeenCalled(); // No need to update if not found
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error deleting snippet for japanese',
    });
  });

  it('should return 500 if db.ref().set() fails', async () => {
    // Mock getDataSnapshot to return snippets
    (getDataSnapshot as jest.Mock) = jest.fn().mockResolvedValue([
      { id: '12345', text: 'Sample text' },
      { id: '67890', text: 'Another text' },
    ]);

    // Mock db.ref().set() to throw an error
    const setMock = jest.fn().mockRejectedValue(new Error('Database error'));
    (db.ref as jest.Mock).mockReturnValue({ set: setMock });

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).toHaveBeenCalledWith('japanese/snippets');
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error deleting snippet for japanese',
    });
  });

  it('should return 500 if getDataSnapshot fails', async () => {
    // Mock getDataSnapshot to throw an error
    (getDataSnapshot as jest.Mock) = jest
      .fn()
      .mockRejectedValue(new Error('Snapshot error'));

    await deleteSnippetRoute(mockReq as Request, mockRes as Response);

    expect(db.ref).not.toHaveBeenCalled(); // No update attempt on failure
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error deleting snippet for japanese',
    });
  });
});

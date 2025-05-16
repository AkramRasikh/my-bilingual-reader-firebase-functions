import { Request, Response } from 'express';
import { removeItemFromSnapshot } from '../../firebase-utils/remove-item-from-snapshot';
import { deleteWordRoute } from './delete-word';
import { arabic } from '../../language-keys';

jest.mock('../../firebase-utils/remove-item-from-snapshot');

describe('deleteWordRoute', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { body: { id: '123', language: arabic } };
    res = { status: statusMock };
    jest.clearAllMocks();
  });

  it('should successfully delete a word and return the id', async () => {
    (removeItemFromSnapshot as jest.Mock).mockResolvedValue('123');

    await deleteWordRoute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ id: '123' });
  });

  it('should return 500 if deletion fails', async () => {
    (removeItemFromSnapshot as jest.Mock).mockRejectedValue(
      new Error('Deletion failed'),
    );

    await deleteWordRoute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Deletion failed' });
  });

  it('should return 404 if word to delete is not found', async () => {
    (removeItemFromSnapshot as jest.Mock).mockResolvedValue(null); // not found

    await deleteWordRoute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Word not found',
    });
  });
});

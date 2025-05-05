import { onLoadDataRoute } from './index';
import functions from 'firebase-functions-test';

// Initialize Firebase functions test
const test = functions();

describe('onLoadDataRoute', () => {
  afterEach(() => {
    test.cleanup();
  });

  it.only('should return 200 when valid data is sent', async () => {
    const req = {
      body: {
        refs: ['snippets'],
        language: 'chinese',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await onLoadDataRoute(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should return 400 when refs is empty', async () => {
    const req = {
      body: {
        refs: [],
        language: 'en',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await onLoadDataRoute(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: expect.any(Array) });
  });
});

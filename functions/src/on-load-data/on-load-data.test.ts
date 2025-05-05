import { onLoadDataRoute } from './index';
import functions from 'firebase-functions-test';

// Initialize Firebase functions test
const test = functions();

describe('onLoadDataRoute', () => {
  afterEach(() => {
    test.cleanup();
  });

  it('should return 200 when valid data is sent', async () => {
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

  describe('onLoadDataRoute validation', () => {
    const mockResponse = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('should return 400 when refs is empty', async () => {
      const req = {
        body: {
          refs: [],
          language: 'chinese',
        },
      };

      const res = mockResponse();
      await onLoadDataRoute(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.any(Array) }),
      );
    });

    it('should return 400 when refs has invalid value', async () => {
      const req = {
        body: {
          refs: ['invalid-ref'],
          language: 'chinese',
        },
      };

      const res = mockResponse();
      await onLoadDataRoute(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.any(Array) }),
      );
    });

    it('should return 400 when language is invalid', async () => {
      const req = {
        body: {
          refs: ['snippets'],
          language: 'french',
        },
      };

      const res = mockResponse();
      await onLoadDataRoute(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.any(Array) }),
      );
    });

    it('should return 400 when language is missing', async () => {
      const req = {
        body: {
          refs: ['snippets'],
        },
      };

      const res = mockResponse();
      await onLoadDataRoute(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.any(Array) }),
      );
    });

    it('should return 200 when refs and language are valid', async () => {
      const req = {
        body: {
          refs: ['snippets', 'words'],
          language: 'chinese',
        },
      };

      const res = mockResponse();
      await onLoadDataRoute(req as any, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });
});

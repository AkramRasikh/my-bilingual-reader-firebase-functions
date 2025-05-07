import * as getFirebaseContentTypeService from '../firebase-utils/get-firebase-content-type';
import { onLoadDataRoute } from './index';
import functions from 'firebase-functions-test';

const test = functions();

// test the keys returned [content, songs, etc]
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

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

  describe('onLoadDataRoute validation error (400)', () => {
    it('refs is empty', async () => {
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

    it('refs has invalid value', async () => {
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

    it('language is invalid', async () => {
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

    it('language is missing', async () => {
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
  });

  // can go deeper but this level is fine for now
  it('should return 400 when getFirebaseContentType throws', async () => {
    const errMsg = 'Error fetching snippets for chinese';

    const req = {
      body: {
        refs: ['snippets'],
        language: 'chinese',
      },
    };

    const res = mockResponse();

    jest
      .spyOn(getFirebaseContentTypeService, 'getFirebaseContentType')
      .mockRejectedValueOnce(new Error());

    await onLoadDataRoute(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: errMsg,
    });
  });
});

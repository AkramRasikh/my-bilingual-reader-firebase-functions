import { Request, Response } from 'express';
import { translationClient } from './translation-service-client';
import { pinyin } from 'pinyin-pro';

import { translateTextRoute } from '.';
import { chinese, japanese } from '../language-keys';

jest.mock('./translation-service-client');
jest.mock('pinyin-pro');

const mockRequest = (body: any): Partial<Request> => ({ body });
const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

describe('translateTextRoute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should translate and transliterate Chinese text', async () => {
    const req = mockRequest({ text: '你好', language: chinese });
    const res = mockResponse();

    (pinyin as jest.Mock).mockReturnValue('ni hao');
    (translationClient.translateText as jest.Mock).mockResolvedValue([
      { translations: [{ translatedText: 'Hello' }] },
    ]);

    await translateTextRoute(req as Request, res as Response);

    expect(pinyin).toHaveBeenCalledWith('你好');
    expect(translationClient.romanizeText).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      translation: 'Hello',
      transliteration: 'ni hao',
    });
  });

  it('should translate and romanize non-Chinese (Japanese) text', async () => {
    const req = mockRequest({ text: 'こんにちは', language: japanese });
    const res = mockResponse();

    (translationClient.translateText as jest.Mock).mockResolvedValue([
      { translations: [{ translatedText: 'Hello' }] },
    ]);
    (translationClient.romanizeText as jest.Mock).mockResolvedValue([
      { romanizations: [{ romanizedText: 'konnichiwa' }] },
    ]);

    await translateTextRoute(req as Request, res as Response);

    expect(translationClient.romanizeText).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      translation: 'Hello',
      transliteration: 'konnichiwa',
    });
  });

  it('should handle translation errors', async () => {
    const req = mockRequest({ text: 'text', language: chinese });
    const res = mockResponse();

    (translationClient.translateText as jest.Mock).mockRejectedValue(
      new Error('Translation error'),
    );

    await translateTextRoute(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Translation error' });
  });
});

import { Request, Response } from 'express';
import { textToSpeechRoute } from './';
import { japanese } from '../language-keys';
import { textToSpeechClient } from '../service-clients/text-to-speech-client';
import { uploadAudioFileToFirebase } from '../firebase-utils/upload-audio-file-to-firebase';

jest.mock('../service-clients/text-to-speech-client');
jest.mock('../firebase-utils/upload-audio-file-to-firebase');

const mockAudioContent = Buffer.from([
  0xff, 0xf3, 0x84, 0xc4, 0x00, 0x00, 0x00,
]);

const mockSynthesize = [
  {
    audioContent: mockAudioContent,
  },
];

describe('textToSpeechRoute', () => {
  const mockUrl = 'https://example.com/audio.mp3';
  const mockErrorMessage = 'Error synthesizing text to speech';
  const mockErrorMessageFirebaseUpload =
    'Error uploading audio file for japanese'; // come back to this and see how it is when forced

  let req: Partial<Request>;
  let res: Partial<Response>;

  const mockId = '12345';

  beforeEach(() => {
    req = {
      body: {
        text: 'こんばんは',
        language: japanese,
        id: mockId,
      },
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with a URL when successful', async () => {
    (textToSpeechClient.synthesizeSpeech as jest.Mock).mockResolvedValue(
      mockSynthesize,
    );
    (uploadAudioFileToFirebase as jest.Mock).mockResolvedValue(mockUrl);
    await textToSpeechRoute(req as Request, res as Response);

    expect(uploadAudioFileToFirebase).toHaveBeenCalledWith({
      buffer: expect.any(Buffer),
      language: japanese,
      id: mockId,
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should respond with a 500 error if synthesis fails', async () => {
    (textToSpeechClient.synthesizeSpeech as jest.Mock).mockRejectedValue(
      new Error(mockErrorMessage),
    );
    (uploadAudioFileToFirebase as jest.Mock).mockResolvedValue(mockUrl);

    await textToSpeechRoute(req as Request, res as Response);
    expect(uploadAudioFileToFirebase).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: mockErrorMessage });
  });

  it('should respond with a 500 error if upload fails', async () => {
    (textToSpeechClient.synthesizeSpeech as jest.Mock).mockResolvedValue(
      mockSynthesize,
    );
    (uploadAudioFileToFirebase as jest.Mock).mockRejectedValue(
      mockErrorMessageFirebaseUpload,
    );

    await textToSpeechRoute(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: mockErrorMessageFirebaseUpload,
    });
  });
});

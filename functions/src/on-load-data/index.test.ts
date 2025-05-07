import { getFirebaseContentType } from '.';
import { getDataSnapshot } from '../firebase-utils/get-data-snapshot';
import { contentRef } from '../refs';
import {
  contentSnapShotWithNullsUndefindedMock,
  contentSnapShotValidDataMock,
} from './mock-data';

jest.mock('../firebase-utils/get-data-snapshot');

describe('getFirebaseContentType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove top-level nulls and nested content nulls when ref === contentRef', async () => {
    // Arrange
    (getDataSnapshot as jest.Mock).mockResolvedValue(
      contentSnapShotWithNullsUndefindedMock,
    );

    const result = await getFirebaseContentType({
      language: 'chinese',
      ref: contentRef, // triggers nested content cleanup
    });

    // Act & Assert
    expect(result.length).toBe(2); // top-level null removed
    result.forEach((item: any) => {
      expect(Array.isArray(item.content)).toBe(true);
      expect(item.content).not.toContain(null);
      expect(item.content).not.toContain(undefined);
    });
  });

  it('should return the same data if no lingering nulls/undefined found', async () => {
    // Arrange
    (getDataSnapshot as jest.Mock).mockResolvedValue(
      contentSnapShotValidDataMock,
    );

    const result = await getFirebaseContentType({
      language: 'chinese',
      ref: contentRef,
    });

    expect(result).toStrictEqual(contentSnapShotValidDataMock);
  });
});

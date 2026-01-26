import * as admin from 'firebase-admin';
import { saveSnippetToContent } from './save-snippet';
import { Snippet } from '../../types/shared-types';

describe('saveSnippetToContent with Firebase Emulator', () => {
  let db: admin.database.Database;
  let testApp: admin.app.App;

  beforeAll(() => {
    // Initialize Firebase Admin with emulator
    testApp = admin.initializeApp(
      {
        projectId: 'test-project',
        databaseURL: 'http://localhost:9000?ns=test-project',
      },
      'test-app',
    );
    db = testApp.database();
  });

  afterAll(async () => {
    await testApp.delete();
  });

  beforeEach(async () => {
    // Clear database before each test
    await db.ref().set(null);
  });

  it('should save a snippet to the correct path', async () => {
    const snippetData: Snippet = {
      id: 'snippet-123',
      baseLang: 'Hello world',
      targetLang: 'こんにちは世界',
      time: 5.5,
    };

    await saveSnippetToContent({
      db,
      language: 'japanese',
      contentId: 'content-456',
      snippetData,
    });

    // Verify the snippet was saved to the correct path
    const snapshot = await db
      .ref('japanese/content/content-456/snippets/snippet-123')
      .once('value');
    const savedData = snapshot.val();

    expect(savedData).toEqual(snippetData);
    expect(savedData.id).toBe('snippet-123');
    expect(savedData.baseLang).toBe('Hello world');
    expect(savedData.targetLang).toBe('こんにちは世界');
    expect(savedData.time).toBe(5.5);
  });

  it('should overwrite existing snippet with same id', async () => {
    const contentId = 'content-789';
    const snippetId = 'snippet-abc';

    // Insert initial snippet
    const initialSnippet: Snippet = {
      id: snippetId,
      baseLang: 'Old text',
      targetLang: '古いテキスト',
      time: 1.0,
    };

    await saveSnippetToContent({
      db,
      language: 'japanese',
      contentId,
      snippetData: initialSnippet,
    });

    // Update with new snippet
    const updatedSnippet: Snippet = {
      id: snippetId,
      baseLang: 'New text',
      targetLang: '新しいテキスト',
      time: 2.0,
      focusedText: 'New focused text',
    };

    await saveSnippetToContent({
      db,
      language: 'japanese',
      contentId,
      snippetData: updatedSnippet,
    });

    // Verify the snippet was updated
    const snapshot = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .once('value');
    const savedData = snapshot.val();

    expect(savedData.baseLang).toBe('New text');
    expect(savedData.targetLang).toBe('新しいテキスト');
    expect(savedData.time).toBe(2.0);
    expect(savedData.focusedText).toBe('New focused text');
  });

  it('should save snippet with all optional fields', async () => {
    const snippetData: Snippet = {
      id: 'snippet-full',
      baseLang: 'Complete snippet',
      targetLang: '完全なスニペット',
      time: 10.5,
      focusedText: 'Focus here',
      isContracted: true,
      isPreSnippet: false,
      suggestedFocusText: 'Suggested focus',
      reviewData: {
        difficulty: 5,
        due: new Date('2026-02-01'),
        ease: 2.5,
        elapsed_days: 1,
        interval: 3,
        lapses: 0,
        last_review: new Date('2026-01-26'),
        reps: 1,
        scheduled_days: 3,
        stability: 2.0,
        state: 1,
      },
    };

    await saveSnippetToContent({
      db,
      language: 'chinese',
      contentId: 'content-complete',
      snippetData,
    });

    const snapshot = await db
      .ref('chinese/content/content-complete/snippets/snippet-full')
      .once('value');
    const savedData = snapshot.val();

    expect(savedData.id).toBe('snippet-full');
    expect(savedData.focusedText).toBe('Focus here');
    expect(savedData.isContracted).toBe(true);
    expect(savedData.isPreSnippet).toBe(false);
    expect(savedData.suggestedFocusText).toBe('Suggested focus');
    expect(savedData.reviewData).toBeDefined();
    expect(savedData.reviewData.difficulty).toBe(5);
  });

  it('should handle multiple snippets in same content', async () => {
    const contentId = 'content-multi';

    const snippet1: Snippet = {
      id: 'snippet-1',
      baseLang: 'First',
      targetLang: '最初',
      time: 1.0,
    };

    const snippet2: Snippet = {
      id: 'snippet-2',
      baseLang: 'Second',
      targetLang: '二番目',
      time: 2.0,
    };

    await saveSnippetToContent({
      db,
      language: 'japanese',
      contentId,
      snippetData: snippet1,
    });

    await saveSnippetToContent({
      db,
      language: 'japanese',
      contentId,
      snippetData: snippet2,
    });

    // Verify both snippets exist
    const snippetsSnapshot = await db
      .ref(`japanese/content/${contentId}/snippets`)
      .once('value');
    const snippets = snippetsSnapshot.val();

    expect(snippets['snippet-1']).toBeDefined();
    expect(snippets['snippet-2']).toBeDefined();
    expect(snippets['snippet-1'].baseLang).toBe('First');
    expect(snippets['snippet-2'].baseLang).toBe('Second');
  });

  it('should remove reviewData when overwriting snippet without reviewData', async () => {
    const contentId = 'content-review-removal';
    const snippetId = 'snippet-with-review';

    // First save snippet WITH reviewData
    const snippetWithReview: Snippet = {
      id: snippetId,
      baseLang: 'Review test',
      targetLang: 'レビューテスト',
      time: 3.5,
      reviewData: {
        difficulty: 5,
        due: new Date('2026-02-01'),
        ease: 2.5,
        elapsed_days: 1,
        interval: 3,
        lapses: 0,
        last_review: new Date('2026-01-26'),
        reps: 1,
        scheduled_days: 3,
        stability: 2.0,
        state: 1,
      },
    };

    await saveSnippetToContent({
      db,
      language: 'japanese',
      contentId,
      snippetData: snippetWithReview,
    });

    // Verify reviewData exists
    const beforeSnapshot = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .once('value');
    const beforeData = beforeSnapshot.val();
    expect(beforeData.reviewData).toBeDefined();

    // Now overwrite with same snippet WITHOUT reviewData
    const snippetWithoutReview: Snippet = {
      id: snippetId,
      baseLang: 'Review test',
      targetLang: 'レビューテスト',
      time: 3.5,
    };

    await saveSnippetToContent({
      db,
      language: 'japanese',
      contentId,
      snippetData: snippetWithoutReview,
    });

    // Verify reviewData is completely removed
    const afterSnapshot = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .once('value');
    const afterData = afterSnapshot.val();

    expect(afterData.reviewData).toBeUndefined();
    expect(afterData.id).toBe(snippetId);
    expect(afterData.baseLang).toBe('Review test');
    expect(afterData.targetLang).toBe('レビューテスト');
    expect(afterData.time).toBe(3.5);
  });

  it('should throw error if database operation fails', async () => {
    const snippetData: Snippet = {
      id: 'snippet-error',
      baseLang: 'Error test',
      targetLang: 'エラーテスト',
      time: 5.0,
    };

    // Create a mock db that throws an error
    const mockDb = {
      ref: jest.fn().mockReturnValue({
        set: jest.fn().mockRejectedValue(new Error('Database write failed')),
      }),
    } as any;

    await expect(
      saveSnippetToContent({
        db: mockDb,
        language: 'japanese',
        contentId: 'content-error',
        snippetData,
      }),
    ).rejects.toThrow('Database write failed');
  });
});

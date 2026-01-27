import * as admin from 'firebase-admin';
import { deleteSnippetFromContent } from './delete-snippet';
import { Snippet } from '../../types/shared-types';

describe('deleteSnippetFromContent with Firebase Emulator', () => {
  let db: admin.database.Database;
  let testApp: admin.app.App;

  beforeAll(() => {
    // Initialize Firebase Admin with emulator
    testApp = admin.initializeApp(
      {
        projectId: 'test-project',
        databaseURL: 'http://localhost:9000?ns=test-project',
      },
      'test-delete-app',
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

  it('should delete a snippet from the correct path', async () => {
    const contentId = 'content-123';
    const snippetId = 'snippet-456';

    // First, create a snippet
    const snippetData: Snippet = {
      id: snippetId,
      baseLang: 'Hello world',
      targetLang: 'こんにちは世界',
      time: 5.5,
    };

    await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .set(snippetData);

    // Verify it exists
    let snapshot = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .once('value');
    expect(snapshot.exists()).toBe(true);

    // Delete the snippet
    await deleteSnippetFromContent({
      db,
      language: 'japanese',
      contentId,
      snippetId,
    });

    // Verify it's deleted
    snapshot = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .once('value');
    expect(snapshot.exists()).toBe(false);
  });

  it('should delete only the specified snippet and leave others intact', async () => {
    const contentId = 'content-789';
    const snippetId1 = 'snippet-001';
    const snippetId2 = 'snippet-002';

    // Create two snippets
    const snippet1: Snippet = {
      id: snippetId1,
      baseLang: 'First snippet',
      targetLang: '最初のスニペット',
      time: 3.0,
    };

    const snippet2: Snippet = {
      id: snippetId2,
      baseLang: 'Second snippet',
      targetLang: '2番目のスニペット',
      time: 4.0,
    };

    await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId1}`)
      .set(snippet1);
    await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId2}`)
      .set(snippet2);

    // Delete the first snippet
    await deleteSnippetFromContent({
      db,
      language: 'japanese',
      contentId,
      snippetId: snippetId1,
    });

    // Verify first is deleted
    const snapshot1 = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId1}`)
      .once('value');
    expect(snapshot1.exists()).toBe(false);

    // Verify second still exists
    const snapshot2 = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId2}`)
      .once('value');
    expect(snapshot2.exists()).toBe(true);
    expect(snapshot2.val()).toEqual(snippet2);
  });

  it('should not throw error when deleting non-existent snippet', async () => {
    // Deleting a snippet that doesn't exist should complete without error
    await expect(
      deleteSnippetFromContent({
        db,
        language: 'japanese',
        contentId: 'non-existent-content',
        snippetId: 'non-existent-snippet',
      }),
    ).resolves.not.toThrow();
  });

  it('should work with different languages', async () => {
    const contentId = 'content-multilang';
    const snippetId = 'snippet-chinese';

    const chineseSnippet: Snippet = {
      id: snippetId,
      baseLang: 'Hello',
      targetLang: '你好',
      time: 2.5,
    };

    // Create snippet in Chinese path
    await db
      .ref(`chinese/content/${contentId}/snippets/${snippetId}`)
      .set(chineseSnippet);

    // Delete from Chinese path
    await deleteSnippetFromContent({
      db,
      language: 'chinese',
      contentId,
      snippetId,
    });

    // Verify it's deleted
    const snapshot = await db
      .ref(`chinese/content/${contentId}/snippets/${snippetId}`)
      .once('value');
    expect(snapshot.exists()).toBe(false);
  });

  it('should handle snippet with optional fields', async () => {
    const contentId = 'content-full';
    const snippetId = 'snippet-complex';

    const fullSnippet: Snippet = {
      id: snippetId,
      baseLang: 'Complete snippet',
      targetLang: '完全なスニペット',
      time: 8.0,
      focusedText: 'Focus',
      isContracted: true,
      isPreSnippet: false,
      suggestedFocusText: 'Suggested',
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

    // Create complex snippet
    await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .set(fullSnippet);

    // Delete it
    await deleteSnippetFromContent({
      db,
      language: 'japanese',
      contentId,
      snippetId,
    });

    // Verify it's deleted
    const snapshot = await db
      .ref(`japanese/content/${contentId}/snippets/${snippetId}`)
      .once('value');
    expect(snapshot.exists()).toBe(false);
  });
});

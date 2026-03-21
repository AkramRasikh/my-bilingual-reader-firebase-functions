import { LanguageTypes } from '../../shared-validation';
import { deleteSentenceFromContent } from '../sentences/delete-sentence';

export const deleteAdditionalWordContext = async ({
  language,
  additionalContext,
}: {
  language: LanguageTypes;
  additionalContext?: string[];
}): Promise<string[]> => {
  let sentenceIds: string[] = [];
  if (Array.isArray(additionalContext) && additionalContext.length > 0) {
    const deletePromises = additionalContext.map((sentenceId) => {
      return deleteSentenceFromContent({ language, sentenceId });
    });
    sentenceIds = await Promise.all(deletePromises);
  }
  return sentenceIds;
};

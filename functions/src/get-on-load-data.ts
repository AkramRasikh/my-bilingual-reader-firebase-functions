import { db } from './text-to-speech';

const filterOutNestedNulls = (arr: any[]) =>
  arr?.filter((item) => item !== null || item !== undefined);

const content = 'content';

const getRefPath = ({ language, ref }) => `${language}/${ref}`;

const getContentTypeSnapshot = async ({ language, ref, db }) => {
  try {
    const refPath = getRefPath({ language, ref });
    const refObj = db.ref(refPath);
    const snapshot = await refObj.once('value');
    const valSnapshotData = snapshot.val();
    return valSnapshotData;
  } catch (error) {
    throw new Error(`Error getting snapshot of ${ref} for ${language}`);
  }
};

const getFirebaseContentType = async ({ language, ref }) => {
  try {
    const thisContentTypeSnapShot = await getContentTypeSnapshot({
      language,
      ref,
      db,
    });
    const realValues = filterOutNestedNulls(thisContentTypeSnapShot);
    if (ref === content) {
      const filteredOutUndefinedNull = realValues.map(
        (thisLangaugeContentItem) => {
          return {
            ...thisLangaugeContentItem,
            content: filterOutNestedNulls(thisLangaugeContentItem.content),
          };
        },
      );
      return filteredOutUndefinedNull;
    } else {
      return realValues;
    }
  } catch (error) {
    throw new Error(
      error || `Failed to get contentType ${ref} for ${language}`,
    );
  }
};

export async function getOnLoadData({ language, refs }): Promise<any> {
  return await Promise.all(
    refs.map(async (ref) => {
      try {
        const refData = await getFirebaseContentType({ language, ref });
        return {
          [ref]: refData,
        };
      } catch (error) {
        throw new Error(`Error fetching ${ref} for language ${language}`);
      }
    }),
  );
}

import { getFirebaseContentType } from '../get-on-load-data';
import { LanguageTypes } from '../language-keys';
import { RefTypes } from '../refs';

interface OnLoadDataProps {
  language: LanguageTypes;
  refs: RefTypes[];
}

export async function onLoadData({
  language,
  refs,
}: OnLoadDataProps): Promise<any> {
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

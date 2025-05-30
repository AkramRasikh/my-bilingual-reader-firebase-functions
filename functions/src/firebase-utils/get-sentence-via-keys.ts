import { SentenceType } from '../routes/content/types';

export const getThisSentenceIndex = ({ data, id }) => {
  // Convert object of objects to an array
  const values = Object.values(data);
  const sentenceKeys = Object.keys(data);

  // Find the index of the object to update
  const sentenceIndex = values.findIndex((item: SentenceType) => {
    // added optional
    return item?.id === id;
  });

  return { sentenceKeys, sentenceIndex };
};

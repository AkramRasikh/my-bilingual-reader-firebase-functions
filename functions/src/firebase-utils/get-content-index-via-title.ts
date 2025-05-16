import { ContentType } from '../routes/content/types';

export const getContentIndexViaTitle = ({ data, title }) => {
  const values = Object.values(data);
  const keys = Object.keys(data);

  const index = values.findIndex((item: ContentType) => {
    return item.title === title;
  });

  return { keys, index };
};

interface SnapshotItemsPickerProps {
  arr: any[]; // update to reflect the ref types
  id: string;
}

type WithId = { id: string; [key: string]: any };

export const getThisItemsViaValues = ({
  arr,
  id,
}: SnapshotItemsPickerProps) => {
  const thisItemsValues = Object.values(arr) as WithId[];
  const keys = Object.keys(arr);
  const index = thisItemsValues.findIndex((item) => item?.id === id);
  return { keys, index };
};

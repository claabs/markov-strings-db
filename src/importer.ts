import { AddDataProps } from '.';
import {
  MarkovFragment as MarkovV3Fragment,
  MarkovImportExport as MarkovV3ImportExport,
} from './v3-types';

const getFragmentInputData = (
  fragments: MarkovV3Fragment[],
  inputData: Map<string, AddDataProps>
): void => {
  fragments.forEach((fragment) =>
    fragment.refs.forEach((ref) => {
      const { string } = ref; // Save string as the following delete will delete ref.string as well
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const custom: Record<string, any> = ref;
      delete custom.string; // Only keep custom data
      const addData: AddDataProps = {
        string,
      };
      if (Object.keys(custom).length) addData.custom = custom;
      const key = JSON.stringify(addData);
      inputData.set(key, addData);
    })
  );
};

export const getV3ImportInputData = (importData: MarkovV3ImportExport): AddDataProps[] => {
  const inputData = new Map<string, AddDataProps>();
  Object.values(importData.corpus).forEach((fragments) => {
    getFragmentInputData(fragments, inputData);
  });
  getFragmentInputData(importData.startWords, inputData);
  getFragmentInputData(importData.endWords, inputData);
  return Array.from(inputData.values());
};

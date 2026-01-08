export const recorder = (length: number) => {
  const record = new Float32Array(length);
  let recorded = 0;
  let onFilled: (input: Float32Array) => void = () => {};
  const obj = {
    onFilled: (f: (input: Float32Array) => void) => {
       onFilled = f;
    },
    add: (input: Float32Array) => {
      for (let i = 0; i < input.length;) {
        const shift = Math.min(input.length - i, record.length - recorded);
        record.copyWithin(0, shift);
        for (let j = 0; j < shift; j++) {
          record[record.length - shift + j] = input[i + j];
        }
        recorded += shift;
        i += shift;
        if (recorded >= record.length) {
          recorded = 0;
          onFilled(record);
        }
      }
    },
    get: () => {
      return record;
    },
  };
  return obj;
};

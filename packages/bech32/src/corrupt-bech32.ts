export const corruptBech32 = (goodBech32: string) => {
  const separator = goodBech32.lastIndexOf('1');
  const [hrp, data] = [goodBech32.slice(0, separator), goodBech32.slice(separator + 1)];

  const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  const index = Math.floor(Math.random() * data.length);
  const dontUse = data[index];
  const wrongChar = Array.from(alphabet)
    .filter(c => c !== dontUse)
    .sort(Math.random)
    .pop();
  const bad = `${data.slice(0, index)}${wrongChar}${data.slice(index + 1)}`;

  return `${hrp}1${bad}`;
};

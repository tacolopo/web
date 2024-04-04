export const corruptBech32 = (goodBech32: string) => {
  const [hrp, data] = goodBech32.split('1') as [string, string];

  const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  const index = Math.floor(Math.random() * data.length);
  const dontUse = data[index];
  const wrongChar = Array.from(alphabet).filter(c => c !== dontUse)[
    Math.floor(Math.random() * (alphabet.length - 1))
  ];

  return `${hrp}1${data.slice(0, index)}${wrongChar}${data.slice(index + 1)}`;
};

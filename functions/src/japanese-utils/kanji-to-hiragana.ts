import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { initializeTokenizer } from './init-kuromoji';

interface kanjiToHiraganaParams {
  sentence: string;
}

const kanjiToHiragana = async ({ sentence }: kanjiToHiraganaParams) => {
  try {
    // Initialize the tokenizer
    const tokenizer = await initializeTokenizer();

    // Tokenize the Japanese sentence
    const tokens = tokenizer.tokenize(sentence);

    const kuroshiro = new Kuroshiro();
    // Initialize
    // Here uses async/await, you could also use Promise
    await kuroshiro.init(new KuromojiAnalyzer());
    // Convert what you want
    const hasKanji = Kuroshiro.Util.hasKanji;

    // Convert kanji readings to hiragana, leave hiragana and katakana unchanged
    const convertedTokens = await Promise.all(
      tokens.map(async (token) => {
        if (hasKanji(token.surface_form) && token.surface_form) {
          const hiragana = await kuroshiro.convert(token.surface_form, {
            to: 'hiragana',
          });

          token.surface_form = hiragana; // Replace kanji reading with hiragana
        }
        return token;
      }),
    );

    return convertedTokens.map((token) => token.surface_form).join('');
  } catch (error) {
    throw error;
  }
};

// export const tokenizeSentence = async ({ sentence }: kanjiToHiraganaParams) => {
//   try {
//     // Initialize the tokenizer
//     const tokenizer = await initializeTokenizer();

//     // Tokenize the Japanese sentence
//     const tokens = tokenizer.tokenize(sentence);

//     return tokens.map((item) => item.surface_form);

//     // const kuroshiro = new Kuroshiro();
//     // // Initialize
//     // // Here uses async/await, you could also use Promise
//     // await kuroshiro.init(new KuromojiAnalyzer());
//     // // Convert what you want
//     // const hasKanji = Kuroshiro.Util.hasKanji;

//     // // Convert kanji readings to hiragana, leave hiragana and katakana unchanged
//     // const convertedTokens = await Promise.all(
//     //   tokens.map(async (token) => {
//     //     if (hasKanji(token.surface_form) && token.surface_form) {
//     //       const hiragana = await kuroshiro.convert(token.surface_form, {
//     //         to: 'hiragana',
//     //       });

//     //       token.surface_form = hiragana; // Replace kanji reading with hiragana
//     //     }
//     //     return token;
//     //   }),
//     // );

//     // return convertedTokens.map((token) => token.surface_form).join('');
//   } catch (error) {
//     throw error;
//   }
// };

export default kanjiToHiragana;

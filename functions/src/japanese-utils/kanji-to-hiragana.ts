import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const kuroshiro = new Kuroshiro();
let isKuroshiroInitialized = false;

const initializeKuroshiro = async () => {
  if (!isKuroshiroInitialized) {
    await kuroshiro.init(new KuromojiAnalyzer());
    isKuroshiroInitialized = true;
  }
};

interface kanjiToHiraganaParams {
  sentence: string;
}

const kanjiToHiragana = async ({ sentence }: kanjiToHiraganaParams) => {
  try {
    await initializeKuroshiro();

    const hasKanji = Kuroshiro.Util.hasKanji;

    if (hasKanji(sentence)) {
      const convertedToHiragana = await kuroshiro.convert(sentence, {
        to: 'hiragana',
      });
      return convertedToHiragana;
    }

    return sentence;
  } catch (error) {
    console.error('## kanjiToHiragana Error:', error);
    throw error;
  }
};

export default kanjiToHiragana;

import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

interface kanjiToHiraganaParams {
  sentence: string;
}

const kanjiToHiragana = async ({ sentence }: kanjiToHiraganaParams) => {
  try {
    const kuroshiro = new Kuroshiro();

    await kuroshiro.init(new KuromojiAnalyzer());

    // Convert what you want
    const hasKanji = Kuroshiro.Util.hasKanji;

    if (hasKanji(sentence)) {
      const convertedToHiragana = await kuroshiro.convert(sentence, {
        to: 'hiragana',
      });
      return convertedToHiragana;
    }

    return sentence;
  } catch (error) {
    throw error;
  }
};

export default kanjiToHiragana;

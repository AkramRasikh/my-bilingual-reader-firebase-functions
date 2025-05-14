import kuromoji from 'kuromoji';

let tokenizerInstance: kuromoji.Tokenizer<any>;

export async function initializeTokenizer() {
  if (!tokenizerInstance) {
    tokenizerInstance = await new Promise((resolve, reject) => {
      kuromoji
        .builder({ dicPath: 'node_modules/kuromoji/dict' })
        .build((err, tokenizer) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(tokenizer);
        });
    });
  }
  return tokenizerInstance;
}

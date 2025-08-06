import * as functions from 'firebase-functions';
import { onLoadDataRoute } from './routes/on-load-data';
import { translateTextRoute } from './routes/translate-text';
import { textToSpeechRoute } from './routes/text-to-speech';
import { addSnippetRoute } from './routes/snippets/add-snippet';
import { deleteSnippetRoute } from './routes/snippets/delete-snippet';
import { addWordRoute } from './routes/words/add-word';
import { updateWordRoute } from './routes/words/update-word';
import { deleteWordRoute } from './routes/words/delete-word';
import { updateContentMetaDataRoute } from './routes/content/update-content';
import { updateSentenceRoute } from './routes/sentences/update-sentence';
import { updateAdhocSentenceRoute } from './routes/sentences/update-adhoc-sentence';
import {
  adhocSentenceMinimalPairingRoute,
  adhocSentenceTTSRoute,
} from './routes/sentences/add-sentence';
import { addAlreadyGeneratedSentenceRoute } from './routes/sentences/add-already-generated-sentence';
import { addExpressionRoute } from './routes/sentences/add-expression';

exports.translateText = functions.https.onRequest(translateTextRoute);

exports.textToSpeech = functions.https.onRequest(textToSpeechRoute);

exports.getOnLoadData = functions.https.onRequest(onLoadDataRoute);

exports.addSnippet = functions.https.onRequest(addSnippetRoute);

exports.deleteSnippet = functions.https.onRequest(deleteSnippetRoute);

exports.addWord = functions.https.onRequest(addWordRoute);

exports.updateWord = functions.https.onRequest(updateWordRoute);

exports.deleteWord = functions.https.onRequest(deleteWordRoute);

exports.updateContentMetaData = functions.https.onRequest(
  updateContentMetaDataRoute,
);

exports.updateSentence = functions.https.onRequest(updateSentenceRoute);

exports.updateAdhocSentence = functions.https.onRequest(
  updateAdhocSentenceRoute,
);

exports.addSentence = functions.https.onRequest(adhocSentenceTTSRoute);

exports.addMinimalPairSentence = functions.https.onRequest(
  adhocSentenceMinimalPairingRoute,
);
exports.addAlreadyGeneratedSentence = functions.https.onRequest(
  addAlreadyGeneratedSentenceRoute,
);
exports.addExpression = functions.https.onRequest(addExpressionRoute);

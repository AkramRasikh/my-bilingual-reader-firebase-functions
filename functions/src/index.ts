import * as functions from 'firebase-functions';
import { onLoadDataRoute } from './routes/on-load-data';
import { translateTextRoute } from './routes/translate-text';
import { textToSpeechRoute } from './routes/text-to-speech';
import { addSnippetRoute } from './routes/snippets/add-snippet';
import { deleteSnippetRoute } from './routes/snippets/delete-snippet';
import { addWordRoute } from './routes/words/add-word';

exports.translateText = functions.https.onRequest(translateTextRoute);

exports.textToSpeech = functions.https.onRequest(textToSpeechRoute);

exports.getOnLoadData = functions.https.onRequest(onLoadDataRoute);

exports.addSnippet = functions.https.onRequest(addSnippetRoute);

exports.deleteSnippet = functions.https.onRequest(deleteSnippetRoute);

exports.addWord = functions.https.onRequest(addWordRoute);

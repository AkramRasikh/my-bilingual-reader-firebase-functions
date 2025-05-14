import * as functions from 'firebase-functions';
import { onLoadDataRoute } from './on-load-data';
import { translateTextRoute } from './translate-text';
import { textToSpeechRoute } from './text-to-speech';
import { addSnippetRoute } from './routes/snippets/add-snippet';
import { deleteSnippetRoute } from './routes/snippets/delete-snippet';

exports.translateText = functions.https.onRequest(translateTextRoute);

exports.textToSpeech = functions.https.onRequest(textToSpeechRoute);

exports.getOnLoadData = functions.https.onRequest(onLoadDataRoute);

exports.addSnippet = functions.https.onRequest(addSnippetRoute);

exports.deleteSnippet = functions.https.onRequest(deleteSnippetRoute);

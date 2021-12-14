var express = require('express')
var cors = require('cors')
const speech = require('@google-cloud/speech');
const recorder = require('node-record-lpcm16')

var app = express()

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

// Creates a client
const client = new speech.SpeechClient();

streamingLimit = 1000;

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  interimResults: false, // If you want interim results, set this to true
};

// chucks of transcript from speech to text
let responseChunks = [];

// Create a recognize stream
let streamStarted = true;
async function createStream(req, res) {
  recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', async (data) => {
      if (!streamStarted) return;
      process.stdout.write(
        data.results[0] && data.results[0].alternatives[0]
          ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
          : '\n\nReached transcription time limit, press Ctrl+C\n'
      )
      responseChunks.push(`${data.results[0].alternatives[0].transcript}`);
    }
    );//.on('data', speechCallback);
}

async function transcribeAudio(req, res) {
  responseChunks = []
  console.log("transcribeAudio called")
  createStream(req, res);
  console.log(recorder)
  recording = recorder
    .record({
      sampleRateHertz: sampleRateHertz,
      threshold: 0,
      verbose: false,
      recordProgram: 'rec', // Try also "arecord" or "sox"
      silence: '20.0',
    })

  recording.stream()
    .on('error', console.error)
    .pipe(recognizeStream);

  return;
}

function FinishTrancription() {
  try {
    console.log("Ending...")
    recording.stop();
    //recognizeStream.end();
    //recognizeStream.removeListener();
    //recognizeStream = null;
  }
  catch (exception_var) {
    console.log("No recording on going");
  }

}

app.get('/transcribeAudio', cors(), async (req, res) => {
  // transcribing audio
  FinishTrancription()
  streamStarted = true;
  await createStream(req, res);
  await transcribeAudio(req, res);
  return;
})


app.get('/endTranscription', cors(), async (req, res) => {
  FinishTrancription();
  let response = "";
  let noSpaces = [];
  //console.log(responseChunks)
  responseChunks.forEach(elem => noSpaces.push(elem.trim()))

  let uniqueChars = [...new Set(noSpaces)];
  //console.log("set elements: ", uniqueChars);
  uniqueChars.forEach(elem => response += (elem + " "));

  console.log("response: ", response);
  return res.send(response);
})

app.listen(8080, function () {
  console.log('CORS-enabled web server listening on port 8080')
})

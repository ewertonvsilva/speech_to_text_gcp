var express = require('express')
var cors = require('cors')
const speech = require('@google-cloud/speech');
const recorder = require('node-record-lpcm16')

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';


var app = express()

async function callAll() {
    let recognizeStream = null;
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
        );

    console.log("transcribeAudio called")
    console.log(recorder)
    const recording = recorder
        .record({
            sampleRateHertz: sampleRateHertz,
            //thresholdEnd: 0.5,
            threshold: 0,
            verbose: false,
            recordProgram: 'sox', // Try also "arecord" or "sox"
            //silence: '30.0',
            endOnSilence: true,
        })


    recording.stream()
        .on('error', console.error)
        .pipe(recognizeStream);

    //stop recording after 10 seconds
    setTimeout(() => {
        recording.stop()
    }, 10000)

}


console.log("Call #1")
callAll();

setTimeout(() => {
    callAll();
    console.log("Call #2");
}, 15000)

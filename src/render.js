//  our front-end code

// grab buttons
const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');

startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};
const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources; //event handler when our videoSelectBtn is clicked

//electron has a desktop capture module we can use in the render process
const { desktopCapturer, remote } = require('electron');
     //electron allows us to import ☝️ Node.JS modules in the browser
     //remote (module) handels IPC inter process communication, using remote we can access things on the main process
const { Menu } = remote; 

//get the available video sources 
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
      types: ['window', 'screen']
    });
  
    const videoOptionsMenu = Menu.buildFromTemplate(
      inputSources.map(source => {
        return {
          label: source.name,
          click: () => selectSource(source)
        };
      })
    );
  
  
    videoOptionsMenu.popup();
  }
let mediaRecorder;
const recordedChunks = [];


// Change the video source window to Record⏺️
async function selectSource (source) {
    videoSelectBtn.innerText = source.name;
    
    const constraints = {
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };
    //Create Stream 
    const stream = await navigator.mediaDevices
        .getUserMedia(constraints);
    
    //Preview Source in the video html element
    videoElement.srcObject = stream;
    videoElement.play();

    //Create Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    //Register Event Handlers - recorder can be controlled by user and has an event based api
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop; // we will define handlers for these events on separate functions
}

function handleDataAvailable(e) {
    console.log('video data available')
    recordedChunks.push(e.data);
}
//powerful dialog module that runs on the main process , we can import it from our remote module. It allows us to create native dialogs to do things like save and open files
const { dialog } = remote;
const { writeFile } = require('fs');
//saves video file on stop using a BLOB
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
        //blob is a data structure that handles raw data like a video file
    });
    //buffer is also an object for representing raw data
    const buffer = Buffer.from(await blob.arrayBuffer());
    //now that we have the data we need to give the user a way to select where they want to save it on their system using the electron dialog module
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    });
    console.log(filePath);

    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
}
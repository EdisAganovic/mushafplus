/**
 * @file audio.js
 * @description AUDIO LOGIC (RECORDING & PLAYBACK)
 * Manages the MediaRecorder API, Web Audio API (Mic Meter), and custom player UI logic.
 */

let recordTimerInterval = null;
let recordStartTime = null;

/**
 * Initiates the microphone recording session.
 * Reuses AppState.audioStream if available to prevent multiple browser prompts.
 */
function getSupportedMimeType() {
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

window.startRecording = async function () {
  try {
    if (!AppState.audioStream) {
      AppState.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }

    const mimeType = getSupportedMimeType();
    AppState.recordingMimeType = mimeType || "audio/webm";
    console.log(`[Recording] Start: ${AppState.recordingMimeType}`);
    const options = mimeType ? { mimeType } : {};
    AppState.mediaRecorder = new MediaRecorder(AppState.audioStream, options);
    AppState.audioChunks = [];

    AppState.mediaRecorder.ondataavailable = (e) => {
      AppState.audioChunks.push(e.data);
    };

    AppState.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(AppState.audioChunks, { 
        type: AppState.recordingMimeType 
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const key = `${AppState.currentSurah.id}-${
        AppState.currentSurah.verses[AppState.currentAyahIndex].id
      }`;

      // Prevent memory leaks by cleaning up the old Blob URL
      if (AppState.recordings[key]) {
        URL.revokeObjectURL(AppState.recordings[key]);
        // Remove from tracking array if it exists elsewhere
        AppState.recordingKeys = AppState.recordingKeys.filter(k => k !== key);
      }

      AppState.recordings[key] = audioUrl;
      AppState.recordingKeys.push(key);

      // --- OPTIMIZATION: Limit memory usage for long sessions ---
      // We only keep the last 20 recordings in the "sliding window" to prevent memory exhaustion
      if (AppState.recordingKeys.length > 20) {
        const oldestKey = AppState.recordingKeys.shift();
        if (AppState.recordings[oldestKey] && oldestKey !== key) {
           URL.revokeObjectURL(AppState.recordings[oldestKey]);
           delete AppState.recordings[oldestKey];
           console.log(`[Memory] Revoked oldest recording: ${oldestKey}`);
        }
      }

      // Update User Player Source
      els.audioPlayback.src = audioUrl;
      els.audioPlayback.load();
      els.userAudioContainer.classList.remove("hidden");
      resetUserAudioUI();

      // UI Reset
      if (recordTimerInterval) {
        clearInterval(recordTimerInterval);
        recordTimerInterval = null;
      }
      
      // Vraćanje širine glavnom dugmetu
      els.recordBtn.classList.remove("flex-1", "gap-1.5", "sm:gap-2", "animate-pulse-slow");
      els.recordBtn.classList.add("w-10", "sm:w-12");
      if(els.recordIcon) els.recordIcon.name = "mic-outline";
      els.recordText.innerText = T.recordAgain;
      els.recordText.classList.add("hidden");

      if (els.validBtn && els.bookmarkBtn) {
        els.validBtn.classList.remove("w-10", "sm:w-12", "px-0");
        els.validBtn.classList.add("flex-1", "gap-1.5", "sm:gap-2");
        const validSpan = els.validBtn.querySelector('span');
        if (validSpan) validSpan.classList.remove("hidden");

        els.bookmarkBtn.classList.remove("w-10", "sm:w-12", "px-0");
        els.bookmarkBtn.classList.add("flex-1", "gap-1.5", "sm:gap-2");
        const bookmarkSpan = els.bookmarkBtn.querySelector('span');
        if (bookmarkSpan) bookmarkSpan.classList.remove("hidden");
      }
    };

    AppState.mediaRecorder.start();
    startMicMeter(); // Start real-time volume viz

    // UI Active State
    els.recordBtn.classList.add("flex-1", "gap-1.5", "sm:gap-2");
    els.recordBtn.classList.remove("w-10", "sm:w-12");
    if(els.recordIcon) els.recordIcon.name = "stop";
    els.recordText.classList.remove("hidden");
    els.recordText.innerText = "0:00";
    
    // Skupljanje okolne dugmadi
    if (els.validBtn && els.bookmarkBtn) {
      els.validBtn.classList.remove("flex-1", "gap-1.5", "sm:gap-2");
      els.validBtn.classList.add("w-10", "sm:w-12", "px-0");
      const validSpan = els.validBtn.querySelector('span');
      if (validSpan) validSpan.classList.add("hidden");

      els.bookmarkBtn.classList.remove("flex-1", "gap-1.5", "sm:gap-2");
      els.bookmarkBtn.classList.add("w-10", "sm:w-12", "px-0");
      const bookmarkSpan = els.bookmarkBtn.querySelector('span');
      if (bookmarkSpan) bookmarkSpan.classList.add("hidden");
    }
    
    // Timer
    recordStartTime = Date.now();
    recordTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        els.recordText.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);

  } catch (err) {
    alert(T.micError);
  }
};

/**
 * Stops the active recording session and mic visualization.
 */
window.stopRecording = function () {
  if (AppState.mediaRecorder && AppState.mediaRecorder.state !== "inactive") {
    AppState.mediaRecorder.stop();
    stopMicMeter();
  }
};

/**
 * Toggles between start and stop recording states.
 */
window.toggleRecording = function () {
  const isInactive =
    !AppState.mediaRecorder || AppState.mediaRecorder.state === "inactive";
  if (isInactive) {
    startRecording();
  } else {
    stopRecording();
  }
};

/**
 * Visualizes real-time mic volume using Web Audio API AnalyserNode.
 * Uses requestAnimationFrame for performance.
 */
window.startMicMeter = function () {
  if (!AppState.audioStream) return;
  if (!AppState.audioContext) {
    AppState.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
  }

  const source = AppState.audioContext.createMediaStreamSource(
    AppState.audioStream,
  );
  AppState.analyser = AppState.audioContext.createAnalyser();
  AppState.analyser.fftSize = 256;
  source.connect(AppState.analyser);

  const bufferLength = AppState.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  els.micMeterContainer.classList.remove("hidden");

  function draw() {
    AppState.animationId = requestAnimationFrame(draw);
    AppState.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const volume = Math.min(100, (average / 40) * 100);
    els.micMeterBar.style.width = volume + "%";
  }
  draw();
};

/**
 * Stops the volume visualization animation.
 */
window.stopMicMeter = function () {
  if (AppState.animationId) cancelAnimationFrame(AppState.animationId);
  els.micMeterContainer.classList.add("hidden");
  els.micMeterBar.style.width = "0%";
};

// --- CUSTOM PLAYER UI UPDATERS ---

window.updateAyahAudioUI = function () {
  const audio = els.ayahAudio;
  const progress = (audio.currentTime / audio.duration) * 100 || 0;
  els.ayahAudioProgress.style.width = `${progress}%`;
  els.ayahAudioTime.innerText = `${formatTime(audio.currentTime)} / ${formatTime(
    audio.duration || 0,
  )}`;
};

window.resetAyahAudioUI = function () {
  els.ayahPlayIcon.classList.remove("hidden");
  els.ayahPauseIcon.classList.add("hidden");
  els.ayahAudioProgress.style.width = "0%";
  els.ayahAudioTime.innerText = `0:00 / 0:00`;
};

window.updateUserAudioUI = function () {
  const audio = els.audioPlayback;
  const progress = (audio.currentTime / audio.duration) * 100 || 0;
  els.userAudioProgress.style.width = `${progress}%`;
  els.userAudioTime.innerText = `${formatTime(audio.currentTime)} / ${formatTime(
    audio.duration || 0,
  )}`;
};

window.resetUserAudioUI = function () {
  els.userPlayIcon.classList.remove("hidden");
  els.userPauseIcon.classList.add("hidden");
  els.userAudioProgress.style.width = "0%";
  els.userAudioTime.innerText = `0:00 / 0:00`;
};

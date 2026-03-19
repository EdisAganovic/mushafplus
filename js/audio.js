/**
 * @file audio.js
 * @description AUDIO LOGIC (RECORDING & PLAYBACK)
 * Manages the MediaRecorder API, Web Audio API (Mic Meter), and custom player UI logic.
 */

let recordTimerInterval = null;
let recordStartTime = null;

// Flag to prevent race condition in getUserMedia
let isRequestingMic = false;
let micRequestQueue = null; // Queue for pending recording requests

/**
 * Queue or execute microphone recording request.
 * Prevents multiple simultaneous getUserMedia calls.
 */
function requestMicRecording() {
  return new Promise((resolve, reject) => {
    if (!isRequestingMic && !AppState.audioStream) {
      // No pending request, execute immediately
      resolve(null);
    } else if (isRequestingMic) {
      // Queue this request
      if (micRequestQueue) {
        // Already queued, reject duplicate
        reject(new Error("Recording already in progress"));
        return;
      }
      micRequestQueue = { resolve, reject };
    } else {
      // Stream exists, proceed
      resolve(null);
    }
  });
}

function processMicQueue() {
  if (micRequestQueue) {
    const { resolve } = micRequestQueue;
    micRequestQueue = null;
    resolve(null);
  }
}

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
    // Check if another recording is being requested
    const wasQueued = isRequestingMic && !AppState.audioStream;

    if (wasQueued) {
      console.warn("[Recording] Microphone access pending, please wait...");
      showErrorToast("Molimo sačekajte dok se mikrofon ne aktivira...");
      return;
    }

    // CRITICAL FIX #1: Prevent race condition - only one getUserMedia call at a time
    if (!AppState.audioStream) {
      isRequestingMic = true;
      try {
        AppState.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // Process any queued request
        processMicQueue();
      } catch (micError) {
        console.error("[Recording] Microphone access denied:", micError);
        showErrorToast(T.micError);
        throw micError;
      } finally {
        isRequestingMic = false;
      }
    }

    const mimeType = getSupportedMimeType();
    AppState.recordingMimeType = mimeType || "audio/webm";
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

      // Store recording with duration metadata
      const duration = Math.round((Date.now() - recordStartTime) / 1000);
      AppState.recordings[key] = {
        url: audioUrl,
        duration: duration
      };
      AppState.recordingKeys.push(key);

      // --- OPTIMIZATION: Limit memory usage for long sessions ---
      // We only keep the last MAX_RECORDINGS recordings in the "sliding window" to prevent memory exhaustion
      while (AppState.recordingKeys.length > QURAN_CONSTANTS.MAX_RECORDINGS) {
        const oldestKey = AppState.recordingKeys.shift();
        if (AppState.recordings[oldestKey]) {
          const oldRec = AppState.recordings[oldestKey];
          // CRITICAL: Stop playback and clear source BEFORE revoking blob URL
          if (els.audioPlayback && els.audioPlayback.src === oldRec.url) {
            els.audioPlayback.pause();
            els.audioPlayback.removeAttribute("src");
            els.audioPlayback.load();
          }
          URL.revokeObjectURL(oldRec.url);
          delete AppState.recordings[oldestKey];
        }
      }

      // Update User Player Source
      els.audioPlayback.src = audioUrl;
      els.audioPlayback._customDuration = duration;
      
      // Suppress abort errors (benign browser behavior when playback is interrupted)
      els.audioPlayback.onerror = () => {
        // Silently ignore abort errors - they're normal when user interrupts playback
        if (els.audioPlayback.error?.code !== MediaError.MEDIA_ERR_ABORTED) {
          console.error('[Audio] Playback error:', els.audioPlayback.error);
        }
      };
      
      els.audioPlayback.load();

      // Chrome fix: Hint duration by seeking (sometimes helps)
      els.audioPlayback.currentTime = 1e101;
      const onSeeked = () => {
        els.audioPlayback.currentTime = 0;
        els.audioPlayback.removeEventListener('seeked', onSeeked);
      };
      els.audioPlayback.addEventListener('seeked', onSeeked);

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
    console.error("[Recording] Error:", err);
    // Error already shown in mic access error handler
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
 * Saves the current recording to localStorage with cleanup of old recordings.
 * Called automatically when stopRecording is invoked.
 */
function saveRecording() {
  const key = `${AppState.currentSurah.id}-${
    AppState.currentSurah.verses[AppState.currentAyahIndex].id
  }`;

  // Cleanup old recordings if we're near the limit
  cleanupRecordings();

  // Store recording with duration metadata
  const duration = Math.round((Date.now() - recordStartTime) / 1000);
  AppState.recordings[key] = {
    url: audioUrl,
    duration: duration
  };
  AppState.recordingKeys.push(key);
}

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
    saveRecording(); // Save recording when stopped
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

  let skipFrame = false; // Skip frames when volume is steady
  
  function draw(now) {
    if (!AppState.audioContext || !AppState.analyser) return;
    
    AppState.animationId = requestAnimationFrame(draw);
    AppState.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const volume = Math.min(100, (average / 40) * 100);
    
    // Skip updates when volume hasn't changed significantly (optimization)
    if (skipFrame && Math.abs(volume - els.micMeterBar.style.width || 0) < 2) {
      skipFrame = false;
    } else {
      els.micMeterBar.style.width = volume + "%";
    }
    
    // Occasionally force refresh to prevent stale state buildup
    if (Math.random() > 0.95) {
      skipFrame = true;
    }
  }
  draw(); // Initial call without time parameter, subsequent calls use RAF callback signature
};

/**
 * Stops the volume visualization animation.
 */
window.stopMicMeter = function () {
  if (AppState.animationId) cancelAnimationFrame(AppState.animationId);
  AppState.animationId = null; // Reset state flag
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
  const duration = (audio.duration && isFinite(audio.duration)) 
                   ? audio.duration 
                   : (audio._customDuration || 0);

  const progress = (audio.currentTime / duration) * 100 || 0;
  els.userAudioProgress.style.width = `${progress}%`;
  els.userAudioTime.innerText = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
};

window.resetUserAudioUI = function () {
  els.userPlayIcon.classList.remove("hidden");
  els.userPauseIcon.classList.add("hidden");
  els.userAudioProgress.style.width = "0%";
  els.userAudioTime.innerText = `0:00 / 0:00`;
};

/**
 * Completely clears all recording blobs from memory.
 */
window.clearAllRecordings = function() {
  Object.values(AppState.recordings).forEach(rec => {
    const url = rec.url || rec;
    if (url && typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  });
  AppState.recordings = {};
  AppState.recordingKeys = [];
  if (els.userAudioContainer) els.userAudioContainer.classList.add("hidden");
  if (els.audioPlayback) {
    els.audioPlayback.pause();
    els.audioPlayback.src = "";
    els.audioPlayback.load();
  }
};

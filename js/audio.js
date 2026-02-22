/**
 * @file audio.js
 * @description AUDIO LOGIC (RECORDING & PLAYBACK)
 * Manages the MediaRecorder API, Web Audio API (Mic Meter), and custom player UI logic.
 */

/**
 * Initiates the microphone recording session.
 * Reuses AppState.audioStream if available to prevent multiple browser prompts.
 */
window.startRecording = async function () {
  try {
    if (!AppState.audioStream) {
      AppState.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }
    AppState.mediaRecorder = new MediaRecorder(AppState.audioStream);
    AppState.audioChunks = [];

    AppState.mediaRecorder.ondataavailable = (e) => {
      AppState.audioChunks.push(e.data);
    };

    AppState.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(AppState.audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const key = `${AppState.currentSurah.id}-${
        AppState.currentSurah.verses[AppState.currentAyahIndex].id
      }`;

      // Prevent memory leaks by cleaning up the old Blob URL
      if (AppState.recordings[key]) {
        URL.revokeObjectURL(AppState.recordings[key]);
      }

      AppState.recordings[key] = audioUrl;

      // Update User Player Source
      els.audioPlayback.src = audioUrl;
      els.audioPlayback.load();
      els.userAudioContainer.classList.remove("hidden");
      resetUserAudioUI();

      // UI Reset
      els.recordBtn.classList.remove("bg-red-600", "animate-pulse-slow");
      els.recordBtn.classList.add("bg-emerald-700");
      els.recordText.innerText = T.recordAgain;
    };

    AppState.mediaRecorder.start();
    startMicMeter(); // Start real-time volume viz

    els.recordBtn.classList.add("bg-red-600", "animate-pulse-slow");
    els.recordBtn.classList.remove("bg-emerald-700");
    els.recordText.innerText = T.stop;
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
    const volume = Math.min(100, (average / 128) * 100);
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

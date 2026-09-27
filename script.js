const welcome = document.querySelector("#welcome");
const startButton = document.querySelector("#startButton");
const birthdayVideo = document.querySelector("#birthdayVideo");
const soundToggle = document.querySelector("#soundToggle");
const soundLabel = document.querySelector("#soundLabel");
const songStatus = document.querySelector("#songStatus");
const birthdayCard = document.querySelector("#birthdayCard");
const confettiLayer = document.querySelector("#confettiLayer");
const blowButton = document.querySelector("#blowButton");
const fallbackButton = document.querySelector("#fallbackButton");
const blowStatus = document.querySelector("#blowStatus");
const cakeDisplay = document.querySelector("#cakeDisplay");
const candles = document.querySelector("#candles");

let player;
let playerReady = false;
let soundOn = false;
let audioContext;
let analyser;
let microphoneStream;
let blowTimer;
let noteUnlocked = false;
let listening = false;
let ambientLevel = 0;

for (let index = 0; index < 19; index += 1) {
  const candle = document.createElement("span");
  candle.className = "candle";
  candle.style.setProperty("--x", `${(index % 10) * 10.2 + 1}%`);
  candle.style.setProperty("--row", `${Math.floor(index / 10)}`);
  candle.innerHTML = "<i></i>";
  candles.append(candle);
}

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("youtubeFrame", {
    videoId: "3kyn9Es4HoY",
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: "3kyn9Es4HoY",
      origin: window.location.origin,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: () => {
        playerReady = true;
        songStatus.textContent = "the birthday soundtrack is ready";
        if (welcome.classList.contains("is-hidden") && !soundOn) startSong();
      },
      onError: () => {
        songStatus.textContent = "song blocked here — use the music button to open YouTube";
      }
    }
  });
};

const apiScript = document.createElement("script");
apiScript.src = "https://www.youtube.com/iframe_api";
document.head.append(apiScript);

startButton.addEventListener("click", () => {
  welcome.classList.add("is-hidden");
  birthdayVideo.play().catch(() => {});
  startSong();
  createConfetti();
});

soundToggle.addEventListener("click", () => {
  if (soundOn) stopSong();
  else startSong();
});

function startSong() {
  if (!playerReady) {
    songStatus.textContent = "loading the birthday soundtrack…";
    return;
  }
  player.unMute();
  player.setVolume(72);
  player.playVideo();
  soundOn = true;
  soundLabel.textContent = "sound on";
  soundToggle.classList.add("is-playing");
}

function stopSong() {
  if (playerReady) player.pauseVideo();
  soundOn = false;
  soundLabel.textContent = "sound off";
  soundToggle.classList.remove("is-playing");
}

blowButton.addEventListener("click", async () => {
  if (noteUnlocked) return;
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.18;
    audioContext.createMediaStreamSource(microphoneStream).connect(analyser);
    blowButton.textContent = "blow toward your microphone";
    blowStatus.textContent = "listening… take a breath, then blow";
    listening = true;
    ambientLevel = 0;
    detectBlow();
  } catch {
    blowStatus.textContent = "microphone blocked — use the tap option below";
  }
});

fallbackButton.addEventListener("click", unlockNote);

function detectBlow() {
  if (noteUnlocked || !analyser) return;
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let total = 0;
  let peak = 0;
  for (const value of data) {
    const deviation = Math.abs(value - 128) / 128;
    total += deviation * deviation;
    peak = Math.max(peak, deviation);
  }
  const volume = Math.sqrt(total / data.length);
  if (ambientLevel === 0) ambientLevel = volume;
  ambientLevel = ambientLevel * 0.97 + volume * 0.03;
  if (volume > Math.max(0.055, ambientLevel * 2.4) || peak > 0.28) {
    if (!blowTimer) blowTimer = window.setTimeout(unlockNote, 220);
  } else {
    window.clearTimeout(blowTimer);
    blowTimer = null;
  }
  if (listening) window.requestAnimationFrame(detectBlow);
}

function unlockNote() {
  if (noteUnlocked) return;
  noteUnlocked = true;
  if (microphoneStream) microphoneStream.getTracks().forEach((track) => track.stop());
  if (audioContext) audioContext.close();
  listening = false;
  cakeDisplay.classList.add("blown");
  birthdayCard.classList.add("is-open");
  blowButton.textContent = "candles blown out!";
  blowStatus.textContent = "your secret note is unlocked";
  birthdayCard.scrollIntoView({ behavior: "smooth", block: "center" });
  createConfetti();
}

function createConfetti() {
  const colors = ["#ea7894", "#f49b78", "#f9cf76", "#a9c9ae"];
  for (let index = 0; index < 32; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 270}px`);
    piece.style.animationDelay = `${Math.random() * .35}s`;
    confettiLayer.append(piece);
    window.setTimeout(() => piece.remove(), 3300);
  }
}

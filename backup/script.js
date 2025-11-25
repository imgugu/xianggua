document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const playBtn = document.getElementById('playBtn');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const songTitleEl = document.getElementById('songTitle');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const progressBar = document.getElementById('progressBar');
    const volumeKnob = document.getElementById('volumeKnob');
    const canvas = document.getElementById('waveformCanvas');
    const canvasCtx = canvas.getContext('2d');

    // State
    let songs = [];
    let currentSongIndex = 0;
    let isPlaying = false;
    let audioCtx;
    let audioBuffer;
    let sourceNode;
    let analyser;
    let gainNode;
    let startTime = 0;
    let pauseTime = 0;
    let volume = 0.5; // 0.0 to 1.0
    let animationId;

    // Knob State
    let isDraggingKnob = false;
    let startY = 0;
    let currentRotation = 0; // -135 to 135 degrees

    // Initialize
    init();

    async function init() {
        try {
            const response = await fetch('songs.json');
            songs = await response.json();
            if (songs.length > 0) {
                loadSong(0);
            }
        } catch (error) {
            console.error('Failed to load songs:', error);
            songTitleEl.textContent = "ERROR LOADING SONGS";
        }

        setupKnob();
        setupAudioContext();
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    function setupAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        gainNode = audioCtx.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioCtx.destination);

        // Update knob rotation based on initial volume
        // Map 0-1 to -135 to 135
        currentRotation = (volume * 270) - 135;
        updateKnobVisuals();
    }

    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }

    function loadSong(index) {
        currentSongIndex = index;
        const song = songs[currentSongIndex];
        songTitleEl.textContent = song.title;
        currentTimeEl.textContent = "00:00";
        totalTimeEl.textContent = "Loading...";
        progressBar.style.width = '0%';

        // Reset audio state
        if (sourceNode) {
            try { sourceNode.stop(); } catch (e) { }
            sourceNode.disconnect();
        }
        isPlaying = false;
        playBtn.classList.remove('playing');
        pauseTime = 0;

        fetch(song.file)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
            .then(decodedAudio => {
                audioBuffer = decodedAudio;
                totalTimeEl.textContent = formatTime(audioBuffer.duration);
                // Auto play if we were playing before, or just ready
                // For this requirement "random play", maybe we don't auto play initially?
                // But usually "next" implies auto play.
                // Let's just wait for user to press play initially.
            })
            .catch(e => console.error("Error decoding audio", e));
    }

    function playAudio() {
        if (!audioBuffer) return;

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(analyser);
        analyser.connect(gainNode);

        // Handle loop/next when song ends
        sourceNode.onended = () => {
            if (isPlaying) {
                // If it ended naturally (not stopped by user), play next
                if (audioCtx.currentTime - startTime >= audioBuffer.duration) {
                    nextSong();
                }
            }
        };

        startTime = audioCtx.currentTime - pauseTime;
        sourceNode.start(0, pauseTime);
        isPlaying = true;
        playBtn.classList.add('playing');
        drawVisualizer();
        updateProgress();
    }

    function pauseAudio() {
        if (sourceNode) {
            sourceNode.stop();
            pauseTime = audioCtx.currentTime - startTime;
            isPlaying = false;
            playBtn.classList.remove('playing');
            cancelAnimationFrame(animationId);
        }
    }

    function togglePlay() {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    }

    function nextSong() {
        // Random play as requested? Or sequential?
        // Request says: "randomly play a song from the library"
        // Let's implement random next.
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * songs.length);
        } while (nextIndex === currentSongIndex && songs.length > 1);

        loadSong(nextIndex);
        // We need to wait for buffer to load before playing, 
        // but loadSong is async. 
        // For simplicity, we'll poll or just wait a bit? 
        // Better: loadSong fetches and decodes. We can chain playAudio there.
        // Refactoring loadSong to return a promise would be better, but for now:
        // We will just set a flag or call playAudio inside loadSong if needed.
        // Actually, let's just modify loadSong to auto-play if it was triggered by next/prev.

        // Quick fix: Wait for the fetch in loadSong to complete.
        // Since I didn't make loadSong async-await friendly for the caller,
        // I'll just modify loadSong logic slightly in a real app.
        // For this prototype, let's just rely on the user clicking play or
        // add a small timeout/callback.

        // Let's re-fetch and play immediately.
        fetch(songs[nextIndex].file)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
            .then(decodedAudio => {
                audioBuffer = decodedAudio;
                currentSongIndex = nextIndex;
                songTitleEl.textContent = songs[currentSongIndex].title;
                totalTimeEl.textContent = formatTime(audioBuffer.duration);
                playAudio();
            });
    }

    function prevSong() {
        // Previous usually goes to previous track in history or just random again?
        // Let's just do random again for simplicity or sequential.
        // Let's do sequential for "Previous" just to have a deterministic way to go back?
        // Or just random. The prompt emphasizes "random play".
        nextSong();
    }

    // Controls
    playBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong); // Reusing next logic for random

    // Visualizer
    // Visualizer
    let hueOffset = 0;
    function drawVisualizer() {
        if (!isPlaying) return;
        animationId = requestAnimationFrame(drawVisualizer);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = '#000';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 3;

        // Dynamic Gradient
        hueOffset += 2; // Speed of color change
        if (hueOffset > 360) hueOffset = 0;

        const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, `hsl(${hueOffset}, 100%, 50%)`);
        gradient.addColorStop(0.5, `hsl(${(hueOffset + 120) % 360}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${(hueOffset + 240) % 360}, 100%, 50%)`);

        canvasCtx.strokeStyle = gradient;
        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    // Progress Bar
    function updateProgress() {
        if (isPlaying) {
            const elapsed = audioCtx.currentTime - startTime;
            const duration = audioBuffer.duration;
            const percent = (elapsed / duration) * 100;

            progressBar.style.width = `${percent}%`;
            currentTimeEl.textContent = formatTime(elapsed);

            if (elapsed < duration) {
                requestAnimationFrame(updateProgress);
            }
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Knob Logic
    function setupKnob() {
        volumeKnob.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);

        // Touch support
        volumeKnob.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
        document.addEventListener('touchmove', (e) => drag(e.touches[0]));
        document.addEventListener('touchend', endDrag);
    }

    function startDrag(e) {
        // Check if target is knob or child
        // We'll just use the event attached to knob
        // But we need to check if we clicked ON the knob.
        // The event listener is on the knob, so e.target or e.currentTarget is fine.
        // However, we want to track mouse movement globally after down.
        if (e.target.closest('#volumeKnob')) {
            isDraggingKnob = true;
            startY = e.clientY;
            e.preventDefault(); // Prevent scrolling on touch
        }
    }

    function drag(e) {
        if (!isDraggingKnob) return;

        const deltaY = startY - e.clientY;
        // Sensitivity: 1 pixel = 1 degree
        let newRotation = currentRotation + deltaY;

        // Clamp rotation
        if (newRotation > 135) newRotation = 135;
        if (newRotation < -135) newRotation = -135;

        currentRotation = newRotation;
        startY = e.clientY; // Reset startY for relative movement

        updateKnobVisuals();
        updateVolume();
    }

    function endDrag() {
        isDraggingKnob = false;
    }

    function updateKnobVisuals() {
        volumeKnob.style.transform = `rotate(${currentRotation}deg)`;
    }

    function updateVolume() {
        // Map -135 to 135 -> 0 to 1
        // Range is 270 degrees
        // (Rotation + 135) / 270
        volume = (currentRotation + 135) / 270;
        if (gainNode) {
            gainNode.gain.value = volume;
        }
    }
});

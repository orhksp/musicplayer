const container = document.querySelector('.container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const cover = document.getElementById('cover');
const fileInput = document.getElementById('file-input');
const addSongBtn = document.getElementById('add-song-btn');
const progressBar = document.querySelector('.progress-bar');
const fillBar = document.querySelector('.fill-bar');
const visualizer = document.getElementById('visualizer');
const videoPlayer = document.getElementById('video-player');
const audio = new Audio();
let isPlaying = false;
let currentSongIndex = 0;

const songs = [];

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioContext.destination);
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function drawVisualizer() {
    const canvasCtx = visualizer.getContext('2d');
    const WIDTH = visualizer.width;
    const HEIGHT = visualizer.height;

    requestAnimationFrame(drawVisualizer);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = '#000';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        canvasCtx.fillStyle = '#1db954'; // Ses çubuklarının rengi
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
    }
}

drawVisualizer();

function loadSong(song) {
    if (song.file.endsWith('.mp4')) {
        videoPlayer.src = song.file;
        videoPlayer.style.display = 'block';
        audio.style.display = 'none';
        visualizer.style.display = 'none';
    } else {
        audio.src = song.file;
        videoPlayer.style.display = 'none';
        audio.style.display = 'block';
        visualizer.style.display = 'block';
    }
    document.querySelector('.song-name').textContent = song.name;
    document.querySelector('.time').textContent = `0:00 - ${song.length}`;
}

function playSong() {
    if (videoPlayer.style.display === 'block') {
        videoPlayer.play();
    } else {
        audio.play();
    }
    isPlaying = true;
    playBtn.classList.remove('fa-play');
    playBtn.classList.add('fa-pause');
    cover.classList.add('playing');
    audioContext.resume();
}

function pauseSong() {
    if (videoPlayer.style.display === 'block') {
        videoPlayer.pause();
    } else {
        audio.pause();
    }
    isPlaying = false;
    playBtn.classList.remove('fa-pause');
    playBtn.classList.add('fa-play');
    cover.classList.remove('playing');
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

prevBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(songs[currentSongIndex]);
    playSong();
});

nextBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(songs[currentSongIndex]);
    playSong();
});

document.getElementById('song-list').addEventListener('click', (e) => {
    if (e.target && e.target.nodeName === 'LI') {
        const index = e.target.getAttribute('data-index');
        currentSongIndex = parseInt(index);
        loadSong(songs[currentSongIndex]);
        playSong();
    } else if (e.target && e.target.classList.contains('delete-btn')) {
        const index = e.target.parentElement.getAttribute('data-index');
        songs.splice(index, 1);
        if (currentSongIndex >= songs.length) {
            currentSongIndex = songs.length - 1;
        }
        if (songs.length > 0) {
            loadSong(songs[currentSongIndex]);
            if (isPlaying) {
                playSong();
            }
        } else {
            audio.pause();
            isPlaying = false;
            document.querySelector('.song-name').textContent = '';
            document.querySelector('.time').textContent = '0:00 - 0:00';
            fillBar.style.width = '0%';
            cover.classList.remove('playing');
            playBtn.classList.remove('fa-pause');
            playBtn.classList.add('fa-play');
        }
        renderSongList();
    }
});

addSongBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const song = {
            name: file.name,
            length: 'Unknown',
            file: URL.createObjectURL(file)
        };
        songs.push(song);
        renderSongList();
        loadSong(song);
        playSong();
    }
});

audio.addEventListener('loadedmetadata', () => {
    const duration = formatTime(audio.duration);
    document.querySelector('.time').textContent = `0:00 - ${duration}`;
    songs[currentSongIndex].length = duration;
    renderSongList();
});

audio.addEventListener('timeupdate', () => {
    const currentTime = formatTime(audio.currentTime);
    const duration = formatTime(audio.duration);
    document.querySelector('.time').textContent = `${currentTime} - ${duration}`;
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    fillBar.style.width = `${progressPercent}%`;
});

audio.addEventListener('ended', () => {
    if (currentSongIndex < songs.length - 1) {
        currentSongIndex++;
        loadSong(songs[currentSongIndex]);
        playSong();
    } else {
        audio.pause();
        isPlaying = false;
        playBtn.classList.remove('fa-pause');
        playBtn.classList.add('fa-play');
        cover.classList.remove('playing');
    }
});

videoPlayer.addEventListener('ended', () => {
    if (currentSongIndex < songs.length - 1) {
        currentSongIndex++;
        loadSong(songs[currentSongIndex]);
        playSong();
    } else {
        videoPlayer.pause();
        isPlaying = false;
        playBtn.classList.remove('fa-pause');
        playBtn.classList.add('fa-play');
        cover.classList.remove('playing');
    }
});

progressBar.addEventListener('click', (e) => {
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
    if (!isPlaying) {
        playSong();
    }
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function renderSongList() {
    const songList = document.getElementById('song-list');
    songList.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.textContent = `${song.name} (${song.length})`;
        li.setAttribute('data-index', index);
        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = 'Sil';
        deleteBtn.classList.add('delete-btn');
        li.appendChild(deleteBtn);
        songList.appendChild(li);
    });
}

renderSongList();
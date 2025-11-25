'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './MusicPlayer.module.css';
import WaveformVisualizer from './WaveformVisualizer';
import LEDDisplay from './LEDDisplay';
import ControlPanel from './ControlPanel';

interface Song {
    title: string;
    file: string;
    artist: string;
}

export default function MusicPlayer() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const startTimeRef = useRef(0);
    const pauseTimeRef = useRef(0);

    // Initialize audio context and load songs
    useEffect(() => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(ctx.destination);
        gainNodeRef.current = gainNode;

        // Load songs
        fetch('/data/songs.json')
            .then(res => res.json())
            .then(data => {
                setSongs(data);
                if (data.length > 0) {
                    loadSong(0, data);
                }
            })
            .catch(err => console.error('Failed to load songs:', err));

        return () => {
            if (sourceNodeRef.current) {
                try {
                    sourceNodeRef.current.stop();
                } catch (e) { }
            }
            ctx.close();
        };
    }, []);

    const loadSong = async (index: number, songList: Song[] = songs) => {
        if (songList.length === 0) return;

        const song = songList[index];
        setCurrentSongIndex(index);
        setCurrentTime(0);
        pauseTimeRef.current = 0;

        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.stop();
            } catch (e) { }
            sourceNodeRef.current.disconnect();
        }

        setIsPlaying(false);

        try {
            const response = await fetch(song.file);
            const arrayBuffer = await response.arrayBuffer();
            const decodedAudio = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
            audioBufferRef.current = decodedAudio;
            setDuration(decodedAudio.duration);
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    };

    const playAudio = () => {
        if (!audioBufferRef.current || !audioCtxRef.current) return;

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const sourceNode = audioCtxRef.current.createBufferSource();
        sourceNode.buffer = audioBufferRef.current;
        sourceNode.connect(analyserRef.current!);
        analyserRef.current!.connect(gainNodeRef.current!);

        sourceNode.onended = () => {
            if (isPlaying && audioCtxRef.current) {
                const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
                if (elapsed >= audioBufferRef.current!.duration - 0.1) {
                    nextSong();
                }
            }
        };

        startTimeRef.current = audioCtxRef.current.currentTime - pauseTimeRef.current;
        sourceNode.start(0, pauseTimeRef.current);
        sourceNodeRef.current = sourceNode;
        setIsPlaying(true);
    };

    const pauseAudio = () => {
        if (sourceNodeRef.current && audioCtxRef.current) {
            sourceNodeRef.current.stop();
            pauseTimeRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
            setIsPlaying(false);
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    };

    const nextSong = () => {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * songs.length);
        } while (nextIndex === currentSongIndex && songs.length > 1);

        loadSongAndPlay(nextIndex);
    };

    const prevSong = () => {
        nextSong(); // Random play for previous as well
    };

    const loadSongAndPlay = async (index: number) => {
        await loadSong(index);
        // Wait a bit for the buffer to be ready
        setTimeout(() => {
            playAudio();
        }, 100);
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = newVolume;
        }
    };

    // Update current time
    useEffect(() => {
        if (!isPlaying || !audioCtxRef.current) return;

        const interval = setInterval(() => {
            const elapsed = audioCtxRef.current!.currentTime - startTimeRef.current;
            setCurrentTime(elapsed);
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying]);

    const currentSong = songs[currentSongIndex];

    return (
        <div className={styles.playerContainer}>
            <div className={styles.playerBranding}>香瓜音乐播放器</div>
            <div className={styles.visualizerSection}>
                <WaveformVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
            </div>
            <div className={styles.controlsSection}>
                <LEDDisplay
                    songTitle={currentSong?.title || 'READY'}
                    currentTime={currentTime}
                    duration={duration}
                />
                <ControlPanel
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    onNext={nextSong}
                    onPrev={prevSong}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                />
            </div>
        </div>
    );
}

'use client';

import styles from './LEDDisplay.module.css';

interface LEDDisplayProps {
    songTitle: string;
    currentTime: number;
    duration: number;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function LEDDisplay({ songTitle, currentTime, duration }: LEDDisplayProps) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={styles.ledDisplay}>
            <div className={styles.songInfo}>
                <span>{songTitle}</span>
            </div>
            <div className={styles.timeInfo}>
                <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
            </div>
            <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

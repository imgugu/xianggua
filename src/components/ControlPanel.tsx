'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    volume: number;
    onVolumeChange: (volume: number) => void;
}

export default function ControlPanel({
    isPlaying,
    onTogglePlay,
    onNext,
    onPrev,
    volume,
    onVolumeChange
}: ControlPanelProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [rotation, setRotation] = useState((volume * 270) - 135);
    const startYRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startYRef.current = e.clientY;
        e.preventDefault();
    };

    // Handle mouse events with useEffect
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = startYRef.current - e.clientY;
            let newRotation = rotation + deltaY;

            if (newRotation > 135) newRotation = 135;
            if (newRotation < -135) newRotation = -135;

            setRotation(newRotation);
            startYRef.current = e.clientY;

            // Update volume after setting rotation
            const newVolume = (newRotation + 135) / 270;
            onVolumeChange(newVolume);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, rotation, onVolumeChange]);

    return (
        <div className={styles.controlPanel}>
            <div className={styles.buttonsArea}>
                <button
                    className={`${styles.controlBtn} ${styles.prevBtn}`}
                    onClick={onPrev}
                    title="上一首"
                />
                <button
                    className={`${styles.controlBtn} ${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                    onClick={onTogglePlay}
                    title="播放/暂停"
                />
                <button
                    className={`${styles.controlBtn} ${styles.nextBtn}`}
                    onClick={onNext}
                    title="下一首"
                />
            </div>
            <div className={styles.knobArea}>
                <div className={styles.knobContainer}>
                    <div
                        className={styles.knob}
                        onMouseDown={handleMouseDown}
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        <div className={styles.knobIndicator} />
                    </div>
                    <div className={styles.knobLabel}>VOLUME</div>
                </div>
            </div>
        </div>
    );
}

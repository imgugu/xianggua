'use client';

import { useEffect, useRef } from 'react';
import styles from './WaveformVisualizer.module.css';

interface WaveformVisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
}

export default function WaveformVisualizer({ analyser, isPlaying }: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hueOffsetRef = useRef(0);
    const animationIdRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isPlaying || !analyser || !canvasRef.current) {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            return;
        }

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const draw = () => {
            if (!isPlaying) return;
            animationIdRef.current = requestAnimationFrame(draw);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = '#000';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 3;

            // Dynamic gradient
            hueOffsetRef.current += 2;
            if (hueOffsetRef.current > 360) hueOffsetRef.current = 0;

            const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, `hsl(${hueOffsetRef.current}, 100%, 50%)`);
            gradient.addColorStop(0.5, `hsl(${(hueOffsetRef.current + 120) % 360}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${(hueOffsetRef.current + 240) % 360}, 100%, 50%)`);

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
        };

        draw();

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, [analyser, isPlaying]);

    return <canvas ref={canvasRef} className={styles.visualizerCanvas} />;
}

import { useCallback, useEffect, useRef, useState } from 'react';

export const useSimulationPlayback = (rainfallLength: number) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const simulationTimerRef = useRef<number | null>(null);

  const togglePlayback = useCallback(() => {
    if (rainfallLength === 0) return;
    setIsPlaying(prev => !prev);
  }, [rainfallLength]);

  useEffect(() => {
    if (isPlaying && rainfallLength > 0) {
      simulationTimerRef.current = window.setInterval(() => {
        setCurrentDayIndex(prev => (prev + 1) % rainfallLength);
      }, 100);
    } else if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    };
  }, [isPlaying, rainfallLength]);

  return {
    currentDayIndex,
    isPlaying,
    setCurrentDayIndex,
    setIsPlaying,
    togglePlayback,
  };
};

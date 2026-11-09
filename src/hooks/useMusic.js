import { useEffect, useRef, useState } from "react";
import { SONGS } from "../data/mockData";

export default function useMusic() {
  const [audio] = useState(() => new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const currentRef = useRef(0);

  const loadSong = (index, autoplay = true) => {
    currentRef.current = index;
    audio.src = SONGS[index].src;
    if (autoplay) audio.play().catch(() => {});
  };

  const toggle = () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  useEffect(() => {
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => loadSong((currentRef.current + 1) % SONGS.length);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

  return { isPlaying, loadSong, toggle };
}

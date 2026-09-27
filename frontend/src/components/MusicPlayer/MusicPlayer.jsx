import logo from '../../assets/Logo.png';
import greenMusic from '../../assets/audio-green.mp3';
import yellowMusic from '../../assets/audio-yellow.mp3';
import redMusic from '../../assets/audio-red.mp3';

import { useState } from 'react';
const MusicPlayer = () => {
  const [audioObj, setAudioObj] = useState(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(null);
  function play(url) {
    if (isPlaying) {
      if (url === currentUrl) {
        audioObj.pause();
        setIsPlaying(false);
        setCurrentUrl(null);
      } else {
        audioObj.pause();
        const newAudio = new Audio(url);
        setAudioObj(newAudio);
        newAudio.loop = true;
        newAudio.play();
        setCurrentUrl(url);
      }
    } else {
      const newAudio = new Audio(url);
      setAudioObj(newAudio);
      newAudio.loop = true;
      newAudio.play();
      setIsPlaying(true);
      setCurrentUrl(url);
    }
  }

  return (
    <div>
      <img src={logo} style={{ height: '33px' }} />
      <div className="text-xl">How are you feeling today?</div>
      <div className="flex gap-4">
        <button
          onClick={() => play(greenMusic)}
          className="flex-1 rounded-md border px-3 py-1.5  font-medium border-slate-300 bg-green-500 hover:border-slate-400 text-white cursor-pointer"
        >
          Good!
        </button>
        <button
          onClick={() => play(yellowMusic)}
          className="flex-1 rounded-md border px-3 py-1.5  border-slate-300 bg-yellow-500 hover:border-slate-400 text-white  cursor-pointer"
        >
          I'm ok
        </button>
        <button
          onClick={() => play(redMusic)}
          className="flex-1 rounded-md border px-3 py-1.5   border-slate-300 bg-red-500 hover:border-slate-400 text-white cursor-pointer"
        >
          Heartbroken!
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer;

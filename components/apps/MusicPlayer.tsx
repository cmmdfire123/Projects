import React, { useState, useEffect } from 'react';
import { SONGS } from '../../constants';
import { Song } from '../../types';

export const MusicPlayer: React.FC = () => {
    const [currentSong, setCurrentSong] = useState<Song>(SONGS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(p => (p >= 100 ? 0 : p + 1));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const playNext = () => {
        const idx = SONGS.findIndex(s => s.id === currentSong.id);
        const next = SONGS[(idx + 1) % SONGS.length];
        setCurrentSong(next);
        setProgress(0);
    };

    return (
        <div className="h-full bg-[#222] flex flex-col p-2 select-none border border-gray-600">
            {/* Display */}
            <div className="bg-black border-2 border-gray-600 h-16 mb-2 p-2 relative overflow-hidden">
                <div className="text-green-500 font-retro text-lg">{isPlaying ? `Playing: ${currentSong.title}` : 'PAUSED'}</div>
                <div className="text-green-700 font-mono text-xs">{currentSong.artist} ({currentSong.duration})</div>
                {/* Visualizer bars */}
                <div className="absolute bottom-0 right-0 flex gap-0.5 items-end h-8 opacity-50">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} 
                            className="w-2 bg-green-500 transition-all duration-75" 
                            style={{ height: isPlaying ? `${Math.random() * 100}%` : '5%' }} 
                        />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-2">
                <button onClick={() => {if(isPlaying) playNext(); else setIsPlaying(true);}} className="flex-1 bg-gray-300 hover:bg-white text-xs font-bold py-1 border-b-4 border-gray-500 active:border-b-0 active:translate-y-1">
                    {isPlaying ? '⏭ SKIP' : '▶ PLAY'}
                </button>
                <button onClick={() => setIsPlaying(false)} className="flex-1 bg-gray-300 hover:bg-white text-xs font-bold py-1 border-b-4 border-gray-500 active:border-b-0 active:translate-y-1">
                    ⏹ STOP
                </button>
            </div>

            {/* Playlist */}
            <div className="flex-1 bg-black overflow-y-auto text-xs font-mono text-green-300 p-1 border border-gray-700">
                {SONGS.map((s, i) => (
                    <div 
                        key={s.id} 
                        onClick={() => {setCurrentSong(s); setIsPlaying(true); setProgress(0);}}
                        className={`cursor-pointer hover:bg-green-900/30 px-1 truncate ${currentSong.id === s.id ? 'bg-green-900/50 text-white' : ''}`}
                    >
                        {i+1}. {s.title} - {s.artist}
                    </div>
                ))}
            </div>
        </div>
    );
};
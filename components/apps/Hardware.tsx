
import React, { useState } from 'react';
import { PlayerStats, HardwarePart } from '../../types';
import { HARDWARE_PARTS } from '../../constants';

interface HardwareProps {
    player: PlayerStats;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
}

export const Hardware: React.FC<HardwareProps> = ({ player, setPlayer }) => {
    const [selectedSlot, setSelectedSlot] = useState<'cpu' | 'ram' | 'cooling' | 'network' | null>(null);

    const parts = Object.values(HARDWARE_PARTS);
    const availableParts = selectedSlot ? parts.filter(p => p.type === selectedSlot) : [];

    const getEquippedPart = (type: 'cpu' | 'ram' | 'cooling' | 'network') => {
        return HARDWARE_PARTS[player.hardware[type]];
    };

    const buyPart = (part: HardwarePart) => {
        if (player.money >= part.cost) {
            setPlayer(prev => ({
                ...prev,
                money: prev.money - part.cost,
                hardware: {
                    ...prev.hardware,
                    [part.type]: part.id
                }
            }));
        } else {
            alert("Insufficient Funds");
        }
    };

    return (
        <div className="h-full bg-[#111] text-green-500 font-mono flex flex-col p-4 select-none">
            {/* MOTHERBOARD VISUAL */}
            <div className="flex-1 border-4 border-green-800 rounded-lg p-4 relative bg-green-900/10 mb-4 grid grid-cols-2 grid-rows-2 gap-4">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10 pointer-events-none"></div>
                
                {/* CPU SLOT */}
                <div 
                    onClick={() => setSelectedSlot('cpu')}
                    className={`border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-green-900/30 ${selectedSlot === 'cpu' ? 'border-yellow-400 bg-green-900/40 shadow-[0_0_15px_rgba(255,255,0,0.3)]' : 'border-green-600'}`}
                >
                    <div className="text-2xl mb-2">⚡ CPU</div>
                    <div className="text-sm font-bold text-white">{getEquippedPart('cpu').name}</div>
                    <div className="text-xs text-green-400">AP Regen: +{getEquippedPart('cpu').stat}</div>
                </div>

                {/* RAM SLOT */}
                <div 
                    onClick={() => setSelectedSlot('ram')}
                    className={`border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-green-900/30 ${selectedSlot === 'ram' ? 'border-yellow-400 bg-green-900/40 shadow-[0_0_15px_rgba(255,255,0,0.3)]' : 'border-green-600'}`}
                >
                    <div className="text-2xl mb-2">💾 RAM</div>
                    <div className="text-sm font-bold text-white">{getEquippedPart('ram').name}</div>
                    <div className="text-xs text-green-400">Max AP: {getEquippedPart('ram').stat}</div>
                </div>

                {/* COOLING SLOT */}
                <div 
                    onClick={() => setSelectedSlot('cooling')}
                    className={`border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-green-900/30 ${selectedSlot === 'cooling' ? 'border-yellow-400 bg-green-900/40 shadow-[0_0_15px_rgba(255,255,0,0.3)]' : 'border-green-600'}`}
                >
                    <div className="text-2xl mb-2">❄️ COOLING</div>
                    <div className="text-sm font-bold text-white">{getEquippedPart('cooling').name}</div>
                    <div className="text-xs text-green-400">Heat Dissip: +{getEquippedPart('cooling').stat}</div>
                </div>

                {/* NETWORK SLOT */}
                <div 
                    onClick={() => setSelectedSlot('network')}
                    className={`border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-green-900/30 ${selectedSlot === 'network' ? 'border-yellow-400 bg-green-900/40 shadow-[0_0_15px_rgba(255,255,0,0.3)]' : 'border-green-600'}`}
                >
                    <div className="text-2xl mb-2">🌐 NET</div>
                    <div className="text-sm font-bold text-white">{getEquippedPart('network').name}</div>
                    <div className="text-xs text-green-400">Trace Red: -{getEquippedPart('network').stat}%</div>
                </div>
            </div>

            {/* SHOP PANE */}
            <div className="h-1/3 border-t-2 border-green-800 pt-2 overflow-auto">
                <h3 className="text-yellow-400 font-bold mb-2">
                    {selectedSlot ? `UPGRADE ${selectedSlot.toUpperCase()}` : 'SELECT A COMPONENT SLOT TO UPGRADE'}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {availableParts.map(part => {
                        const equipped = player.hardware[part.type] === part.id;
                        return (
                            <div key={part.id} className="flex justify-between items-center bg-green-900/20 p-2 rounded border border-green-700">
                                <div>
                                    <span className="font-bold text-white">{part.name}</span>
                                    <span className="ml-2 text-xs text-gray-400">{part.desc}</span>
                                </div>
                                {equipped ? (
                                    <span className="text-xs text-gray-500 uppercase font-bold px-3">Installed</span>
                                ) : (
                                    <button 
                                        onClick={() => buyPart(part)}
                                        className="bg-yellow-600 text-black px-3 py-1 text-xs font-bold hover:bg-yellow-500 rounded"
                                    >
                                        INSTALL ${part.cost}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

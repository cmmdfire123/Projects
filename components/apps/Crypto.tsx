
import React from 'react';
import { PlayerStats, WorldState } from '../../types';

interface CryptoProps {
    player: PlayerStats;
    worldState: WorldState;
}

export const Crypto: React.FC<CryptoProps> = ({ player, worldState }) => {
    const activeBots = player.activeBots.filter(b => b.includes('miner'));
    const miningRate = activeBots.length * 5;

    return (
        <div className="h-full bg-slate-900 text-purple-400 font-mono flex flex-col relative overflow-hidden">
             {/* Map Background (Simulated) */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center pointer-events-none"></div>
             
             <div className="z-10 p-4 border-b border-purple-800 bg-slate-900/80 backdrop-blur">
                <div className="flex justify-between items-end">
                    <h1 className="text-2xl font-retro text-white">BOTNET_MANAGER</h1>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">HASH RATE</div>
                        <div className="text-xl font-bold text-green-400">{miningRate} MH/s (${miningRate}/tick)</div>
                    </div>
                </div>
             </div>

             <div className="flex-1 p-4 overflow-auto z-10">
                <h3 className="text-xs font-bold text-purple-500 mb-2 tracking-widest">ACTIVE NODES</h3>
                <div className="grid grid-cols-2 gap-2">
                    {activeBots.map((bot, i) => (
                        <div key={i} className="bg-black/50 border border-purple-600 p-2 rounded flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <div>
                                <div className="text-xs font-bold text-white">Node_0{i+1}</div>
                                <div className="text-[10px] text-gray-400">IP: 192.168.1.{50+i}</div>
                             </div>
                        </div>
                    ))}
                    {activeBots.length === 0 && (
                        <div className="text-gray-500 text-xs italic">No active miners. Deploy scripts via Terminal.</div>
                    )}
                </div>

                <h3 className="text-xs font-bold text-red-500 mt-6 mb-2 tracking-widest">RANSOMWARE CAMPAIGNS</h3>
                {worldState.activeRansomware.length === 0 ? (
                     <div className="text-gray-500 text-xs italic">No active campaigns.</div>
                ) : (
                    worldState.activeRansomware.map(r => (
                        <div key={r.id} className="bg-red-900/20 border border-red-600 p-2 rounded mb-2">
                            <div className="flex justify-between text-xs font-bold text-white">
                                <span>TARGET: {r.targetIp}</span>
                                <span>VAL: ${r.potentialValue}</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1 mt-1">
                                <div style={{width: `${(r.timeLeft/120)*100}%`}} className="h-full bg-red-500 transition-all"></div>
                            </div>
                            <div className="text-[10px] text-red-400 text-right mt-1">{r.timeLeft}s remaining</div>
                        </div>
                    ))
                )}
             </div>
        </div>
    );
};

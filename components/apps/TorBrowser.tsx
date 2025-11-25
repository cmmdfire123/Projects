
import React, { useState } from 'react';
import { COMMANDS, NEWS_HEADLINES } from '../../constants';
import { PlayerStats, LocalFile, WorldState } from '../../types';

interface TorProps {
  player: PlayerStats;
  files: LocalFile[];
  buyCommand: (id: string, cost: number) => void;
  sellFile: (id: string, adjustedPrice: number) => void;
  inventory: string[];
  worldState: WorldState;
}

export const TorBrowser: React.FC<TorProps> = ({ player, files, buyCommand, sellFile, inventory, worldState }) => {
  const [tab, setTab] = useState<'market' | 'news' | 'broker' | 'bots'>('news');

  const availableItems = Object.values(COMMANDS).filter(cmd => 
    !inventory.includes(cmd.id) && 
    cmd.type !== 'sys' && 
    cmd.type !== 'shell' && 
    cmd.type !== 'passive'
  );

  const availableBots = Object.values(COMMANDS).filter(cmd => cmd.type === 'passive' && !player.activeBots.includes(cmd.id));

  const getPrice = (baseVal: number) => Math.floor(baseVal * 10 * worldState.marketMultiplier);

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-300 font-jersey select-none">
      {/* Browser Bar */}
      <div className="bg-[#2d2d2d] p-2 flex gap-2 border-b border-black shadow-md items-center">
        <div className="flex gap-1 items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 cursor-pointer"></div>
        </div>
        <div className="flex-1 bg-black rounded flex items-center px-2 py-1 border border-gray-700">
            <span className="text-green-600 mr-2 text-xs">🔒 ONION</span>
            <input 
                type="text" 
                value={`http://silkroad.x7z/${tab}`} 
                readOnly 
                className="flex-1 bg-transparent text-sm text-green-700 font-tiny5 outline-none"
            />
        </div>
      </div>

      {/* Nav */}
      <div className="flex bg-black border-b border-gray-800">
        <button onClick={() => setTab('news')} className={`flex-1 py-2 text-sm font-bold transition-colors ${tab === 'news' ? 'bg-[#1a1a1a] text-white border-t-2 border-red-500' : 'hover:bg-[#111] text-gray-500'}`}>NEWS</button>
        <button onClick={() => setTab('market')} className={`flex-1 py-2 text-sm font-bold transition-colors ${tab === 'market' ? 'bg-[#1a1a1a] text-white border-t-2 border-yellow-500' : 'hover:bg-[#111] text-gray-500'}`}>EXPLOITS</button>
        <button onClick={() => setTab('bots')} className={`flex-1 py-2 text-sm font-bold transition-colors ${tab === 'bots' ? 'bg-[#1a1a1a] text-white border-t-2 border-purple-500' : 'hover:bg-[#111] text-gray-500'}`}>BOTNET</button>
        <button onClick={() => setTab('broker')} className={`flex-1 py-2 text-sm font-bold transition-colors ${tab === 'broker' ? 'bg-[#1a1a1a] text-white border-t-2 border-blue-500' : 'hover:bg-[#111] text-gray-500'}`}>BROKER</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#1a1a1a] relative scrollbar-thin scrollbar-thumb-gray-700">
        <div className="sticky top-0 right-0 float-right z-10 bg-black/80 backdrop-blur border border-green-800 px-3 py-1 rounded text-green-400 font-bold shadow-lg mb-2 text-sm">
            BTC Wallet: ${player.money}
        </div>

        {tab === 'news' && (
            <div className="space-y-4 mt-8 clear-both">
                <h1 className="text-3xl font-bold text-red-600 uppercase border-b border-red-900 pb-2 flex justify-between">
                    Underground Feed 
                    <span className="text-sm text-gray-600 font-sans tracking-normal mt-2">Market Volatility: {worldState.marketMultiplier.toFixed(2)}x</span>
                </h1>
                {NEWS_HEADLINES.map((news, i) => (
                    <div key={i} className="group relative border-l-2 border-gray-700 pl-4 py-2 hover:border-red-500 transition-colors">
                        <span className="text-xs text-gray-500 block mb-1">2077-10-{worldState.day} // ANONYMOUS</span>
                        <p className="text-lg text-gray-300 group-hover:text-white transition-colors">{news}</p>
                    </div>
                ))}
            </div>
        )}

        {tab === 'market' && (
            <div className="mt-8 clear-both">
                <h2 className="text-2xl text-yellow-500 mb-4 border-b border-yellow-900 pb-2">ZERO-DAY EXPLOITS</h2>
                <div className="grid grid-cols-1 gap-3">
                    {availableItems.length === 0 ? (
                        <div className="text-center text-gray-500 italic">Inventory Depleted. Check back later.</div>
                    ) : (
                        availableItems.map(item => {
                            const price = getPrice(item.val || 10);
                            return (
                            <div key={item.id} className="flex justify-between items-center bg-black/20 p-3 rounded border border-gray-700 hover:border-yellow-500/50 hover:bg-black/40 transition-all group">
                                <div>
                                    <div className="font-bold text-green-400 text-lg group-hover:text-yellow-400">{item.name}</div>
                                    <div className="text-sm text-gray-400">{item.desc}</div>
                                    <div className="text-xs text-blue-400 mt-1">COST: {item.cost} RAM | HEAT: {item.heat} {item.isConsumable && <span className="text-red-400 ml-2">[SINGLE USE]</span>}</div>
                                </div>
                                <button 
                                    onClick={() => buyCommand(item.id, price)}
                                    className="bg-yellow-900/20 hover:bg-yellow-600 text-yellow-200 px-4 py-2 text-sm font-bold border border-yellow-800 hover:border-yellow-500 rounded transition-all"
                                >
                                    BUY ${price}
                                </button>
                            </div>
                        )})
                    )}
                </div>
            </div>
        )}

        {tab === 'bots' && (
             <div className="mt-8 clear-both">
                <h2 className="text-2xl text-purple-500 mb-4 border-b border-purple-900 pb-2">AUTOMATED SCRIPTS</h2>
                <div className="grid grid-cols-1 gap-3">
                    {availableBots.map(bot => {
                         const price = Math.floor(500 * worldState.marketMultiplier);
                         return (
                         <div key={bot.id} className="flex justify-between items-center bg-black/20 p-3 rounded border border-gray-700 hover:border-purple-500/50 transition-all">
                             <div>
                                 <div className="font-bold text-purple-400 text-lg">{bot.name}</div>
                                 <div className="text-sm text-gray-400">{bot.desc}</div>
                             </div>
                             <button 
                                 onClick={() => buyCommand(bot.id, price)}
                                 className="bg-purple-900/20 hover:bg-purple-600 text-purple-200 px-4 py-2 text-sm font-bold border border-purple-800 rounded transition-all"
                             >
                                 DEPLOY ${price}
                             </button>
                         </div>
                    )})}
                    {availableBots.length === 0 && <div className="text-gray-500 italic text-center">All available scripts deployed.</div>}
                </div>
             </div>
        )}

        {tab === 'broker' && (
            <div className="mt-8 clear-both">
                <h2 className="text-2xl text-blue-500 mb-4 border-b border-blue-900 pb-2">DATA BROKERAGE</h2>
                
                {/* BUY LEAKED DB */}
                <div className="bg-blue-900/20 p-3 rounded border border-blue-600 mb-6 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-blue-300 text-lg">LEAKED_CORP_DB.zip</div>
                        <div className="text-sm text-gray-400">Contains valid high-value targets</div>
                    </div>
                    <button 
                        onClick={() => buyCommand('db_dump', 200)}
                        className="bg-blue-600 text-white px-3 py-1 text-sm font-bold rounded hover:bg-blue-500"
                    >
                        PURCHASE $200
                    </button>
                </div>

                <div className="bg-blue-900/10 p-2 mb-4 rounded text-sm text-blue-300 border border-blue-900">
                    Market Demand: <span className="font-bold text-white">{Math.round(worldState.marketMultiplier * 100)}%</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {files.map(file => {
                        const sellPrice = Math.floor(file.value * worldState.marketMultiplier);
                        return (
                        <div key={file.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-gray-700 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{file.type === 'binary' ? '💾' : '📄'}</span>
                                <div>
                                    <div className="text-lg font-bold text-gray-200">{file.name}</div>
                                    <div className="text-xs text-gray-500">Origin: {file.originIp || 'Unknown'} | Raw Val: ${file.value}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => sellFile(file.id, sellPrice)}
                                className="bg-green-900/30 hover:bg-green-600 text-green-400 hover:text-white px-3 py-1 text-sm border border-green-800 rounded transition-all font-bold"
                            >
                                SELL OFFER ${sellPrice}
                            </button>
                        </div>
                    )})}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
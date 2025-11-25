
import React, { useState, useEffect, useRef } from 'react';
import { AppId, WindowState, BreachState, WifiNetwork } from '../types';
import { WIFI_SSIDS, TUTORIAL_STEPS, COMMANDS } from '../constants';

// --- RAID OVERLAY ---
export const RaidOverlay: React.FC<{ active: boolean, timer: number }> = ({ active, timer }) => {
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-[999999] flex flex-col items-center justify-center bg-red-900/90 mix-blend-multiply animate-pulse pointer-events-none font-jersey">
       <div className="text-9xl text-red-500 font-bold animate-bounce">RAID IN PROGRESS</div>
       <div className="text-6xl text-white mt-8 border-4 border-white p-4">
          WIPE DRIVE: {timer}s
       </div>
       <div className="text-2xl text-red-300 mt-4 font-tiny5">TYPE 'wipe_drive' IN TERMINAL TO SURVIVE</div>
    </div>
  );
};

// --- CRASH SCREEN (BSOD) ---
export const CrashScreen: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div className="absolute inset-0 z-[9999999] bg-blue-800 text-white font-tiny5 p-20 flex flex-col cursor-none">
            <h1 className="text-8xl mb-10">:(</h1>
            <h2 className="text-4xl mb-8">Your PC ran into a problem and needs to restart.</h2>
            <p className="text-xl mb-4">CRITICAL_PROCESS_DIED</p>
            <p className="text-lg">Error Code: 0xDEADBEEF</p>
            <p className="text-lg mt-8 animate-pulse">Rebooting...</p>
        </div>
    );
};

// --- BREACH ALERT ---
export const BreachAlert: React.FC<{ breach: BreachState }> = ({ breach }) => {
  if (!breach.active) return null;

  let statusText = 'BREACHING FIREWALL...';
  if (breach.progress > 30) statusText = 'LOCATING FILE SYSTEM...';
  if (breach.progress > 60) statusText = `DOWNLOADING: ${breach.targetFileName}`;
  if (breach.progress >= 100) statusText = 'DOWNLOAD COMPLETE.';

  return (
    <div className="absolute bottom-12 right-4 w-72 bg-gray-900 border-2 border-red-600 shadow-[0_0_20px_rgba(255,0,0,0.5)] p-3 z-[99999] font-tiny5 flex flex-col gap-2 animate-pulse">
        <div className="flex items-center gap-2 text-red-500 font-bold border-b border-red-800 pb-1">
            <span className="text-xl">⚠️</span>
            <span>SECURITY ALERT</span>
        </div>
        <div className="text-xs text-red-300 font-bold min-h-[1.5em]">{statusText}</div>
        
        <div className="w-full h-4 bg-gray-800 border border-gray-600 relative overflow-hidden">
             <div 
                className="h-full bg-red-600 transition-all duration-200 ease-linear"
                style={{ width: `${breach.progress}%` }}
             ></div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
            <span>THREAT LEVEL: CRITICAL</span>
            <span>{Math.floor(breach.progress)}%</span>
        </div>
    </div>
  );
};

// --- START MENU / HELP WINDOW ---
interface StartMenuProps {
    inventory: string[];
    onSave: (slotId: string) => void;
    onLoad: (slotId: string) => void;
    onExport: () => void;
    onImport: (file: File) => void;
    availableSaves: string[];
}

export const StartMenuWindow: React.FC<StartMenuProps> = ({ inventory, onSave, onLoad, onExport, onImport, availableSaves }) => {
    const [tab, setTab] = useState<'tutorial' | 'arsenal' | 'system'>('tutorial');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    return (
        <div className="flex flex-col h-full bg-gray-800 text-white font-jersey">
            <div className="flex border-b border-gray-600">
                <button onClick={() => setTab('tutorial')} className={`flex-1 p-2 text-lg font-bold ${tab === 'tutorial' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>TUTORIAL</button>
                <button onClick={() => setTab('arsenal')} className={`flex-1 p-2 text-lg font-bold ${tab === 'arsenal' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>ARSENAL</button>
                <button onClick={() => setTab('system')} className={`flex-1 p-2 text-lg font-bold ${tab === 'system' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>SYSTEM</button>
            </div>
            <div className="flex-1 overflow-auto p-4">
                {tab === 'tutorial' && (
                    <div className="space-y-4">
                        {TUTORIAL_STEPS.map((step, i) => (
                            <div key={i} className="border-b border-gray-600 pb-2">
                                <h3 className="text-yellow-400 font-bold text-xl">{i+1}. {step.title}</h3>
                                <p className="text-base text-gray-300">{step.text}</p>
                            </div>
                        ))}
                    </div>
                )}
                {tab === 'arsenal' && (
                    <div className="grid grid-cols-1 gap-2 font-tiny5">
                        {inventory.map(cmdId => {
                            const cmd = COMMANDS[cmdId];
                            if(!cmd) return null;
                            return (
                                <div key={cmdId} className="bg-black/30 p-2 rounded border border-gray-600 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-green-400 text-lg">{cmd.name}</div>
                                        <div className="text-sm text-gray-400">{cmd.desc}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-yellow-500">COST: {cmd.cost} RAM</div>
                                        <div className="text-sm text-red-400">HEAT: {cmd.heat}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                {tab === 'system' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-black/20 p-4 border border-gray-600 rounded">
                            <h3 className="font-bold text-yellow-500 mb-2 text-xl">LOCAL STORAGE SLOTS</h3>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {['save001', 'save002', 'save003'].map(slot => (
                                    <div key={slot} className="flex flex-col gap-1">
                                        <button 
                                            onClick={() => onSave(slot)}
                                            className="bg-green-700 hover:bg-green-600 text-white text-sm py-2 px-1 rounded font-bold transition-colors"
                                        >
                                            SAVE ({slot})
                                        </button>
                                        <button 
                                            onClick={() => onLoad(slot)}
                                            disabled={!availableSaves.includes(slot)}
                                            className={`text-sm py-2 px-1 rounded font-bold transition-colors ${availableSaves.includes(slot) ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                        >
                                            LOAD
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 border border-gray-600 rounded">
                            <h3 className="font-bold text-blue-500 mb-2 text-xl">FILE SYSTEM (JSON)</h3>
                            <p className="text-sm text-gray-400 mb-4">Export data to a physical file in your project folder.</p>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={onExport}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <span>⬇️</span> EXPORT .JSON
                                </button>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <span>⬆️</span> IMPORT .JSON
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".json"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) onImport(e.target.files[0]);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ICONS ---
interface DesktopIconProps {
  id: string;
  appId: AppId;
  label: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  onOpen: (id: AppId) => void;
  onMove: (id: string, x: number, y: number) => void;
  notificationCount?: number;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ id, appId, label, icon, position, onOpen, onMove, notificationCount }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState(position);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
    if (!isDragging) {
        setCurrentPos(position);
    }
  }, [position, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); 
    
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...currentPos };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }

      if (hasMoved.current) {
        const newX = initialPos.current.x + dx;
        const newY = initialPos.current.y + dy;
        setCurrentPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);

      if (hasMoved.current) {
        const dx = ev.clientX - dragStart.current.x;
        const dy = ev.clientY - dragStart.current.y;
        
        let snapX = Math.round((initialPos.current.x + dx) / 80) * 80;
        let snapY = Math.round((initialPos.current.y + dy) / 80) * 80;
        
        snapX = Math.max(0, Math.min(snapX, 720));
        snapY = Math.max(0, Math.min(snapY, 480));

        onMove(id, snapX, snapY);
      } else {
        onOpen(appId);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      onMouseDown={handleMouseDown}
      style={{ left: currentPos.x, top: currentPos.y }}
      className={`absolute flex flex-col items-center justify-center w-20 h-20 hover:bg-white/10 rounded group transition-colors select-none cursor-pointer ${isDragging ? 'z-50 opacity-80 scale-105' : 'z-0'}`}
    >
      <div className="w-12 h-12 flex items-center justify-center text-green-400 group-hover:text-green-300 mb-1 drop-shadow-[0_0_5px_rgba(0,255,0,0.8)] transition-transform group-active:scale-95 pointer-events-none">
        {icon}
      </div>
      <span className="text-xs text-green-400 font-jersey tracking-widest bg-black/50 px-1 rounded shadow-sm pointer-events-none truncate max-w-full">{label}</span>
      {notificationCount && notificationCount > 0 ? (
        <div className="absolute top-2 right-4 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse border border-black shadow-lg z-10 pointer-events-none">
          {notificationCount}
        </div>
      ) : null}
    </div>
  );
};

// --- WINDOW ---
interface WindowProps {
  state: WindowState;
  onClose: (id: AppId) => void;
  onFocus: (id: AppId) => void;
  onMove: (id: AppId, x: number, y: number) => void;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ state, onClose, onFocus, onMove, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus(state.id); 
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - state.position.x,
      y: e.clientY - state.position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
        newX = Math.max(0, Math.min(newX, 750));
        newY = Math.max(0, Math.min(newY, 550));
        onMove(state.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, state.id, onMove]);

  if (!state.isOpen) return null;

  return (
    <div 
      className="absolute flex flex-col bg-black border-2 border-green-600 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
      style={{
        left: state.position.x,
        top: state.position.y,
        width: state.id === AppId.TERMINAL ? '640px' : state.id === AppId.HARDWARE ? '600px' : state.id === AppId.START_MENU ? '400px' : '520px',
        height: state.id === AppId.TERMINAL ? '420px' : state.id === AppId.HARDWARE ? '500px' : state.id === AppId.MUSIC ? '200px' : '380px',
        zIndex: state.zIndex,
        display: state.isMinimized ? 'none' : 'flex',
      }}
      onMouseDown={() => onFocus(state.id)}
    >
      <div 
        className={`h-8 flex items-center justify-between px-2 cursor-grab select-none active:cursor-grabbing transition-colors ${isDragging ? 'bg-green-600' : 'bg-green-800'}`}
        onMouseDown={handleMouseDown}
      >
        <span className="text-black font-bold font-jersey uppercase tracking-widest text-lg pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 bg-black rounded-full"></span>
          {state.title}
        </span>
        <div className="flex gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); onClose(state.id); }}
            className="w-4 h-4 bg-red-500 border border-black hover:bg-red-400 shadow-inner active:bg-red-700"
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-1 relative bg-black/95">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
        {children}
      </div>
    </div>
  );
};

// --- TASKBAR ---
interface TaskbarProps {
  windows: WindowState[];
  onToggle: (id: AppId) => void;
  onStart: () => void;
  time: string;
  onQueueCommand: (cmd: string) => void;
  onShutdown: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ windows, onToggle, onStart, time, onQueueCommand, onShutdown }) => {
  const [showWifi, setShowWifi] = useState(false);
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);

  useEffect(() => {
    const nets: WifiNetwork[] = WIFI_SSIDS.map((ssid, i) => ({
      ssid,
      strength: Math.floor(Math.random() * 4) + 1,
      security: i % 3 === 0 ? 'OPEN' : 'WPA2',
      ip: `192.168.1.${100 + i}`
    }));
    setNetworks(nets);
  }, []);

  const handleConnect = (ip: string) => {
    onQueueCommand(`connect ${ip}`);
    setShowWifi(false);
  };

  return (
    <div className="absolute bottom-0 w-full h-10 bg-[#111] border-t-2 border-green-800 flex items-center px-2 z-[99999] select-none shadow-[0_-5px_10px_rgba(0,0,0,0.5)] font-jersey">
      {/* START ICON */}
      <button 
        onClick={onStart}
        className="h-8 w-10 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors mr-2 group"
        title="Start Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6 fill-green-600 group-hover:fill-green-400 drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">
            <path d="M22,22V6l-14,2v14H22z M24,6v16h16V2L24,6z M8,24v14l14,2V24H8z M24,40l16-2V24H24V40z"/>
        </svg>
      </button>

      <div className="flex-1 flex gap-2 overflow-x-auto px-2 border-l border-gray-700">
        {windows.filter(w => w.isOpen).map(w => (
          <button
            key={w.id}
            onClick={() => onToggle(w.id)}
            className={`px-3 h-7 min-w-[120px] max-w-[150px] flex items-center gap-2 border text-lg transition-all truncate ${!w.isMinimized ? 'bg-green-900/40 border-green-500 text-green-300 shadow-[inset_0_0_10px_rgba(0,255,0,0.1)]' : 'bg-[#0a0a0a] border-gray-700 text-gray-500 hover:bg-gray-800'}`}
          >
             <span className="truncate">{w.title}</span>
          </button>
        ))}
      </div>

      {/* SYSTEM TRAY */}
      <div className="flex items-center gap-2 border-l border-gray-700 pl-2">
        <div className="relative">
          <button 
            onClick={() => setShowWifi(!showWifi)}
            className={`p-1 hover:bg-gray-800 rounded ${showWifi ? 'text-green-400' : 'text-gray-400'}`}
          >
            📶
          </button>
          {showWifi && (
            <div className="absolute bottom-10 right-0 w-64 bg-black border border-green-600 shadow-xl p-2 z-[100000]">
               <div className="text-sm font-bold text-green-500 border-b border-green-900 pb-1 mb-1">WI-FI NETWORKS</div>
               {networks.map((net, i) => (
                 <div key={i} className="flex justify-between items-center p-2 hover:bg-green-900/20 text-xs text-gray-300 group cursor-pointer font-tiny5" onClick={() => handleConnect(net.ip)}>
                    <div className="flex flex-col">
                        <span className="font-bold group-hover:text-white text-sm">{net.ssid}</span>
                        <span className="text-[10px] text-gray-500">{net.security}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span>{['.', '..', '...', '....'][net.strength - 1]}</span>
                        <span className="text-[10px] text-green-600">Connect</span>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* POWER BUTTON */}
        <button 
            onClick={onShutdown}
            className="p-1 hover:bg-red-900/50 rounded text-red-500 hover:text-red-300 transition-colors ml-1"
            title="Emergency Force Shutdown"
        >
            <span className="text-lg">⏻</span>
        </button>

        <div className="ml-2 px-3 py-1 bg-black border border-green-900 text-green-500 text-lg shadow-[inset_0_0_5px_rgba(0,50,0,1)] tracking-widest">
            {time}
        </div>
      </div>
    </div>
  );
};
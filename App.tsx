
import React, { useState, useEffect } from 'react';
import { Taskbar, DesktopIcon, Window, RaidOverlay, BreachAlert } from './components/OSComponents';
import { Terminal } from './components/apps/Terminal';
import { TorBrowser } from './components/apps/TorBrowser';
import { MailApp } from './components/apps/Mail';
import { FileExplorer } from './components/apps/FileExplorer';
import { Notepad } from './components/apps/Notepad';
import { Hardware } from './components/apps/Hardware';
import { Crypto } from './components/apps/Crypto';
import { MusicPlayer } from './components/apps/MusicPlayer';
import { AppId, WindowState, PlayerStats, Mission, LocalFile, Mail, RivalState, WorldState, BreachState, PhishingTemplate } from './types';
import { STARTING_INVENTORY, SPAM_TEMPLATES, MISSION_CLIENTS, TARGET_NAMES, FILE_NAMES, MISSION_TEMPLATES, HARDWARE_PARTS, generateRandomString, BREACH_LOGS, PHISHING_TEMPLATES, COMMANDS } from './constants';

const APP_ICONS: Record<AppId, { label: string, icon: React.ReactNode }> = {
    [AppId.TERMINAL]: { label: 'TERMINAL', icon: <span className="text-4xl">💻</span> },
    [AppId.TOR]: { label: 'TOR', icon: <span className="text-4xl">🌍</span> },
    [AppId.MAIL]: { label: 'MAIL', icon: <span className="text-4xl">✉️</span> },
    [AppId.EXPLORER]: { label: 'EXPLORER', icon: <span className="text-4xl">📁</span> },
    [AppId.NOTEPAD]: { label: 'NOTES', icon: <span className="text-4xl">📝</span> },
    [AppId.HARDWARE]: { label: 'HARDWARE', icon: <span className="text-4xl">💾</span> },
    [AppId.CRYPTO]: { label: 'CRYPTO', icon: <span className="text-4xl">₿</span> },
    [AppId.MUSIC]: { label: 'MUSIC', icon: <span className="text-4xl">🎵</span> },
    [AppId.CHROME]: { label: 'CHROME', icon: <span className="text-4xl">🌐</span> }, 
    [AppId.VPN]: { label: 'VPN', icon: <span className="text-4xl">🛡️</span> }, 
    [AppId.MINIGAME]: { label: 'GAME', icon: <span className="text-4xl">🎮</span> }, 
};

interface IconData {
    id: string;
    appId: AppId;
    x: number;
    y: number;
}

const INITIAL_ICONS: IconData[] = [
    { id: 'term', appId: AppId.TERMINAL, x: 20, y: 20 },
    { id: 'explorer', appId: AppId.EXPLORER, x: 20, y: 120 },
    { id: 'mail', appId: AppId.MAIL, x: 20, y: 220 },
    { id: 'tor', appId: AppId.TOR, x: 20, y: 320 },
    { id: 'notes', appId: AppId.NOTEPAD, x: 120, y: 20 },
    { id: 'hw', appId: AppId.HARDWARE, x: 120, y: 120 },
    { id: 'crypto', appId: AppId.CRYPTO, x: 120, y: 220 },
    { id: 'music', appId: AppId.MUSIC, x: 120, y: 320 },
];

const INITIAL_PLAYER: PlayerStats = {
  hp: 100, maxHp: 100,
  ram: 10, maxRam: 10,
  heat: 0, maxHeat: 100,
  money: 50,
  reputation: 0,
  activeBots: [],
  hardware: { cpu: 'cpu_v1', ram: 'ram_v1', cooling: 'cool_v1', network: 'net_v1' },
  theme: 'classic'
};

const INITIAL_WORLD: WorldState = {
  marketMultiplier: 1.0,
  globalAlertLevel: 0,
  day: 1,
  activeRansomware: [],
  raidActive: false,
  raidTimer: 0
};

const INITIAL_BREACH: BreachState = {
    active: false,
    progress: 0,
    targetFileId: null,
    targetFileName: '',
    difficulty: 1,
    winsNeeded: 5,
    wins: 0,
    currentCode: '',
    logs: []
};

export default function App() {
  const [bootState, setBootState] = useState<'off' | 'boot' | 'login' | 'desktop'>('boot');
  const [loginPass, setLoginPass] = useState('');
  
  const [windows, setWindows] = useState<WindowState[]>([
    { id: AppId.MAIL, title: 'SecureMail', isOpen: false, isMinimized: false, zIndex: 1, position: {x: 50, y: 50} },
    { id: AppId.TERMINAL, title: 'ZeroDay Term', isOpen: true, isMinimized: false, zIndex: 2, position: {x: 100, y: 80} },
    { id: AppId.TOR, title: 'Onion Browser', isOpen: false, isMinimized: false, zIndex: 3, position: {x: 150, y: 100} },
    { id: AppId.EXPLORER, title: 'File Explorer', isOpen: false, isMinimized: false, zIndex: 4, position: {x: 200, y: 150} },
    { id: AppId.NOTEPAD, title: 'Notes', isOpen: false, isMinimized: false, zIndex: 1, position: {x: 300, y: 100} },
    { id: AppId.HARDWARE, title: 'System Rig', isOpen: false, isMinimized: false, zIndex: 1, position: {x: 50, y: 50} },
    { id: AppId.CRYPTO, title: 'Botnet Mgr', isOpen: false, isMinimized: false, zIndex: 1, position: {x: 50, y: 50} },
    { id: AppId.MUSIC, title: 'WinAmp', isOpen: false, isMinimized: false, zIndex: 5, position: {x: 500, y: 20} },
  ]);

  const [icons, setIcons] = useState<IconData[]>(() => {
    const saved = localStorage.getItem('desktop_icons');
    return saved ? JSON.parse(saved) : INITIAL_ICONS;
  });
  
  const [player, setPlayer] = useState<PlayerStats>(INITIAL_PLAYER);
  const [inventory, setInventory] = useState<string[]>(STARTING_INVENTORY);
  const [playerFiles, setPlayerFiles] = useState<LocalFile[]>([]);
  const [worldState, setWorldState] = useState<WorldState>(INITIAL_WORLD);
  const [draggingFile, setDraggingFile] = useState<LocalFile | null>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [rival, setRival] = useState<RivalState>({ name: 'GhostSec', active: true, aggression: 10, skill: 1, lastActionTime: Date.now(), fundsStolen: 0 });
  const [mails, setMails] = useState<Mail[]>([{ id: 'm1', sender: 'Unknown', subject: 'Opportunity', date: '2077-10-22', read: false, missionId: 'job_001', body: "Use 'ls' to find 'payroll.dat'.\nUse 'scp payroll.dat' to download it." }]);
  const [breach, setBreach] = useState<BreachState>(INITIAL_BREACH);
  const [commandQueue, setCommandQueue] = useState<string[]>([]);

  // --- DERIVED STATS ---
  useEffect(() => {
    const ramVal = HARDWARE_PARTS[player.hardware.ram].stat;
    setPlayer(prev => ({ ...prev, maxRam: ramVal }));
  }, [player.hardware.ram]);

  // --- BOOT SEQUENCE ---
  useEffect(() => {
    if (bootState === 'boot') {
        const timer = setTimeout(() => setBootState('login'), 3000); 
        return () => clearTimeout(timer);
    }
  }, [bootState]);

  // --- BREACH TIMER LOOP (60 SECONDS) ---
  useEffect(() => {
      if (!breach.active) return;

      const interval = setInterval(() => {
          setBreach(prev => {
              if (!prev.active) return prev;
              
              // 60s total time. Tick 500ms. 120 ticks.
              // 100 / 120 = 0.8333 per tick
              const newProgress = prev.progress + (100 / 120); 
              
              if (newProgress >= 100) {
                  clearInterval(interval);
                  handleBreachFailure(prev);
                  return { ...INITIAL_BREACH };
              }
              return { ...prev, progress: newProgress };
          });
      }, 500);

      return () => clearInterval(interval);
  }, [breach.active]);

  // --- MAIN LOOP ---
  useEffect(() => {
    if (bootState !== 'desktop') return;

    const interval = setInterval(() => {
        setWorldState(prev => {
            const updatedRansomware = prev.activeRansomware.map(r => ({...r, timeLeft: r.timeLeft - 5}));
            const expired = updatedRansomware.filter(r => r.timeLeft <= 0);
            const active = updatedRansomware.filter(r => r.timeLeft > 0);
            
            let payout = 0;
            if (expired.length > 0) {
                payout = expired.reduce((acc, r) => acc + r.potentialValue, 0);
                alert(`RANSOMWARE SUCCESS: ${expired.length} campaigns finished. +$${payout} Crypto.`);
            }

            let newRaidActive = prev.raidActive;
            let newRaidTimer = prev.raidTimer;
            if (prev.globalAlertLevel >= 100 && !prev.raidActive) {
                newRaidActive = true;
                newRaidTimer = 30; 
            }
            if (newRaidActive) {
                newRaidTimer -= 5;
                if (newRaidTimer <= 0) {
                     setBootState('off');
                     alert("SYSTEM RAIDED. ALL DATA LOST. REBOOTING FACTORY SETTINGS...");
                     window.location.reload();
                     return prev;
                }
            }

            return {
                ...prev,
                marketMultiplier: Math.max(0.5, Math.min(2.5, prev.marketMultiplier + (Math.random() - 0.5) * 0.1)),
                activeRansomware: active,
                raidActive: newRaidActive,
                raidTimer: newRaidTimer
            };
        });

        if (worldState.raidActive) return; 

        if (player.activeBots.includes('auto_miner_v1')) {
            setPlayer(prev => ({ ...prev, money: prev.money + 5 }));
        }

        if (Math.random() < 0.05) generateProceduralMissionMail();
        if (rival.active) handleRivalEvent();
        if (Math.random() < 0.03) generateProceduralSpam();

    }, 5000); 
    return () => clearInterval(interval);
  }, [bootState, rival, player.activeBots, worldState.raidActive]);

  const generateProceduralMissionMail = () => {
      const client = MISSION_CLIENTS[Math.floor(Math.random() * MISSION_CLIENTS.length)];
      const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
      const targetName = TARGET_NAMES[Math.floor(Math.random() * TARGET_NAMES.length)];
      addMail({
          id: `job_${Date.now()}`, sender: client, subject: `Contract: ${targetName}`, date: `2077-10-${worldState.day}`,
          read: false, missionId: `mission_${Date.now()}`, body: `Target: ${targetName}\n${template.text}\nReq: ${template.fileType.toUpperCase()}`
      });
  };

  const generateProceduralSpam = () => {
      const spam = SPAM_TEMPLATES[Math.floor(Math.random() * SPAM_TEMPLATES.length)];
      addMail({
          id: `spam_${Date.now()}`, sender: spam.sender, subject: spam.subject, date: `2077-10-${worldState.day}`,
          read: false, body: spam.body, isSpam: true, spamDifficulty: spam.difficulty
      });
  };

  const handleRivalEvent = () => {
      if (rival.aggression >= 100) return; 
      if (Math.random() < 0.1) {
          setRival(prev => ({...prev, aggression: prev.aggression + 5}));
      }
  };

  const addMail = (mail: Mail) => setMails(prev => [mail, ...prev]);

  const openApp = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: 10 } : w));
  };
  const closeApp = (id: AppId) => setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
  const focusWindow = (id: AppId) => setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: Math.max(...prev.map(win => win.zIndex)) + 1 } : w));
  const moveWindow = (id: AppId, x: number, y: number) => setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));

  const handleIconMove = (id: string, x: number, y: number) => {
    const newIcons = icons.map(icon => icon.id === id ? { ...icon, x, y } : icon);
    setIcons(newIcons);
    localStorage.setItem('desktop_icons', JSON.stringify(newIcons));
  };

  const acceptMission = (mailId: string) => {
    const mail = mails.find(m => m.id === mailId);
    if (mail && mail.missionId) {
        setActiveMission({
            id: mail.missionId, title: mail.subject, client: mail.sender, description: mail.body, faction: 'neutral',
            targetIp: `192.168.0.${Math.floor(Math.random()*255)}`, difficulty: 1, reward: 500, requiredFilename: FILE_NAMES[0], isCompleted: false
        });
        setMails(prev => prev.map(m => m.id === mailId ? { ...m, read: true } : m));
        setTimeout(() => openApp(AppId.TERMINAL), 500);
    }
  };

  const completeMission = (fileId: string) => {
      setPlayer(prev => ({ ...prev, money: prev.money + 500, reputation: prev.reputation + 25 }));
      setPlayerFiles(prev => prev.filter(f => f.id !== fileId));
      setActiveMission(null);
      setWorldState(prev => ({...prev, globalAlertLevel: prev.globalAlertLevel + 10}));
  };

  // --- MARKET LOGIC ---
  const buyCommand = (id: string, cost: number) => {
      if (player.money >= cost) {
          setPlayer(prev => ({ ...prev, money: prev.money - cost }));
          
          if (id === 'db_dump') {
              // Leaked Database Logic
              const dump: LocalFile = {
                  id: `db_${Date.now()}`,
                  name: 'LEAKED_DB.txt',
                  type: 'text',
                  value: 0,
                  content: `TARGET DUMP:\n192.168.1.45 - Admin/Admin\n192.168.1.99 - Root/1234\n10.0.0.5 - High Security`
              };
              setPlayerFiles(prev => [...prev, dump]);
              alert("Database Downloaded to File Explorer.");
          } else if (COMMANDS[id].type === 'passive') {
              setPlayer(prev => ({ ...prev, activeBots: [...prev.activeBots, id] }));
          } else {
              setInventory(prev => [...prev, id]);
          }
      } else {
          alert("Insufficient Funds");
      }
  };

  const sellFile = (id: string, price: number) => {
      setPlayerFiles(prev => prev.filter(f => f.id !== id));
      setPlayer(prev => ({ ...prev, money: prev.money + price }));
  };

  // --- PHISHING LOGIC ---
  const sendPhishing = (templateId: string) => {
      const template = PHISHING_TEMPLATES.find(t => t.id === templateId);
      if (!template) return;

      setPlayer(prev => ({...prev, heat: prev.heat + 10})); // Cost heat
      alert("Phishing Campaign Launched. Waiting for bites...");

      setTimeout(() => {
          const success = Math.random() < template.successRate;
          if (success) {
              const targetIp = `192.168.1.${Math.floor(Math.random() * 255)}`;
              addMail({
                  id: `phish_reply_${Date.now()}`,
                  sender: "Gullible User",
                  subject: `Re: ${template.subject}`,
                  date: `2077-10-${worldState.day}`,
                  read: false,
                  body: `Here is the information you requested. My IP is ${targetIp}. Please don't lock my account!`
              });
          } else {
              addMail({
                  id: `phish_fail_${Date.now()}`,
                  sender: "Mail Daemon",
                  subject: "Undeliverable",
                  date: `2077-10-${worldState.day}`,
                  read: false,
                  body: "Your email was flagged as spam and rejected by the remote server."
              });
          }
      }, 5000); 
  };

  // --- BREACH HANDLERS ---
  const triggerSpam = (difficulty: number) => {
      let targetFile = playerFiles[Math.floor(Math.random() * playerFiles.length)];
      if (!targetFile) {
          targetFile = { id: 'dummy', name: 'sys_core.dll', type: 'binary', value: 0, content: '' };
      }

      setBreach({
          active: true,
          progress: 0,
          targetFileId: targetFile.id,
          targetFileName: targetFile.name,
          difficulty: difficulty,
          winsNeeded: 5,
          wins: 0,
          currentCode: generateRandomString(5),
          logs: ['WARNING: UNAUTHORIZED OUTBOUND CONNECTION', 'INITIATING COUNTER-MEASURES...']
      });

      setWindows(prev => prev.map(w => w.id === AppId.TERMINAL ? { ...w, isOpen: true, isMinimized: false, zIndex: 9999 } : w));
  };

  const handleBreachInput = (input: string) => {
      if (!breach.active) return;
      
      if (input === breach.currentCode) {
          const newWins = breach.wins + 1;
          const successLog = BREACH_LOGS.success[Math.floor(Math.random() * BREACH_LOGS.success.length)];
          
          if (newWins >= breach.winsNeeded) {
              setBreach(INITIAL_BREACH);
              alert("THREAT NEUTRALIZED. CONNECTION SEVERED.");
          } else {
              setBreach(prev => ({
                  ...prev,
                  wins: newWins,
                  currentCode: generateRandomString(5),
                  logs: [...prev.logs, `[SUCCESS] ${successLog}`, 'Generating next challenge...']
              }));
          }
      } else {
          const failLog = BREACH_LOGS.fail[Math.floor(Math.random() * BREACH_LOGS.fail.length)];
          setBreach(prev => ({
              ...prev,
              logs: [...prev.logs, `[ERROR] ${failLog}`, 'Retrying protocol...']
          }));
      }
  };

  const handleBreachFailure = (finalState: BreachState) => {
      if (finalState.targetFileId && finalState.targetFileId !== 'dummy') {
          setPlayerFiles(prev => prev.filter(f => f.id !== finalState.targetFileId));
          alert(`SECURITY BREACH FAILED. FILE STOLEN: ${finalState.targetFileName}`);
      } else {
          setPlayer(prev => ({...prev, money: Math.max(0, prev.money - 100)}));
          alert(`SECURITY BREACH FAILED. SYSTEM COMPROMISED. $100 STOLEN.`);
      }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-900 select-none font-sans">
      <div className="relative w-[800px] h-[600px] bg-black overflow-hidden shadow-2xl border-8 border-[#333] rounded-lg ring-1 ring-white/10">
        <div className="crt-overlay absolute inset-0 z-[9999] pointer-events-none mix-blend-overlay opacity-30"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/30 z-[9998]"></div>
        
        <RaidOverlay active={worldState.raidActive} timer={worldState.raidTimer} />
        <BreachAlert breach={breach} />

        {bootState === 'boot' && (
            <div className="h-full flex flex-col justify-center items-center text-green-500 font-mono bg-black">
                <div className="text-4xl mb-4 animate-pulse font-retro">ZERO_DAY BIOS v5.0</div>
                <div className="text-xs text-green-700">Loading Kernel... OK</div>
            </div>
        )}

        {bootState === 'login' && (
             <div className="h-full flex flex-col justify-center items-center text-green-500 font-mono bg-black relative">
                <div className="text-xl mb-4 font-retro tracking-widest z-10">USER AUTHENTICATION</div>
                <input 
                    type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setBootState('desktop'); }}
                    className="z-10 bg-black border-b-2 border-green-500 text-center outline-none text-green-300 w-64" autoFocus
                />
             </div>
        )}

        {bootState === 'desktop' && (
            <div className="h-full relative bg-[url('https://picsum.photos/id/2/800/600?grayscale&blur=2')] bg-cover overflow-hidden">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                
                <div className="relative z-0 w-full h-full">
                    {icons.map(iconData => {
                        const appInfo = APP_ICONS[iconData.appId];
                        return (
                            <DesktopIcon 
                                key={iconData.id}
                                id={iconData.id}
                                appId={iconData.appId}
                                label={appInfo?.label || 'APP'}
                                icon={appInfo?.icon || <span className="text-4xl">❓</span>}
                                position={{ x: iconData.x, y: iconData.y }}
                                onOpen={openApp}
                                onMove={handleIconMove}
                                notificationCount={iconData.appId === AppId.MAIL ? mails.filter(m => !m.read).length : 0}
                            />
                        );
                    })}
                </div>

                {windows.map(w => (
                    <Window key={w.id} state={w} onClose={closeApp} onFocus={focusWindow} onMove={moveWindow}>
                        {w.id === AppId.TERMINAL && (
                            <Terminal 
                                player={player} setPlayer={setPlayer} inventory={inventory} setInventory={setInventory}
                                activeMission={activeMission} addFile={(f) => setPlayerFiles(p => [...p, f])} playerFiles={playerFiles}
                                rival={rival} worldState={worldState} setWorldState={setWorldState} setRival={setRival}
                                breach={breach} onBreachInput={handleBreachInput} commandQueue={commandQueue} clearCommandQueue={() => setCommandQueue([])}
                            />
                        )}
                        {w.id === AppId.TOR && (
                            <TorBrowser 
                                player={player} files={playerFiles} buyCommand={buyCommand} sellFile={sellFile} inventory={inventory} worldState={worldState}
                            />
                        )}
                        {w.id === AppId.MAIL && (
                            <MailApp 
                                mails={mails} activeMission={activeMission} acceptMission={acceptMission} completeMission={completeMission}
                                triggerSpam={triggerSpam} draggingFile={draggingFile} replyToRival={() => {}} sendPhishing={sendPhishing} player={player}
                            />
                        )}
                        {w.id === AppId.EXPLORER && <FileExplorer files={playerFiles} setDraggingFile={setDraggingFile} />}
                        {w.id === AppId.NOTEPAD && <Notepad />}
                        {w.id === AppId.HARDWARE && <Hardware player={player} setPlayer={setPlayer} />}
                        {w.id === AppId.CRYPTO && <Crypto player={player} worldState={worldState} />}
                        {w.id === AppId.MUSIC && <MusicPlayer />}
                    </Window>
                ))}

                <Taskbar 
                    windows={windows} 
                    onToggle={(id) => openApp(id)} 
                    onStart={() => {}} 
                    time={new Date().toLocaleTimeString()} 
                    onQueueCommand={(cmd) => setCommandQueue(prev => [...prev, cmd])}
                />
            </div>
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Taskbar, DesktopIcon, Window, RaidOverlay, BreachAlert, CrashScreen, StartMenuWindow } from './components/OSComponents';
import { Terminal } from './components/apps/Terminal';
import { TorBrowser } from './components/apps/TorBrowser';
import { MailApp } from './components/apps/Mail';
import { FileExplorer } from './components/apps/FileExplorer';
import { Notepad } from './components/apps/Notepad';
import { Hardware } from './components/apps/Hardware';
import { Crypto } from './components/apps/Crypto';
import { MusicPlayer } from './components/apps/MusicPlayer';
import { AppId, WindowState, PlayerStats, Mission, LocalFile, Mail, RivalState, WorldState, BreachState, PhishingTemplate, SaveGameData } from './types';
import { STARTING_INVENTORY, SPAM_TEMPLATES, MISSION_CLIENTS, TARGET_NAMES, FILE_NAMES, MISSION_TEMPLATES, HARDWARE_PARTS, generateRandomString, BREACH_LOGS, PHISHING_TEMPLATES, COMMANDS, generateRandomIP, RIVAL_MESSAGES } from './constants';

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
    [AppId.START_MENU]: { label: 'START', icon: <span className="text-4xl">⚙️</span> },
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
  const [bootState, setBootState] = useState<'off' | 'boot' | 'login' | 'desktop' | 'crash'>('boot');
  const [loginPass, setLoginPass] = useState('');
  
  const [windows, setWindows] = useState<WindowState[]>([
    { id: AppId.START_MENU, title: 'Help & Arsenal', isOpen: true, isMinimized: false, zIndex: 10, position: {x: 50, y: 50} },
    { id: AppId.MAIL, title: 'SecureMail', isOpen: false, isMinimized: false, zIndex: 1, position: {x: 50, y: 50} },
    { id: AppId.TERMINAL, title: 'ZeroDay Term', isOpen: false, isMinimized: false, zIndex: 2, position: {x: 100, y: 80} },
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
  const [mails, setMails] = useState<Mail[]>([{ id: 'm1', sender: 'Admin', subject: 'Welcome to Zero Day', date: '2077-10-22', read: false, body: "Welcome to the network.\n\nUse the Start Menu to view the Tutorial.\nUse the Terminal to execute hacks.\n\nBe careful. We are watching." }]);
  const [breach, setBreach] = useState<BreachState>(INITIAL_BREACH);
  const [commandQueue, setCommandQueue] = useState<string[]>([]);
  
  // Idle tracking
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Available Saves State
  const [availableSaves, setAvailableSaves] = useState<string[]>([]);

  // Check LocalStorage for saves on mount
  useEffect(() => {
    const found: string[] = [];
    ['save001', 'save002', 'save003'].forEach(slot => {
        if (localStorage.getItem(slot)) found.push(slot);
    });
    setAvailableSaves(found);
  }, []);

  // --- SAVE / LOAD LOGIC ---
  const handleSaveGame = (slotId: string) => {
    const saveData: SaveGameData = {
        id: slotId,
        timestamp: Date.now(),
        dateString: new Date().toLocaleString(),
        player,
        inventory,
        playerFiles,
        worldState,
        rival,
        activeMission,
        mails,
        icons
    };
    
    try {
        localStorage.setItem(slotId, JSON.stringify(saveData));
        setAvailableSaves(prev => prev.includes(slotId) ? prev : [...prev, slotId]);
        alert(`GAME SAVED TO SLOT: ${slotId}`);
    } catch (e) {
        alert("SAVE FAILED: Storage Full or Error.");
    }
  };

  const handleLoadGame = (slotId: string) => {
    try {
        const json = localStorage.getItem(slotId);
        if (!json) throw new Error("Save file missing");
        const data: SaveGameData = JSON.parse(json);
        applySaveData(data);
        alert(`LOADED SAVE: ${slotId}`);
    } catch (e) {
        alert("LOAD FAILED: Corrupt Save Data.");
    }
  };

  const handleExportSave = () => {
    const saveData: SaveGameData = {
        id: 'exported_save',
        timestamp: Date.now(),
        dateString: new Date().toLocaleString(),
        player, inventory, playerFiles, worldState, rival, activeMission, mails, icons
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `save001_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSave = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data: SaveGameData = JSON.parse(e.target?.result as string);
            applySaveData(data);
            alert("SAVE IMPORTED SUCCESSFULLY.");
        } catch (err) {
            alert("ERROR: Invalid Save File.");
        }
    };
    reader.readAsText(file);
  };

  const applySaveData = (data: SaveGameData) => {
      setPlayer(data.player);
      setInventory(data.inventory);
      setPlayerFiles(data.playerFiles);
      setWorldState(data.worldState);
      setRival(data.rival);
      setActiveMission(data.activeMission);
      setMails(data.mails);
      setIcons(data.icons);
      // Reset sensitive states
      setBootState('desktop'); 
      setBreach(INITIAL_BREACH);
  };

  // --- MOUSE ACTIVITY TRACKING ---
  useEffect(() => {
      const handleActivity = () => setLastActivity(Date.now());
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('mousedown', handleActivity);
      return () => {
          window.removeEventListener('keydown', handleActivity);
          window.removeEventListener('mousedown', handleActivity);
      }
  }, []);

  // Check if Terminal is open to prevent idle attacks during battle
  const isTerminalOpen = windows.find(w => w.id === AppId.TERMINAL)?.isOpen;

  // --- IDLE CHECK LOOP ---
  useEffect(() => {
      if(bootState !== 'desktop' || isTerminalOpen) return;
      
      const interval = setInterval(() => {
          if (Date.now() - lastActivity > 60000) { // 60s idle
             // Force random encounter
             setCommandQueue(prev => [...prev, `connect ${generateRandomIP()}`]);
             setLastActivity(Date.now());
             alert("SYSTEM ALERT: SUSPICIOUS ACTIVITY DETECTED WHILE IDLE.");
          }
      }, 10000);
      return () => clearInterval(interval);
  }, [lastActivity, bootState, isTerminalOpen]);

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

  // --- COMMAND QUEUE HANDLER ---
  useEffect(() => {
    if (commandQueue.length > 0) {
        const cmd = commandQueue[0];
        if (cmd.startsWith('connect')) {
            openApp(AppId.TERMINAL);
        }
    }
  }, [commandQueue]);

  // --- BREACH TIMER LOOP (60 SECONDS) ---
  useEffect(() => {
      if (!breach.active) return;

      const interval = setInterval(() => {
          setBreach(prev => {
              if (!prev.active) return prev;
              
              // 60s total time. Tick 500ms. 120 ticks.
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
    
    // Check for crash
    if (player.hp <= 0) {
        setBootState('crash');
        setTimeout(() => {
            window.location.reload();
        }, 5000);
        return;
    }

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
  }, [bootState, rival, player.activeBots, worldState.raidActive, player.hp]);

  const generateProceduralMissionMail = () => {
      const client = MISSION_CLIENTS[Math.floor(Math.random() * MISSION_CLIENTS.length)];
      const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
      const targetName = TARGET_NAMES[Math.floor(Math.random() * TARGET_NAMES.length)];
      const targetIp = generateRandomIP();
      addMail({
          id: `job_${Date.now()}`, sender: client, subject: `Contract: ${targetName}`, date: `2077-10-${worldState.day}`,
          read: false, missionId: `mission_${Date.now()}`, body: `Target: ${targetName}\nIP: ${targetIp}\n\n${template.text}\nReq: ${template.fileType.toUpperCase()}`
      });
  };

  const generateProceduralSpam = () => {
      const spam = SPAM_TEMPLATES[Math.floor(Math.random() * SPAM_TEMPLATES.length)];
      addMail({
          id: `spam_${Date.now()}`, sender: spam.sender, subject: spam.subject, date: `2077-10-${worldState.day}`,
          read: false, body: spam.body, isSpam: true, spamDifficulty: spam.difficulty, spamButtonText: spam.buttonText
      });
  };

  const handleRivalEvent = () => {
      if (rival.aggression >= 100) return; 
      
      const roll = Math.random();
      if (roll < 0.05) {
          // Rival Email
          const taunt = RIVAL_MESSAGES[rival.aggression > 50 ? 'high' : 'low'][0];
          addMail({
             id: `rival_${Date.now()}`,
             sender: rival.name,
             subject: taunt.subject,
             date: `2077-10-${worldState.day}`,
             read: false,
             body: taunt.body,
             canReply: true
          });
          setRival(prev => ({...prev, aggression: prev.aggression + 2}));
      } else if (roll > 0.95 && rival.aggression > 30) {
          // Force Attack
          setCommandQueue(prev => [...prev, `connect 127.0.0.1`]); // Forced battle on localhost implies incoming
          alert(`INCOMING CONNECTION REQUEST: ${rival.name}`);
      }
  };

  const handleReplyToRival = (mailId: string, tone: 'aggressive' | 'defensive' | 'neutral') => {
      setMails(prev => prev.map(m => m.id === mailId ? { ...m, canReply: false } : m));

      if (tone === 'aggressive') {
          setRival(prev => ({ ...prev, aggression: Math.min(100, prev.aggression + 15) }));
          alert("Rival provoked! Aggression increasing.");
      } else if (tone === 'defensive') {
          setRival(prev => ({ ...prev, aggression: Math.max(0, prev.aggression - 5) }));
          alert("Rival slightly pacified.");
      } else {
          setRival(prev => ({ ...prev, aggression: Math.min(100, prev.aggression + 5) }));
          alert("Rival acknowledges message.");
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
        // Extract IP from body roughly
        const ipMatch = mail.body.match(/IP: ([\d\.]+)/);
        const targetIp = ipMatch ? ipMatch[1] : generateRandomIP();

        setActiveMission({
            id: mail.missionId, title: mail.subject, client: mail.sender, description: mail.body, faction: 'neutral',
            targetIp: targetIp, difficulty: 1, reward: 500, requiredFilename: FILE_NAMES[0], isCompleted: false
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
                  content: `TARGET DUMP:\n${generateRandomIP()} - Admin/Admin\n${generateRandomIP()} - Root/1234`
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
              const targetIp = generateRandomIP();
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
          // Fallback if no files to steal
          setPlayer(prev => ({...prev, money: Math.max(0, prev.money - 500)}));
          alert(`SECURITY BREACH FAILED. NO FILES FOUND. $500 DRAINED FROM ACCOUNT.`);
      }
  };

  const handleForceShutdown = () => {
      setBootState('off');
      setTimeout(() => setBootState('boot'), 2000);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-900 select-none font-jersey">
      <div className="relative w-[800px] h-[600px] bg-black overflow-hidden shadow-2xl border-8 border-[#333] rounded-lg ring-1 ring-white/10">
        <div className="crt-overlay absolute inset-0 z-[9999] pointer-events-none mix-blend-overlay opacity-30"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/30 z-[9998]"></div>
        
        <RaidOverlay active={worldState.raidActive} timer={worldState.raidTimer} />
        <CrashScreen active={bootState === 'crash'} />
        <BreachAlert breach={breach} />

        {bootState === 'boot' && (
            <div className="h-full flex flex-col justify-center items-center text-green-500 font-tiny5 bg-black">
                <div className="text-4xl mb-4 animate-pulse">ZERO_DAY BIOS v5.0</div>
                <div className="text-xs text-green-700">Loading Kernel... OK</div>
                {availableSaves.length > 0 && (
                     <div className="mt-8 text-yellow-500 animate-pulse text-xs">SAVE DATA DETECTED. SYSTEM READY.</div>
                )}
            </div>
        )}

        {bootState === 'off' && (
             <div className="h-full bg-black"></div>
        )}

        {bootState === 'login' && (
             <div className="h-full flex flex-col justify-center items-center text-green-500 font-tiny5 bg-black relative">
                <div className="text-xl mb-4 tracking-widest z-10">USER AUTHENTICATION</div>
                <input 
                    type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={(e) => { 
                        if (e.key === 'Enter') {
                            if (loginPass === 'admin') {
                                setBootState('desktop');
                            } else {
                                alert("ACCESS DENIED: INCORRECT PASSWORD");
                                setLoginPass('');
                            }
                        } 
                    }}
                    className="z-10 bg-black border-b-2 border-green-500 text-center outline-none text-green-300 w-64 font-tiny5 text-xl" autoFocus
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
                        {w.id === AppId.START_MENU && (
                            <StartMenuWindow 
                                inventory={inventory} 
                                onSave={handleSaveGame}
                                onLoad={handleLoadGame}
                                onExport={handleExportSave}
                                onImport={handleImportSave}
                                availableSaves={availableSaves}
                            />
                        )}
                        {w.id === AppId.TERMINAL && (
                            <Terminal 
                                player={player} setPlayer={setPlayer} inventory={inventory} setInventory={setInventory}
                                activeMission={activeMission} addFile={(f) => setPlayerFiles(p => [...p, f])} playerFiles={playerFiles}
                                rival={rival} worldState={worldState} setWorldState={setWorldState} setRival={setRival}
                                breach={breach} onBreachInput={handleBreachInput} commandQueue={commandQueue} clearCommandQueue={() => setCommandQueue([])}
                                triggerReboot={handleForceShutdown}
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
                                triggerSpam={triggerSpam} draggingFile={draggingFile} replyToRival={handleReplyToRival} sendPhishing={sendPhishing} player={player} rival={rival}
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
                    onStart={() => openApp(AppId.START_MENU)} 
                    time={new Date().toLocaleTimeString()} 
                    onQueueCommand={(cmd) => setCommandQueue(prev => [...prev, cmd])}
                    onShutdown={handleForceShutdown}
                />
            </div>
        )}
      </div>
    </div>
  );
}
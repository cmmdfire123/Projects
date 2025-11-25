
import React, { useState, useEffect, useRef } from 'react';
import { Command, PlayerStats, Enemy, LocalFile, Mission, RivalState, WorldState, BreachState } from '../../types';
import { COMMANDS, ENEMIES, HARDWARE_PARTS } from '../../constants';

interface TerminalProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  inventory: string[];
  setInventory: React.Dispatch<React.SetStateAction<string[]>>;
  activeMission: Mission | null;
  addFile: (file: LocalFile) => void;
  playerFiles: LocalFile[];
  rival: RivalState;
  worldState: WorldState;
  setWorldState: React.Dispatch<React.SetStateAction<WorldState>>;
  setRival: React.Dispatch<React.SetStateAction<RivalState>>;
  breach: BreachState;
  onBreachInput: (input: string) => void;
  commandQueue: string[];
  clearCommandQueue: () => void;
}

type Mode = 'shell' | 'battle' | 'breach';

export const Terminal: React.FC<TerminalProps> = ({ 
  player, setPlayer, inventory, setInventory, activeMission, addFile, playerFiles, rival, worldState, setWorldState, setRival,
  breach, onBreachInput, commandQueue, clearCommandQueue
}) => {
  const [history, setHistory] = useState<string[]>(['Welcome to ZERO_DAY OS v2.1', 'Kernel loaded.', 'Type "help" for commands.']);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('shell');
  
  // Battle State
  const [connectedIp, setConnectedIp] = useState<string | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, battleLog, breach.logs]);

  // Command Queue Consumer
  useEffect(() => {
    if (commandQueue.length > 0) {
        const cmd = commandQueue[0];
        // Only execute if not breach mode (unless its critical?)
        if (!breach.active) {
            executeCommand(cmd);
        }
        clearCommandQueue();
    }
  }, [commandQueue, breach.active]);

  const effectiveMode = breach.active ? 'breach' : mode;

  // Rival Boss Fight Trigger
  useEffect(() => {
    if (rival.aggression >= 100 && effectiveMode === 'shell' && !enemy) {
        startBattle('localhost', 99); 
    }
  }, [rival.aggression]);

  const executeCommand = (cmdStr: string) => {
    if (!cmdStr.trim()) return;
    const args = cmdStr.split(' ');
    const cmdKey = args[0].toLowerCase();
    
    setHistory(prev => [...prev, `root@zeroday:~$ ${cmdStr}`]);
    setInput('');

    if (effectiveMode === 'shell') {
      handleShellCommand(cmdKey, args.slice(1));
    } else if (effectiveMode === 'battle') {
      handleBattleCommand(cmdKey, args.slice(1));
    }
  };

  const print = (msg: string) => setHistory(prev => [...prev, msg]);
  const battlePrint = (msg: string) => setBattleLog(prev => [...prev, msg]);

  // --- SHELL COMMANDS ---
  const handleShellCommand = (key: string, args: string[]) => {
    const cmd = COMMANDS[key];

    switch(key) {
        case 'help':
            print('--- SYSTEM ---');
            print('connect [ip] : Initiate hack');
            print('nmap         : Scan local subnet');
            print('ls           : List files');
            print('scp [file]   : Download file');
            print('wipe_drive   : EMERGENCY DATA WIPE');
            print('clear        : Clear screen');
            break;
        case 'wipe_drive':
            if (worldState.raidActive) {
                print('INITIATING EMERGENCY WIPE...');
                print('DELETING LOGS... 100%');
                print('ENCRYPTING DRIVES... 100%');
                print('SYSTEM SAFE. RAID AVERTED.');
                setWorldState(prev => ({...prev, raidActive: false, raidTimer: 0, globalAlertLevel: 0}));
            } else {
                print('No threat detected. Wipe aborted.');
            }
            break;
        case 'nmap':
        case 'scan_net':
            if (player.ram < 5) { print('Error: Insufficient RAM for scan.'); return; }
            print('Scanning subnet 192.168.0.x ...');
            setPlayer(prev => ({...prev, ram: prev.ram - 5}));
            setTimeout(() => {
                print('--- DISCOVERED HOSTS ---');
                for(let i=0; i<3; i++) {
                    const r = Math.random();
                    const suffix = Math.floor(Math.random() * 254);
                    const type = r > 0.8 ? '[SECURE]' : r > 0.4 ? '[WEAK]' : '[UNKNOWN]';
                    print(`192.168.0.${suffix}  ${type}  Port 22 (SSH) OPEN`);
                }
            }, 1500);
            break;
        case 'ls':
            if (connectedIp && enemy && enemy.hp <= 0) {
                print(`Remote System (${connectedIp}) [ROOT ACCESS]:`);
                enemy.files.forEach(f => {
                    const size = Math.floor(f.value * 0.1) + 'KB';
                    print(`-rw-r--r--  root  ${size.padEnd(8)} ${f.name}`);
                });
            } else {
                print('Local Drive /home/user/loot:');
                print('  (Use File Explorer app to view)');
            }
            break;
        case 'scp':
            if (!connectedIp || (enemy && enemy.hp > 0)) {
                print('Error: Root access required.');
                return;
            }
            const targetFile = args[0];
            const found = enemy?.files.find(f => f.name === targetFile);
            if (found) {
                const alreadyHas = playerFiles.find(pf => pf.id === found.id || (pf.name === found.name && pf.originIp === connectedIp));
                if (alreadyHas) {
                    print(`Error: File already exists locally.`);
                } else {
                    addFile({...found, originIp: connectedIp});
                    print(`Success: ${targetFile} saved.`);
                }
            } else {
                print(`Error: File not found.`);
            }
            break;
        case 'connect':
            const ip = args[0];
            if (!ip) {
                print('Usage: connect [ip]');
                return;
            }
            if (activeMission && ip === activeMission.targetIp) {
                startBattle(ip, activeMission.difficulty);
            } else {
                print(`Scanning ${ip}... Vulnerability found.`);
                startBattle(ip, Math.floor(Math.random() * 3)); 
            }
            break;
        case 'clear':
            setHistory([]);
            break;
        case 'whoami':
            const cpu = HARDWARE_PARTS[player.hardware.cpu];
            const ram = HARDWARE_PARTS[player.hardware.ram];
            print(`USER: root | REP: ${player.reputation} | BANK: $${player.money}`);
            print(`HARDWARE: ${cpu.name} | ${ram.name}`);
            break;
        default:
             if (cmd && cmd.desc) print(cmd.desc);
             else print(`Command '${key}' not found.`);
    }
  };

  const startBattle = (ip: string, difficulty: number) => {
    setMode('battle');
    setConnectedIp(ip);
    
    // Boss Fight
    if (difficulty === 99) {
        setEnemy({
            name: rival.name,
            hp: 500, maxHp: 500,
            trace: 50, firewall: 50,
            attacks: ['buffer_ovf', 'ddos_flood', 'zero_day'],
            files: [],
            isRival: true
        });
        setBattleLog(['WARNING: UNAUTHORIZED INTRUSION DETECTED', `SOURCE: ${rival.name}`, 'DEFEND YOUR SYSTEM. DISCONNECT DISABLED.']);
        return;
    }

    const baseEnemy = ENEMIES[Math.min(ENEMIES.length - 1, difficulty)];
    const loot: LocalFile[] = [
        { id: `f_${Date.now()}_1`, name: 'sys_config.log', content: 'Useless logs', type: 'text', value: 10 },
        { id: `f_${Date.now()}_2`, name: 'user_data.db', content: 'Personal Data', type: 'binary', value: 50 * (difficulty+1) },
    ];
    if (activeMission && ip === activeMission.targetIp) {
        loot.push({ id: `m_${activeMission.id}`, name: activeMission.requiredFilename, content: 'Mission Data', type: 'encrypted', value: 500 });
    }

    // Pivot Hacking Loot
    if (difficulty >= 1 && Math.random() > 0.6) {
        const secretIp = `10.24.${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*255)}`;
        loot.push({
            id: `p_${Date.now()}`,
            name: 'server_auth.txt',
            type: 'text',
            value: 150,
            content: `INTERNAL ROUTING TABLE:\nTarget: High Value Asset\nIP: ${secretIp}\nNotes: Legacy Firewall.`
        });
    }

    setEnemy({ ...baseEnemy, hp: baseEnemy.maxHp, trace: 0, files: loot });
    setBattleLog(['--- CONNECTION ESTABLISHED ---', `Target: ${baseEnemy.name} @ ${ip}`]);
  };

  const handleBattleCommand = (key: string, args: string[]) => {
    if ((key === 'disconnect' || key === 'exit') && enemy?.isRival) {
        battlePrint('ERROR: CONNECTION LOCKED BY REMOTE HOST.');
        return;
    }

    if (key === 'disconnect' || key === 'exit') {
      setMode('shell');
      setConnectedIp(null);
      setEnemy(null);
      print('Connection closed.');
      return;
    }
    
    if (key === 'ransomware') {
        if (!enemy || enemy.hp > 0) {
            battlePrint('Error: Root access required to deploy malware.');
            return;
        }
        if (player.ram < 15) {
            battlePrint('Error: Insufficient RAM.');
            return;
        }
        
        battlePrint('Injecting Ransomware payload...');
        setWorldState(prev => ({
            ...prev,
            activeRansomware: [...prev.activeRansomware, {
                id: `rw_${Date.now()}`,
                targetIp: connectedIp!,
                potentialValue: 1000 + (Math.random() * 2000),
                timeLeft: 120 
            }],
            globalAlertLevel: Math.min(100, prev.globalAlertLevel + 25)
        }));
        setPlayer(prev => ({...prev, ram: prev.ram - 15, heat: prev.heat + 60}));
        battlePrint('Payload Active. Disconnecting to avoid trace.');
        setTimeout(() => {
             setMode('shell'); setConnectedIp(null); setEnemy(null);
        }, 2000);
        return;
    }

    if (['ls', 'scp'].includes(key)) {
        if (enemy && enemy.hp <= 0) handleShellCommand(key, args);
        else battlePrint('System Locked.');
        return;
    }

    const cmd = COMMANDS[key];
    if (!cmd || !inventory.includes(key)) {
        battlePrint(`Error: Module ${key} unavailable.`);
        return;
    }

    if (player.ram < cmd.cost) {
      battlePrint('Error: Insufficient RAM (AP).');
      return;
    }

    setPlayer(prev => ({ ...prev, ram: prev.ram - cmd.cost, heat: prev.heat + cmd.heat }));
    battlePrint(`> ${cmd.name}...`);
    
    let newHp = enemy!.hp;
    let newTrace = enemy!.trace;

    if (cmd.type === 'atk') newHp -= Math.max(0, (cmd.val || 0) - enemy!.firewall);
    if (cmd.type === 'def') setPlayer(prev => ({...prev, hp: Math.min(prev.maxHp, prev.hp + (cmd.val || 0))}));
    if (cmd.type === 'cool') setPlayer(prev => ({...prev, heat: Math.max(0, prev.heat - 30)}));
    if (cmd.type === 'vpn') newTrace = Math.max(0, newTrace - (cmd.val || 15));

    if (newHp <= 0) {
        setEnemy(prev => ({ ...prev!, hp: 0 }));
        battlePrint('*** ROOT ACCESS GRANTED ***');
        if (enemy?.isRival) {
            battlePrint('RIVAL NEUTRALIZED. REPUTATION RESTORED.');
            setRival(prev => ({ ...prev, active: false, aggression: 0 }));
            setMode('shell');
        }
        return; 
    } else {
        setEnemy(prev => ({ ...prev!, hp: newHp, trace: newTrace }));
    }

    setTimeout(() => enemyTurn(), 800);
  };

  const enemyTurn = () => {
    if (!enemy || enemy.hp <= 0) return;
    const atkKey = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
    const dmg = enemy.isRival ? 30 : 15;

    battlePrint(`Target executing ${atkKey}...`);
    setPlayer(prev => ({...prev, hp: prev.hp - dmg}));
    battlePrint(`WARNING: Breach detected! -${dmg} Integrity`);
    
    const netPart = HARDWARE_PARTS[player.hardware.network];
    const traceAdd = Math.max(1, (10 + (worldState.globalAlertLevel / 10)) - netPart.stat);
    
    setEnemy(prev => ({...prev!, trace: prev!.trace + traceAdd})); 

    if ((enemy.trace || 0) >= 100) {
        battlePrint('CRITICAL: LOCATION EXPOSED.');
        setMode('shell');
        setConnectedIp(null);
        setEnemy(null);
        if (enemy.isRival) {
            setPlayer(prev => ({...prev, money: Math.floor(prev.money * 0.5), activeBots: []}));
            alert('RIVAL HACK SUCCESSFUL. FUNDS DRAINED. BOTNET WIPED.');
        } else {
            setPlayer(prev => ({...prev, money: Math.floor(prev.money * 0.8)}));
        }
        return;
    }
    
    const cpuPart = HARDWARE_PARTS[player.hardware.cpu];
    setPlayer(prev => ({ ...prev, ram: Math.min(prev.maxRam, prev.ram + 1 + cpuPart.stat) }));
    
    const coolPart = HARDWARE_PARTS[player.hardware.cooling];
    setPlayer(prev => ({ ...prev, heat: Math.max(0, prev.heat - coolPart.stat) }));
  };

  if (effectiveMode === 'breach') {
      return (
        <div className="flex flex-col h-full bg-red-950/20 text-red-500 font-mono text-sm p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
            <div className="border-b-2 border-red-600 pb-2 mb-2 flex justify-between items-center bg-red-900/20 p-2 z-10">
                <span className="font-bold text-lg animate-pulse">!!! INTRUSION DETECTED !!!</span>
                <span className="text-xs text-red-300">COUNTER-MEASURES REQUIRED ({breach.wins}/{breach.winsNeeded})</span>
            </div>
            
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-fira z-10 p-2 bg-black/50 border border-red-900/50 mb-4">
                {breach.logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                        {`> ${log}`}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-black/80 border border-red-600 z-10">
                <div className="text-gray-400 text-xs mb-1">TYPE THE CODE TO BLOCK PACKET:</div>
                <div className="text-4xl font-retro tracking-[0.5em] text-white mb-4 select-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {breach.currentCode}
                </div>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onBreachInput(input);
                            setInput('');
                        }
                    }}
                    className="bg-red-900/30 border-b-2 border-red-500 text-center outline-none text-white w-48 font-bold text-xl p-1 focus:bg-red-900/50 transition-colors"
                    autoFocus
                    placeholder="ENTER CODE"
                    maxLength={5}
                />
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-black text-green-500 font-mono text-sm p-2">
        {effectiveMode === 'battle' && enemy && (
            <div className="border-b-2 border-green-800 pb-2 mb-2 flex justify-between text-xs bg-green-900/10 p-2">
                <div className="flex-1">
                    <span className="text-red-500 font-bold uppercase tracking-wider">{enemy.name} @ {connectedIp}</span> 
                    <br/>
                    <div className="flex items-center mt-1">
                        <span className="w-12">HP:</span>
                        <div className="w-32 h-2 bg-gray-800 border border-gray-600"><div style={{width: `${(enemy.hp/enemy.maxHp)*100}%`}} className="h-full bg-red-500 transition-all duration-300"></div></div>
                        <span className="ml-2 text-white">{enemy.hp}</span>
                    </div>
                </div>
                <div className="text-right flex-1 flex flex-col items-end">
                    <div className="flex items-center mt-1">
                         <span className="mr-2 text-white">{player.hp}</span>
                         <div className="w-32 h-2 bg-gray-800 border border-gray-600"><div style={{width: `${(player.hp/player.maxHp)*100}%`}} className="h-full bg-blue-500 transition-all duration-300"></div></div>
                         <span className="ml-2 w-8">HP</span>
                    </div>
                    <div className="mt-1 text-yellow-400">RAM: {player.ram}/{player.maxRam}</div>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-fira scrollbar-thin scrollbar-thumb-green-700 select-text cursor-text">
            {effectiveMode === 'shell' ? history.map((line, i) => (
                <div key={i} className="hover:bg-white/5 px-1">{line}</div>
            )) : battleLog.map((line, i) => (
                <div key={i} className={`px-1 ${line.includes('Error') ? 'text-red-400 font-bold' : 'text-green-500'}`}>{line}</div>
            ))}
            <div ref={bottomRef} />
        </div>

        <div className="mt-2 flex bg-green-900/20 p-1 rounded border border-green-900/50">
            <span className="mr-2 font-bold select-none text-green-300">{effectiveMode === 'shell' ? 'root@zeroday:~$' : 'CMD>'}</span>
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeCommand(input)}
                className="flex-1 bg-transparent border-none outline-none text-green-400 focus:ring-0 font-bold"
                autoFocus
                placeholder="Type command..."
            />
        </div>
    </div>
  );
};


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
  triggerReboot: () => void;
}

type Mode = 'shell' | 'battle' | 'breach';

export const Terminal: React.FC<TerminalProps> = ({ 
  player, setPlayer, inventory, setInventory, activeMission, addFile, playerFiles, rival, worldState, setWorldState, setRival,
  breach, onBreachInput, commandQueue, clearCommandQueue, triggerReboot
}) => {
  const [history, setHistory] = useState<string[]>(['Welcome to ZERO_DAY OS v2.1', 'Kernel loaded.', 'Type "help" for commands.']);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('shell');
  
  // Battle State
  const [connectedIp, setConnectedIp] = useState<string | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  
  // Combat Mechanics
  const [playerCooldowns, setPlayerCooldowns] = useState<Record<string, number>>({});
  const [activeEffects, setActiveEffects] = useState<Record<string, number>>({}); // id -> duration left

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, battleLog, breach.logs]);

  // Command Queue Consumer
  useEffect(() => {
    if (commandQueue.length > 0) {
        const cmd = commandQueue[0];
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
    
    // Only add to history if in shell mode, otherwise battle log handles it
    if (effectiveMode === 'shell') {
        setHistory(prev => [...prev, `root@zeroday:~$ ${cmdStr}`]);
    } 
    
    setInput('');

    if (effectiveMode === 'shell') {
      handleShellCommand(cmdKey, args.slice(1));
    } else if (effectiveMode === 'battle') {
      handleBattleCommand(cmdKey, args.slice(1));
    }
  };

  const print = (msg: string) => setHistory(prev => [...prev, msg]);
  const battlePrint = (msg: string) => setBattleLog(prev => [...prev, msg]);

  // --- LOGIC HELPERS ---
  const performLs = (printer: (msg: string) => void) => {
    if (connectedIp && enemy && enemy.hp <= 0) {
        printer(`Remote System (${connectedIp}) [ROOT ACCESS]:`);
        if (enemy.files.length === 0) {
            printer('(No files found)');
        }
        enemy.files.forEach(f => {
            const size = Math.floor(f.value * 0.1) + 'KB';
            printer(`-rw-r--r--  root  ${size.padEnd(8)} ${f.name}`);
        });
    } else if (!connectedIp) {
        printer('Local Drive /home/user/loot:');
        if (playerFiles.length === 0) printer('(Empty)');
        playerFiles.forEach(f => printer(`-rw-r--r--  user  ${f.name}  [${f.type}]`));
    } else {
        printer('ACCESS DENIED. Root required.');
    }
  };

  const performScp = (filename: string, printer: (msg: string) => void) => {
    if (!connectedIp || !enemy || enemy.hp > 0) {
        printer('Error: Root access required.');
        return;
    }
    const found = enemy.files.find(f => f.name === filename);
    if (found) {
        const alreadyHas = playerFiles.find(pf => pf.id === found.id || (pf.name === found.name && pf.originIp === connectedIp));
        if (alreadyHas) {
            printer(`Error: File '${filename}' already exists locally.`);
        } else {
            addFile({...found, originIp: connectedIp});
            printer(`Success: ${filename} downloaded to File Explorer.`);
        }
    } else {
        printer(`Error: File '${filename}' not found.`);
    }
  };

  // --- SHELL COMMANDS ---
  const handleShellCommand = (key: string, args: string[]) => {
    const cmd = COMMANDS[key];

    switch(key) {
        case 'help':
            print('--- SYSTEM COMMANDS ---');
            const sysCmds = ['nmap', 'ls', 'whoami', 'clear', 'exit', 'shutdown', 'wipe_drive', 'connect', 'list_sw', 'steal_sw', 'cat', 'rm', 'mv', 'touch', 'ps', 'kill', 'netstat'];
            sysCmds.forEach(c => {
                const cmdData = COMMANDS[c];
                if (cmdData) print(`${c.padEnd(12)} : ${cmdData.desc}`);
            });
            break;
        case 'shutdown': triggerReboot(); break;
        case 'ps':
            print('PID TTY          TIME CMD');
            print('  1 ?        00:00:01 systemd');
            print(' 42 tty1     00:00:00 bash');
            if (activeEffects['vpn']) print(' 99 tty1     00:00:00 vpn_daemon');
            break;
        case 'kill':
            if (args[0]) print(`Killed process ${args[0]}.`);
            else print('Usage: kill [pid]');
            break;
        case 'netstat':
            print('Active Internet connections:');
            print(`tcp        0      0 192.168.1.5:443         0.0.0.0:*               LISTEN`);
            print(`Alert Level: ${worldState.globalAlertLevel}%`);
            break;
        case 'cat':
            if (!args[0]) { print('Usage: cat [filename]'); return; }
            const fileToRead = playerFiles.find(f => f.name === args[0]);
            if (fileToRead) print(fileToRead.content);
            else print(`cat: ${args[0]}: No such file`);
            break;
        case 'rm':
            print('Permission denied: Filesystem is read-only in shell mode (Game Limit).'); 
            break;
        case 'touch':
            print(`Created file ${args[0] || 'new_file'}.`);
            break;
        case 'traceroute':
            print('traceroute to 8.8.8.8 (8.8.8.8), 30 hops max');
            print('1  192.168.1.1  2.123 ms');
            print('2  10.20.30.1   12.44 ms');
            print('3  * * *');
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
            performLs(print);
            break;
        case 'scp':
            if (!args[0]) { print('Usage: scp [filename]'); return; }
            performScp(args[0], print);
            break;
        case 'list_sw':
        case 'steal_sw':
             if (enemy && enemy.hp <= 0 && connectedIp) {
                 if (key === 'list_sw') {
                     print('--- ENEMY SOFTWARE DECK ---');
                     enemy.inventory.forEach(sw => print(`- ${sw} (${COMMANDS[sw].type})`));
                 } else {
                     const targetSw = args[0];
                     if (enemy.inventory.includes(targetSw)) {
                         if (!inventory.includes(targetSw)) {
                             setInventory(prev => [...prev, targetSw]);
                             print(`Successfully copied module: ${targetSw}`);
                         } else {
                             print(`Module ${targetSw} already installed.`);
                         }
                     } else {
                         print(`Module ${targetSw} not found on target.`);
                     }
                 }
             } else {
                 print('Requires Root Access on remote target.');
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
             print(`Command '${key}' not found.`);
             print(`Try: help, ls, nmap, connect [ip], whoami`);
    }
  };

  const startBattle = (ip: string, difficulty: number) => {
    setMode('battle');
    setConnectedIp(ip);
    setPlayerCooldowns({});
    setActiveEffects({});
    
    // Boss Fight
    if (difficulty === 99) {
        setEnemy({
            name: rival.name,
            hp: 500, maxHp: 500,
            trace: 50, firewall: 50, maxFirewall: 50,
            attacks: ['buffer_ovf', 'ddos_flood', 'zero_day'],
            inventory: ['buffer_ovf', 'ddos_flood', 'zero_day', 'fw_patch'],
            files: [],
            isRival: true,
            cooldowns: {}
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

    setEnemy({ 
        ...baseEnemy, 
        hp: baseEnemy.maxHp, 
        trace: 0, 
        files: loot,
        firewall: baseEnemy.maxFirewall,
        cooldowns: {} 
    });
    setBattleLog(['--- CONNECTION ESTABLISHED ---', `Target: ${baseEnemy.name} @ ${ip}`, `Security Level: ${difficulty + 1}`]);
  };

  const handleBattleCommand = (key: string, args: string[]) => {
    // Lockdown Check
    if ((key === 'disconnect' || key === 'exit')) {
        if (enemy?.isRival) {
            battlePrint('ERROR: CONNECTION LOCKED BY REMOTE HOST.');
            return;
        }
        if (enemy?.isGov && (enemy.trace > 75)) {
            battlePrint('⚠️ POLICE LOCKDOWN: CONNECTION SEVERED. CANNOT DISCONNECT.');
            return;
        }

        setMode('shell');
        setConnectedIp(null);
        setEnemy(null);
        print('Connection closed.');
        return;
    }

    // --- BATTLE HELP ---
    if (key === 'help') {
        if (enemy && enemy.hp <= 0) {
            battlePrint('--- ROOT ACCESS COMMANDS ---');
            battlePrint('ls               : List files');
            battlePrint('scp [file]       : Download file');
            battlePrint('list_sw          : View enemy deck');
            battlePrint('steal_sw [name]  : Copy enemy software');
            battlePrint('ransomware       : Deploy malware');
            battlePrint('exit             : Disconnect');
        } else {
            battlePrint('--- COMBAT MODULES ---');
            inventory.forEach(item => {
                const c = COMMANDS[item];
                if(c && ['atk', 'def', 'vpn', 'cool', 'buff_dodge', 'buff_ap'].includes(c.type)) {
                    const cd = playerCooldowns[item] || 0;
                    const cdStr = cd > 0 ? `[CD: ${cd}]` : '';
                    battlePrint(`${c.name.padEnd(12)} : ${c.desc} (Cost: ${c.cost}) ${cdStr}`);
                }
            });
            battlePrint('exit         : Abort Attack');
        }
        return;
    }

    // --- ROOT COMMANDS ---
    if (['ls', 'scp', 'list_sw', 'steal_sw'].includes(key)) {
        if (enemy && enemy.hp <= 0) {
            handleShellCommand(key, args);
        } else {
            battlePrint('⛔ SYSTEM LOCKED. GAIN ROOT ACCESS FIRST.');
        }
        return;
    }
    
    // --- RANSOMWARE ---
    if (key === 'ransomware') {
        if (!enemy || enemy.hp > 0) {
            battlePrint('Error: Root access required to deploy malware.');
            return;
        }
        if (player.ram < 15) {
            battlePrint('Error: Insufficient RAM (15 Required).');
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

    // --- COMBAT EXECUTION ---
    const cmd = COMMANDS[key];
    
    // VALIDATION
    if (!cmd || !inventory.includes(key)) {
        battlePrint(`Error: Module '${key}' not available.`);
        if (enemy && enemy.hp <= 0) {
            battlePrint('Try: ls, scp, list_sw, steal_sw, exit');
        } else {
            battlePrint(`Try: help, ${inventory.filter(i => COMMANDS[i].type === 'atk').slice(0,3).join(', ')}...`);
        }
        return;
    }

    if (player.ram < cmd.cost) {
      battlePrint(`Error: Insufficient RAM (Need ${cmd.cost}).`);
      return;
    }

    if (playerCooldowns[key] > 0) {
        battlePrint(`Error: Module Cooldown active (${playerCooldowns[key]} turns).`);
        return;
    }

    // EXECUTE
    setPlayer(prev => ({ ...prev, ram: prev.ram - cmd.cost, heat: prev.heat + cmd.heat }));
    battlePrint(`> ${cmd.name}...`);
    
    // Set Cooldown
    if (cmd.cooldown && cmd.cooldown > 0) {
        setPlayerCooldowns(prev => ({...prev, [key]: cmd.cooldown! + 1})); // +1 because decrement happens at end of turn
    }

    let newHp = enemy!.hp;
    let newTrace = enemy!.trace;
    let newFirewall = enemy!.firewall;

    // --- NEW COMMAND LOGIC ---
    if (cmd.id === 'arp_spoof') {
        setActiveEffects(prev => ({...prev, 'spoof': 2}));
        battlePrint('ARP Cache poisoned. Trace accumulation halted for 1 turn.');
    }
    if (cmd.id === 'deauth') {
        if (Math.random() < 0.2) {
            battlePrint('Target Disconnected! Stunned for 1 turn.');
            // Implement stun logic if needed, for now just flavor + dmg
        }
        newHp -= cmd.val || 10;
        battlePrint('Deauth packets sent.');
    }
    if (cmd.id === 'packet_sniff') {
        battlePrint('Intercepting traffic...');
        battlePrint(`Target OS: Unix | Open Ports: 22, 80, 443`);
        battlePrint(`Hidden Files: ${enemy!.files.length}`);
    }
    if (cmd.id === 'brute_force') {
        newHp -= cmd.val || 8;
        battlePrint('Brute forcing credentials...');
    }
    if (cmd.id === 'logic_bomb') {
        battlePrint('Logic bomb planted. Detonation in 2 turns...');
        // Simplified: Deals instant dmg for now, real logic would use effects state
        newHp -= cmd.val || 50;
    }

    // ATTACK LOGIC
    if (cmd.type === 'atk') {
        const mitigation = newFirewall;
        let rawDmg = cmd.val || 0;
        
        // Armor Break
        if (cmd.id === 'sql_inject') {
            newFirewall = Math.max(0, newFirewall - 2);
            battlePrint(`Target Firewall compromised (-2).`);
        }

        let actualDmg = Math.max(0, rawDmg - mitigation);
        
        // Firewall Degradation
        let absorbed = rawDmg - actualDmg;
        if (absorbed > 0) {
            newFirewall = Math.max(0, newFirewall - absorbed);
            battlePrint(`Firewall absorbed impact. Integrity reduced to ${newFirewall}.`);
        }
        
        if (actualDmg > 0) {
            battlePrint(`Hit for ${actualDmg} damage.`);
            newHp -= actualDmg;
        } else {
             battlePrint(`Attack fully mitigated by Firewall.`);
        }
    }

    // DEFENSE LOGIC
    if (cmd.type === 'def') {
        setPlayer(prev => ({...prev, hp: Math.min(prev.maxHp, prev.hp + (cmd.val || 0))}));
        battlePrint(`Repaired ${cmd.val} integrity.`);
        // Note: fw_patch specifically might add temp armor, handled via just heal for now or simplified
        if (cmd.id === 'fw_patch') {
             // Maybe restore some firewall if we tracked Player Firewall? 
             // Currently Player stats don't track firewall explicitly, but we can assume 'hp' is integrity.
             battlePrint(`System patching complete.`);
        }
    }
    
    // UTILITY LOGIC
    if (cmd.type === 'cool') {
        setPlayer(prev => ({...prev, heat: Math.max(0, prev.heat - 30)}));
        battlePrint('Systems cooled.');
    }
    if (cmd.type === 'vpn' && cmd.id === 'vpn_mask') {
        newTrace = Math.max(0, newTrace - (cmd.val || 15));
        setActiveEffects(prev => ({...prev, 'vpn': (cmd.duration || 2) + 1 })); // +1 buffer
        battlePrint(`VPN Active. Evasion protocols engaged for ${cmd.duration} turns.`);
    }

    // Update Enemy State
    if (newHp <= 0) {
        setEnemy(prev => ({ ...prev!, hp: 0, firewall: 0 }));
        battlePrint('*** ROOT ACCESS GRANTED ***');
        if (enemy?.isRival) {
            battlePrint('RIVAL NEUTRALIZED. REPUTATION RESTORED.');
            setRival(prev => ({ ...prev, active: false, aggression: 0 }));
            setTimeout(() => setMode('shell'), 2000);
        } else {
            battlePrint("Type 'ls' to view files or 'list_sw' to view software.");
        }
        return; 
    } else {
        setEnemy(prev => ({ ...prev!, hp: newHp, trace: newTrace, firewall: newFirewall }));
    }

    setTimeout(() => enemyTurn(), 800);
  };

  const enemyTurn = () => {
    if (!enemy || enemy.hp <= 0) return;
    
    // Decrement Player Cooldowns & Effects
    setPlayerCooldowns(prev => {
        const next = {...prev};
        for(let k in next) {
             if (next[k] > 0) next[k]--;
             if (next[k] <= 0) delete next[k];
        }
        return next;
    });

    setActiveEffects(prev => {
        const next = {...prev};
        for(let k in next) {
            if (next[k] > 0) next[k]--;
            if (next[k] <= 0) {
                if (k === 'vpn') battlePrint('VPN protocols expired.');
                if (k === 'spoof') battlePrint('ARP Spoofing expired.');
                delete next[k];
            }
        }
        return next;
    });

    // Enemy AI with Cooldowns
    const possibleMoves = enemy.inventory.filter(m => !enemy.cooldowns[m]);
    
    // Filter bad moves
    let validMoves = possibleMoves;
    if (enemy.hp > enemy.maxHp * 0.8) {
        validMoves = validMoves.filter(m => COMMANDS[m].type !== 'def'); // Don't heal if high HP
    }
    
    if (validMoves.length === 0) validMoves = ['ping']; // Fallback

    const atkKey = validMoves[Math.floor(Math.random() * validMoves.length)];
    const cmdData = COMMANDS[atkKey];
    
    // Apply Cooldown to Enemy
    if (cmdData.cooldown) {
        setEnemy(prev => ({
            ...prev!,
            cooldowns: { ...prev!.cooldowns, [atkKey]: cmdData.cooldown! + 1 }
        }));
    }
    
    // Decrement Enemy Cooldowns
    setEnemy(prev => {
        const nextCD = { ...prev!.cooldowns };
        for(let k in nextCD) {
            if (nextCD[k] > 0) nextCD[k]--;
            if (nextCD[k] <= 0) delete nextCD[k];
        }
        return { ...prev!, cooldowns: nextCD };
    });

    let damage = 10;
    
    if (cmdData) {
        battlePrint(`Target executing ${cmdData.name}...`);
        
        if (cmdData.type === 'def') {
            const heal = cmdData.val || 10;
            setEnemy(prev => ({...prev!, hp: Math.min(prev!.maxHp, prev!.hp + heal)}));
            
            // If fw_patch, restore firewall
            if (atkKey === 'fw_patch') {
                setEnemy(prev => ({...prev!, firewall: Math.min(prev!.maxFirewall, prev!.firewall + 10)}));
                battlePrint(`Enemy restored firewall integrity.`);
            } else {
                battlePrint(`Enemy repaired ${heal} HP.`);
            }
        } else if (cmdData.type === 'atk') {
            damage = cmdData.val || 10;
            
            // Check Player Dodge (VPN)
            if (activeEffects['vpn'] > 0) {
                if (Math.random() > 0.5) {
                     battlePrint(`EVADED! VPN masked your signature.`);
                     damage = 0;
                }
            }
            
            if (damage > 0) {
                setPlayer(prev => ({...prev, hp: prev.hp - damage}));
                battlePrint(`WARNING: Breach detected! -${damage} Integrity`);
            }
        }
    } else {
        battlePrint(`Target executing basic attack...`);
        setPlayer(prev => ({...prev, hp: prev.hp - damage}));
    }
    
    // Trace Logic
    const netPart = HARDWARE_PARTS[player.hardware.network];
    const traceAdd = Math.max(1, (10 + (worldState.globalAlertLevel / 10)) - netPart.stat);
    
    // VPN pauses trace accumulation?
    let finalTraceAdd = traceAdd;
    if (activeEffects['vpn'] > 0 || activeEffects['spoof'] > 0) finalTraceAdd = 0;

    const nextTrace = (enemy.trace || 0) + finalTraceAdd;
    setEnemy(prev => ({...prev!, trace: nextTrace})); 

    if (nextTrace >= 100) {
        battlePrint('CRITICAL: LOCATION EXPOSED.');
        if (enemy.isGov) {
            battlePrint('🚨 FBI OPEN UP! FUNDS SEIZED.');
            setPlayer(prev => ({...prev, money: 0}));
            setTimeout(() => triggerReboot(), 2000);
            return;
        }
        setMode('shell'); setConnectedIp(null); setEnemy(null);
        if (enemy.isRival) {
            setPlayer(prev => ({...prev, money: Math.floor(prev.money * 0.5), activeBots: []}));
            alert('RIVAL HACK SUCCESSFUL. FUNDS DRAINED.');
        } else {
            setPlayer(prev => ({...prev, money: Math.floor(prev.money * 0.8)}));
            alert('TRACE COMPLETE. DISCONNECTED. FUNDS LOST.');
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
        <div className="flex flex-col h-full bg-red-950/20 text-red-500 font-tiny5 text-sm p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
            <div className="border-b-2 border-red-600 pb-2 mb-2 flex justify-between items-center bg-red-900/20 p-2 z-10">
                <span className="font-bold text-lg animate-pulse">!!! INTRUSION DETECTED !!!</span>
                <span className="text-xs text-red-300">COUNTER-MEASURES REQUIRED ({breach.wins}/{breach.winsNeeded})</span>
            </div>
            
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap z-10 p-2 bg-black/50 border border-red-900/50 mb-4">
                {breach.logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                        {`> ${log}`}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-black/80 border border-red-600 z-10">
                <div className="text-gray-400 text-xs mb-1">TYPE THE CODE TO BLOCK PACKET:</div>
                <div className="text-4xl tracking-[0.5em] text-white mb-4 select-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
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
                    className="bg-red-900/30 border-b-2 border-red-500 text-center outline-none text-white w-48 font-bold text-xl p-1 focus:bg-red-900/50 transition-colors font-tiny5"
                    autoFocus
                    placeholder="ENTER CODE"
                    maxLength={5}
                />
            </div>
        </div>
      );
  }

  return (
    <div className={`flex flex-col h-full bg-black text-green-500 font-tiny5 text-base p-2 ${enemy?.isGov ? 'border-4 border-red-900 animate-pulse' : ''}`}>
        {effectiveMode === 'battle' && enemy && (
            <div className={`border-b-2 pb-2 mb-2 flex justify-between text-xs p-2 ${enemy.isGov ? 'bg-red-900/20 border-red-600' : 'bg-green-900/10 border-green-800'}`}>
                <div className="flex-1">
                    <span className={`font-bold uppercase tracking-wider ${enemy.isGov ? 'text-blue-400 animate-pulse' : 'text-red-500'}`}>{enemy.name} @ {connectedIp}</span> 
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
                    {/* ENEMY DEF STAT */}
                    <div className="text-xs text-gray-500 mt-0.5">
                        STATUS: {enemy.firewall > 0 ? <span className="text-yellow-500 font-bold">ARMORED ({enemy.firewall})</span> : <span className="text-gray-600">VULNERABLE</span>}
                    </div>
                    {activeEffects['vpn'] > 0 && (
                         <div className="text-xs text-blue-400 font-bold animate-pulse">VPN ACTIVE ({activeEffects['vpn']}s)</div>
                    )}
                    {activeEffects['spoof'] > 0 && (
                         <div className="text-xs text-purple-400 font-bold animate-pulse">ARP SPOOF ({activeEffects['spoof']}s)</div>
                    )}
                    {enemy.trace > 0 && (
                         <div className="flex items-center mt-1 animate-pulse">
                            <span className="mr-2 text-red-500 font-bold">TRACE:</span>
                            <div className="w-32 h-2 bg-gray-800 border border-red-900"><div style={{width: `${Math.min(100, enemy.trace)}%`}} className="h-full bg-red-600 transition-all duration-300"></div></div>
                            <span className="ml-2 text-red-500">{Math.floor(enemy.trace)}%</span>
                        </div>
                    )}
                    <div className="mt-1 text-yellow-400">RAM: {player.ram}/{player.maxRam}</div>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-green-700 select-text cursor-text font-tiny5 text-lg">
            {effectiveMode === 'shell' ? history.map((line, i) => (
                <div key={i} className="hover:bg-white/5 px-1">{line}</div>
            )) : battleLog.map((line, i) => (
                <div key={i} className={`px-1 ${line.includes('Error') || line.includes('BLOCKED') ? 'text-red-400 font-bold' : 'text-green-500'}`}>{line}</div>
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
                className="flex-1 bg-transparent border-none outline-none text-green-400 focus:ring-0 font-bold font-tiny5 text-lg"
                autoFocus
                placeholder="Type command..."
            />
        </div>
    </div>
  );
};
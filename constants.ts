
import { Command, HardwarePart, Song, PhishingTemplate, SpamTemplate } from './types';

export const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateRandomIP = () => {
    const type = Math.random();
    if (type < 0.33) {
        return `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    } else if (type < 0.66) {
        return `172.${16 + Math.floor(Math.random() * 15)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    } else {
        return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
};

export const COMMANDS: Record<string, Command> = {
  // --- EXISTING COMBAT ---
  'ping': { id: 'ping', name: 'ping', type: 'atk', val: 5, cost: 1, heat: 2, desc: 'ICMP packet. 5 DMG.', cooldown: 0 },
  'ssh_crack': { id: 'ssh_crack', name: 'ssh_crack', type: 'atk', val: 12, cost: 3, heat: 10, desc: 'Brute force. 12 DMG.', cooldown: 0 },
  'sql_inject': { id: 'sql_inject', name: 'sql_inject', type: 'atk', val: 18, cost: 5, heat: 15, desc: 'Drop tables. 18 DMG. Armor Break.', cooldown: 0 },
  'ddos_flood': { id: 'ddos_flood', name: 'ddos_flood', type: 'atk', val: 25, cost: 8, heat: 25, desc: 'Packet flood. 25 DMG.', cooldown: 3 },
  'buffer_ovf': { id: 'buffer_ovf', name: 'buffer_ovf', type: 'atk', val: 45, cost: 12, heat: 40, desc: 'Memory exploit. 45 DMG.', cooldown: 4 },
  'ransomware': { id: 'ransomware', name: 'ransomware', type: 'atk', val: 60, cost: 15, heat: 60, desc: 'Encrypt & Extort. High Heat.', cooldown: 5 },
  
  // --- NEW COMBAT COMMANDS ---
  'brute_force': { id: 'brute_force', name: 'brute_force', type: 'atk', val: 8, cost: 2, heat: 5, desc: 'Rapid guess. Low cost attack.', cooldown: 0 },
  'logic_bomb': { id: 'logic_bomb', name: 'logic_bomb', type: 'atk', val: 50, cost: 10, heat: 35, desc: 'Delayed execution. Massive damage.', cooldown: 5 },
  'arp_spoof': { id: 'arp_spoof', name: 'arp_spoof', type: 'vpn', val: 0, cost: 4, heat: 5, desc: 'Redirect traffic. Stops trace for 1 turn.', cooldown: 3, duration: 1 },
  'deauth': { id: 'deauth', name: 'deauth', type: 'atk', val: 10, cost: 6, heat: 15, desc: 'Disconnect users. Stuns enemy (10% chance).', cooldown: 3 },
  'packet_sniff': { id: 'packet_sniff', name: 'packet_sniff', type: 'scan', val: 0, cost: 3, heat: 5, desc: 'Steal intel. Reveals hidden files.', cooldown: 2 },

  // --- DEFENSE/UTIL ---
  'fw_patch': { id: 'fw_patch', name: 'fw_patch', type: 'def', val: 15, cost: 2, heat: 5, desc: 'Shield +15. Restore Firewall.', cooldown: 3 },
  'vpn_mask': { id: 'vpn_mask', name: 'vpn_mask', type: 'vpn', val: 0, cost: 5, heat: 5, desc: '2 Turns Evasion + Pause Trace.', cooldown: 4, duration: 2 },
  'cool_down': { id: 'cool_down', name: 'cool_down', type: 'cool', val: 30, cost: 2, heat: -30, desc: 'Flush Fans. -30 Heat.', cooldown: 1 },
  'whoami': { id: 'whoami', name: 'whoami', type: 'scan', val: 0, cost: 0, heat: 0, desc: 'Scan target stats.', cooldown: 0 },
  'wipe_drive': { id: 'wipe_drive', name: 'wipe_drive', type: 'sys', val: 0, cost: 0, heat: 0, desc: 'EMERGENCY WIPE.', cooldown: 0 },
  'nmap': { id: 'nmap', name: 'nmap', type: 'scan', val: 0, cost: 5, heat: 10, desc: 'Scan subnet for targets.', cooldown: 0 },
  'shutdown': { id: 'shutdown', name: 'shutdown', type: 'sys', cost: 0, heat: 0, desc: 'Force PC shutdown.', cooldown: 0 },
  'traceroute': { id: 'traceroute', name: 'traceroute', type: 'scan', val: 0, cost: 2, heat: 2, desc: 'Map path to target IP.', cooldown: 0 },
  'netstat': { id: 'netstat', name: 'netstat', type: 'scan', val: 0, cost: 0, heat: 0, desc: 'Network statistics & trace info.', cooldown: 0 },
  'ps': { id: 'ps', name: 'ps', type: 'sys', cost: 0, heat: 0, desc: 'List active processes/effects.', cooldown: 0 },
  'kill': { id: 'kill', name: 'kill', type: 'sys', cost: 5, heat: 5, desc: 'Terminate process/effect.', cooldown: 0 },

  // --- FILE MANIPULATION ---
  'ls': { id: 'ls', name: 'ls', type: 'shell', cost: 0, heat: 0, desc: 'List files.', cooldown: 0 },
  'scp': { id: 'scp', name: 'scp', type: 'shell', cost: 0, heat: 0, desc: 'Download file.', cooldown: 0 },
  'cat': { id: 'cat', name: 'cat', type: 'shell', cost: 0, heat: 0, desc: 'Read file content.', cooldown: 0 },
  'rm': { id: 'rm', name: 'rm', type: 'shell', cost: 0, heat: 0, desc: 'Remove file.', cooldown: 0 },
  'mv': { id: 'mv', name: 'mv', type: 'shell', cost: 0, heat: 0, desc: 'Rename file.', cooldown: 0 },
  'touch': { id: 'touch', name: 'touch', type: 'shell', cost: 0, heat: 0, desc: 'Create empty file.', cooldown: 0 },
  'grep': { id: 'grep', name: 'grep', type: 'shell', cost: 0, heat: 0, desc: 'Search file for string.', cooldown: 0 },
  'decipher': { id: 'decipher', name: 'decipher', type: 'shell', cost: 10, heat: 10, desc: 'Attempt to decrypt file.', cooldown: 0 },

  // --- SHELL ---
  'list_sw': { id: 'list_sw', name: 'list_sw', type: 'shell', cost: 0, heat: 0, desc: 'List enemy software deck.', cooldown: 0 },
  'steal_sw': { id: 'steal_sw', name: 'steal_sw', type: 'shell', cost: 0, heat: 0, desc: 'Copy software from enemy.', cooldown: 0 },
  'exit': { id: 'exit', name: 'exit', type: 'sys', cost: 0, heat: 0, desc: 'Disconnect.', cooldown: 0 },
  'help': { id: 'help', name: 'help', type: 'sys', cost: 0, heat: 0, desc: 'Show commands.', cooldown: 0 },
  
  // --- BOTS / ITEMS ---
  'auto_miner_v1': { id: 'auto_miner_v1', name: 'MinerScript_v1', type: 'passive', cost: 0, heat: 0, desc: 'Passive Income: $5/tick', val: 5 },
  'db_dump': { id: 'db_dump', name: 'Leaked Database', type: 'passive', cost: 0, heat: 0, desc: 'List of vulnerable IPs', val: 200 },
};

export const HARDWARE_PARTS: Record<string, HardwarePart> = {
  // CPU (AP Regen)
  'cpu_v1': { id: 'cpu_v1', name: 'Intel 486', type: 'cpu', stat: 1, cost: 0, desc: 'Standard issue.' },
  'cpu_v2': { id: 'cpu_v2', name: 'Pentium Pro', type: 'cpu', stat: 2, cost: 500, desc: 'Faster cycles. +1 AP/turn' },
  'cpu_v3': { id: 'cpu_v3', name: 'Core 2 Duo', type: 'cpu', stat: 4, cost: 1500, desc: 'Dual threading. +3 AP/turn' },
  
  // RAM (Max AP)
  'ram_v1': { id: 'ram_v1', name: '4MB Stick', type: 'ram', stat: 10, cost: 0, desc: 'Basic memory.' },
  'ram_v2': { id: 'ram_v2', name: '16MB EDO', type: 'ram', stat: 15, cost: 400, desc: 'Expanded capacity. 15 Max AP.' },
  'ram_v3': { id: 'ram_v3', name: '64MB SDRAM', type: 'ram', stat: 25, cost: 1200, desc: 'High density. 25 Max AP.' },

  // COOLING (Heat Dissipation/Max Heat)
  'cool_v1': { id: 'cool_v1', name: 'Stock Fan', type: 'cooling', stat: 5, cost: 0, desc: 'Noisy fan.' },
  'cool_v2': { id: 'cool_v2', name: 'Copper Sink', type: 'cooling', stat: 10, cost: 300, desc: 'Better thermal conductivity.' },
  'cool_v3': { id: 'cool_v3', name: 'Liquid Nitrogen', type: 'cooling', stat: 25, cost: 2000, desc: 'Sub-zero temps. Massive cooling.' },

  // NETWORK (Trace Reduction)
  'net_v1': { id: 'net_v1', name: '56k Modem', type: 'network', stat: 0, cost: 0, desc: 'Beep boop.' },
  'net_v2': { id: 'net_v2', name: 'DSL Line', type: 'network', stat: 10, cost: 600, desc: '-10% Trace Speed.' },
  'net_v3': { id: 'net_v3', name: 'Fiber Link', type: 'network', stat: 25, cost: 1800, desc: '-25% Trace Speed.' },
};

export const SONGS: Song[] = [
  { id: '1', title: 'Neon Nightmares', artist: 'CyberDreams', duration: '3:45' },
  { id: '2', title: 'Mainframe Crash', artist: 'Null Pointer', duration: '2:30' },
  { id: '3', title: 'Analog Tears', artist: 'Synthwave Sadness', duration: '4:12' },
  { id: '4', title: 'Root Access', artist: 'Sudo User', duration: '3:15' },
];

export const THEMES = {
  classic: { bg: '#050505', text: '#00ff41', border: '#00cc33' },
  matrix: { bg: '#001100', text: '#00ff00', border: '#004400' },
  neon: { bg: '#1a001a', text: '#ff00ff', border: '#aa00aa' },
  amber: { bg: '#110d00', text: '#ffb000', border: '#cc8800' },
};

export const STARTING_INVENTORY = [
    'ping', 'vpn_mask', 'whoami', 'ssh_crack', 'cool_down', 'ls', 'scp', 'cat', 'rm', 'exit', 'help', 
    'ransomware', 'wipe_drive', 'nmap', 'shutdown', 'sql_inject', 'list_sw', 'steal_sw', 'fw_patch',
    'netstat', 'ps', 'kill', 'traceroute', 'brute_force', 'logic_bomb', 'arp_spoof', 'deauth', 'packet_sniff'
];

export const ENEMIES = [
  { name: 'Script Kiddie', hp: 30, maxHp: 30, trace: 0, firewall: 0, maxFirewall: 0, attacks: ['ping'], inventory: ['ping', 'cool_down'], cooldowns: {} },
  { name: 'Corp SysAdmin', hp: 80, maxHp: 80, trace: 0, firewall: 10, maxFirewall: 10, attacks: ['ping', 'fw_patch', 'brute_force'], inventory: ['ping', 'fw_patch', 'ssh_crack', 'brute_force'], cooldowns: {} },
  { name: 'Gov Mainframe', hp: 200, maxHp: 200, trace: 0, firewall: 25, maxFirewall: 25, attacks: ['ssh_crack', 'fw_patch', 'trace_back', 'logic_bomb'], inventory: ['ssh_crack', 'buffer_ovf', 'trace_back', 'logic_bomb'], isGov: true, cooldowns: {} },
  { name: 'Police Server', hp: 150, maxHp: 150, trace: 0, firewall: 20, maxFirewall: 20, attacks: ['trace_back', 'fw_patch', 'deauth'], inventory: ['trace_back', 'fw_patch', 'ddos_flood', 'deauth'], isGov: true, cooldowns: {} },
];

export const NEWS_HEADLINES = [
  "Ransomware attacks on the rise in sector 7.",
  "New hardware hitting the black market.",
  "F.B.I. raids notorious hacker den.",
  "Crypto value fluctuates wildly.",
];

export const SPAM_TEMPLATES: SpamTemplate[] = [
    { subject: 'You won a prize!', body: 'CLICK HERE TO CLAIM $1,000,000', sender: 'PrizeBot_9000', difficulty: 1, buttonText: 'CLAIM PRIZE NOW!!!' },
    { subject: 'Security Alert', body: 'Unusual sign-in activity detected.\nVerify your account immediately.', sender: 'Admin_Support', difficulty: 2, buttonText: 'VERIFY ACCOUNT' },
    { subject: 'Invoice #9923', body: 'Payment overdue. View invoice details attached.', sender: 'Billing_Dept', difficulty: 2, buttonText: 'DOWNLOAD INVOICE' },
    { subject: 'Hot crypto tip', body: 'This coin is going to moon 1000x!!! Buy now!', sender: 'Crypto_King', difficulty: 1, buttonText: 'BUY TOKEN' },
    { subject: 'System Update Required', body: 'Critical vulnerability patched. Update your drivers now.', sender: 'Sys_Admin', difficulty: 3, buttonText: 'INSTALL UPDATE' },
    { subject: 'Confidential Job Offer', body: 'We have a special task for you. High pay. No questions.', sender: 'The_Broker', difficulty: 3, buttonText: 'VIEW DETAILS' },
];

export const BREACH_LOGS = {
    success: ['Firewall layer restored.', 'Packet filtered successfully.', 'Trace blocked.', 'Encryption key rotated.', 'Port 22 secured.'],
    fail: ['Handshake failed.', 'Packet loss detected.', 'Proxy bypass failed.', 'Auth token rejected.', 'Rerouting failed...']
};

export const RIVAL_MESSAGES = {
    low: [{ subject: "Cute setup", body: "I see you. Stay out of my territory." }],
    medium: [{ subject: "Back off", body: "This is my turf. Next time, I won't be polite." }],
    high: [{ subject: "WAR", body: "You are dead. Prepare for a full system wipe." }]
};

export const MISSION_CLIENTS = ['DedSec', 'Anonymous', 'CorpExec'];
export const TARGET_NAMES = ['Biotech_Corp', 'Global_Bank', 'Police_Database'];
export const FILE_NAMES = ['passwords.db', 'blueprints.cad', 'accounts.xls'];

export const MISSION_TEMPLATES = [
    { text: "Retrieve the file from their secure server.", fileType: "binary" },
];

export const RIVAL_RESPONSES = {
    aggressive: { subject: "You'll regret that", body: "Watch your back." },
    defensive: { subject: "Whatever", body: "Just stay out of my way." },
    neutral: { subject: "Acknowledged", body: "Business is business." }
};

export const WIFI_SSIDS = ['Apartment_5G', 'Starbucks_Guest', 'Police_Surveillance_Van', 'Linksys_Admin', 'Corporate_Guest', 'FBI_Van_4'];

export const PHISHING_TEMPLATES: PhishingTemplate[] = [
  { id: 'p1', label: 'Fake Login', subject: 'Account Verification', body: 'Dear user, please click here to verify login.', difficultyReq: 0, successRate: 0.4 },
  { id: 'p2', label: 'Prince Scam', subject: 'Investment Opportunity', body: 'I am a prince and I need your help.', difficultyReq: 10, successRate: 0.2 },
  { id: 'p3', label: 'CEO Fraud', subject: 'Urgent Wire Transfer', body: 'Need this processed immediately. - CEO', difficultyReq: 50, successRate: 0.6 },
];

export const TUTORIAL_STEPS = [
    { title: "Welcome Hacker", text: "Welcome to Zero Day OS. You are a freelance cyber-mercenary." },
    { title: "Missions", text: "Check your Mail for contracts. Clients will provide an IP. Type 'connect [IP]' in the Terminal to start." },
    { title: "Combat", text: "Battles are turn-based. Manage your RAM (Action Points) and HEAT. If Heat gets too high, you take damage." },
    { title: "Cooldowns", text: "Powerful moves like fw_patch and vpn_mask have cooldowns. Use them wisely. Firewalls degrade when hit." },
    { title: "Root Access", text: "Defeat the enemy to gain ROOT access. Then use 'ls' to find files and 'scp [file]' to steal them." },
    { title: "Black Market", text: "Use the Tor Browser to sell stolen files and buy upgrades for your Rig." },
    { title: "Rival", text: "A rival hacker is watching. If you gain too much rep, they will attack you directly." },
];
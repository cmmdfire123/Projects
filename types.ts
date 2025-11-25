
export enum AppId {
  TERMINAL = 'terminal',
  CHROME = 'chrome',
  TOR = 'tor',
  EXPLORER = 'explorer',
  MAIL = 'mail',
  NOTEPAD = 'notepad',
  VPN = 'vpn',
  MINIGAME = 'minigame',
  HARDWARE = 'hardware',
  CRYPTO = 'crypto',
  MUSIC = 'music',
}

export type CommandType = 'atk' | 'def' | 'vpn' | 'counter' | 'buff_dodge' | 'cool' | 'buff_ap' | 'scan' | 'shell' | 'macro' | 'sys' | 'multi_atk' | 'passive';

export interface Command {
  id: string;
  name: string;
  type: CommandType;
  val?: number;
  cost: number;
  heat: number;
  desc: string;
  cooldown?: number;
  isConsumable?: boolean; 
}

export interface HardwarePart {
  id: string;
  name: string;
  type: 'cpu' | 'ram' | 'cooling' | 'network';
  stat: number; // AP Regen (CPU), Max RAM (RAM), Heat Dissipation (Cooling), Trace Reduct (Net)
  cost: number;
  desc: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  ram: number;
  maxRam: number; // Derived from Hardware
  heat: number;
  maxHeat: number;
  money: number;
  reputation: number;
  activeBots: string[]; 
  hardware: {
    cpu: string; // ID of part
    ram: string;
    cooling: string;
    network: string;
  };
  theme: 'classic' | 'matrix' | 'neon' | 'amber';
}

export interface LocalFile {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'encrypted' | 'binary' | 'archive';
  value: number;
  originIp?: string;
}

export interface Mission {
  id: string;
  title: string;
  client: string;
  faction: 'syndicate' | 'hacktivist' | 'corp' | 'neutral';
  description: string;
  targetIp: string;
  difficulty: number;
  reward: number;
  requiredFilename: string; 
  isCompleted: boolean;
}

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  trace: number;
  firewall: number;
  attacks: string[];
  files: LocalFile[];
  isRival?: boolean;
}

export interface Mail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  missionId?: string;
  read: boolean;
  date: string;
  isSpam?: boolean;
  spamDifficulty?: number; 
  canReply?: boolean;
}

export type WindowState = {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
};

export interface RivalState {
  name: string;
  active: boolean;
  aggression: number; // 0-100. At 100 -> Boss Fight
  skill: number;
  lastActionTime: number;
  fundsStolen: number;
}

export interface FactionState {
  syndicate: number;
  hacktivist: number;
  corp: number;
}

export interface RansomwareActive {
  id: string;
  targetIp: string;
  potentialValue: number;
  timeLeft: number; // Seconds
}

export interface WorldState {
  marketMultiplier: number; 
  globalAlertLevel: number; // 0-100. At 100 -> RAID
  day: number;
  activeRansomware: RansomwareActive[];
  raidActive: boolean;
  raidTimer: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export interface BreachState {
  active: boolean;
  progress: number; // 0 to 100
  targetFileId: string | null;
  targetFileName: string;
  difficulty: number;
  winsNeeded: number;
  wins: number;
  currentCode: string;
  logs: string[];
}

export interface WifiNetwork {
  ssid: string;
  strength: number;
  security: 'WEP' | 'WPA2' | 'OPEN';
  ip: string;
}

export interface PhishingTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
  difficultyReq: number; // Reputation needed
  successRate: number; 
}

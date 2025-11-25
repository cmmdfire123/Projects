
import React, { useState } from 'react';
import { Mail, Mission, LocalFile, PlayerStats } from '../../types';
import { PHISHING_TEMPLATES } from '../../constants';

interface MailAppProps {
  mails: Mail[];
  activeMission: Mission | null;
  acceptMission: (mailId: string) => void;
  completeMission: (fileId: string) => void;
  triggerSpam: (difficulty: number) => void;
  draggingFile: LocalFile | null;
  replyToRival: (mailId: string, tone: 'aggressive' | 'defensive' | 'neutral') => void;
  sendPhishing: (templateId: string) => void;
  player: PlayerStats;
}

export const MailApp: React.FC<MailAppProps> = ({ 
  mails, activeMission, acceptMission, completeMission, triggerSpam, draggingFile, replyToRival, sendPhishing, player
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [view, setView] = useState<'inbox' | 'phish'>('inbox');

  const selectedMail = mails.find(m => m.id === selectedId);

  const handleLinkClick = () => {
    if (selectedMail?.isSpam) {
        triggerSpam(selectedMail.spamDifficulty || 1);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggingFile) {
        if (activeMission && draggingFile.name === activeMission.requiredFilename) {
             completeMission(draggingFile.id);
             setIsReplying(false);
        } else {
             alert(`ERROR: File '${draggingFile.name}' does not match contract requirements.`);
        }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  return (
    <div className="h-full flex flex-col bg-[#e0e0e0] text-black font-sans select-none">
      {/* Top Bar Switch */}
      <div className="flex bg-gray-300 border-b border-gray-400">
          <button onClick={() => setView('inbox')} className={`flex-1 py-1 text-sm font-bold ${view === 'inbox' ? 'bg-blue-900 text-white' : 'hover:bg-gray-200'}`}>INBOX</button>
          <button onClick={() => setView('phish')} className={`flex-1 py-1 text-sm font-bold ${view === 'phish' ? 'bg-purple-900 text-white' : 'hover:bg-gray-200'}`}>PHISHING KIT</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {view === 'inbox' ? (
            <>
                {/* Sidebar */}
                <div className="w-1/3 bg-gray-200 border-r border-gray-400 flex flex-col">
                    <div className="p-2 bg-blue-800 text-white font-bold text-sm flex justify-between items-center shadow-md z-10">
                        <span>MESSAGES</span>
                        <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">{mails.filter(m => !m.read).length}</span>
                    </div>
                    <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-400">
                        {mails.map(mail => (
                            <div 
                                key={mail.id} 
                                onClick={() => { setSelectedId(mail.id); setIsReplying(false); }}
                                className={`p-3 border-b border-gray-300 cursor-pointer text-sm transition-colors ${selectedId === mail.id ? 'bg-blue-200' : mail.isSpam ? 'hover:bg-red-100 bg-red-50' : 'hover:bg-white bg-gray-50'} ${!mail.read ? 'font-bold border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="truncate flex justify-between mb-1">
                                    <span className="truncate pr-2">{mail.sender}</span>
                                    <span className="text-[10px] text-gray-500 shrink-0">{mail.date}</span>
                                </div>
                                <div className={`truncate text-xs ${mail.isSpam ? 'text-red-600 italic' : 'text-gray-600'}`}>{mail.subject}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-white relative">
                    {selectedMail ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-300 bg-gray-50 shadow-sm">
                                <h2 className={`font-bold text-lg ${selectedMail.isSpam ? 'text-red-600' : ''}`}>{selectedMail.subject}</h2>
                                <div className="text-xs text-gray-500 flex justify-between mt-2">
                                    <span className="bg-gray-200 px-2 py-0.5 rounded border border-gray-300">From: {selectedMail.sender}</span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 flex-1 overflow-auto font-serif whitespace-pre-line text-sm leading-relaxed text-gray-800">
                                {selectedMail.body}
                                {selectedMail.isSpam && (
                                    <div className="mt-8 text-center">
                                        <button onClick={handleLinkClick} className="bg-red-600 text-white font-bold py-3 px-6 rounded animate-bounce shadow-lg hover:bg-red-700">
                                            💰 CLAIM PRIZE NOW!!! 💰
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Reply / Drop Zone Area */}
                            {isReplying && (
                                <div 
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={() => setIsDragOver(false)}
                                    className={`m-4 p-8 border-4 border-dashed rounded transition-all flex flex-col items-center justify-center min-h-48 relative ${isDragOver ? 'border-green-500 bg-green-50 scale-105' : 'border-gray-300 bg-gray-50'}`}
                                >
                                    {selectedMail.canReply ? (
                                        <div className="w-full h-full flex flex-col items-center">
                                            <h3 className="text-gray-700 font-bold mb-4">SELECT RESPONSE</h3>
                                            <div className="flex gap-4 w-full justify-center">
                                                <button onClick={() => replyToRival(selectedMail.id, 'aggressive')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 p-3 rounded border border-red-300 font-bold text-xs uppercase shadow-sm">
                                                    Aggressive
                                                </button>
                                                <button onClick={() => replyToRival(selectedMail.id, 'neutral')} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 p-3 rounded border border-blue-300 font-bold text-xs uppercase shadow-sm">
                                                    Neutral
                                                </button>
                                                <button onClick={() => replyToRival(selectedMail.id, 'defensive')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded border border-gray-300 font-bold text-xs uppercase shadow-sm">
                                                    Defensive
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`text-4xl mb-2 transition-transform ${isDragOver ? 'scale-125' : ''}`}>
                                                {isDragOver ? '🔓' : '📎'}
                                            </div>
                                            <div className="font-bold text-gray-600">
                                                {isDragOver ? 'DROP EVIDENCE TO COMPLETE CONTRACT' : 'DRAG & DROP FILE HERE'}
                                            </div>
                                        </>
                                    )}
                                    <button onClick={() => setIsReplying(false)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">✕</button>
                                </div>
                            )}

                            {/* Actions */}
                            {!isReplying && (
                                <div className="p-4 bg-gray-100 border-t border-gray-300 flex justify-end gap-2">
                                    {selectedMail.missionId && !activeMission && !selectedMail.isSpam && (
                                        <button 
                                            onClick={() => acceptMission(selectedMail.id)}
                                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition-colors"
                                        >
                                            ACCEPT CONTRACT
                                        </button>
                                    )}
                                    {( (activeMission && selectedMail.missionId === activeMission.id) || selectedMail.canReply ) && (
                                        <button 
                                            onClick={() => setIsReplying(true)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            ↩ REPLY
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
                            <div className="text-6xl mb-4 grayscale opacity-20">📫</div>
                            <div>Select a message to read</div>
                        </div>
                    )}
                </div>
            </>
        ) : (
            // PHISHING TAB
            <div className="flex-1 bg-purple-50 p-6 overflow-auto">
                <h2 className="text-xl font-bold text-purple-900 mb-4 border-b border-purple-200 pb-2">SOCIAL ENGINEERING CAMPAIGNS</h2>
                <div className="grid grid-cols-1 gap-4">
                    {PHISHING_TEMPLATES.map(temp => (
                        <div key={temp.id} className="bg-white p-4 rounded shadow border border-purple-100 flex justify-between items-center">
                            <div className="flex-1">
                                <h3 className="font-bold text-purple-800">{temp.label}</h3>
                                <p className="text-xs text-gray-500 italic mb-2">"{temp.subject}"</p>
                                <div className="text-xs text-gray-600">
                                    Difficulty: <span className={player.reputation >= temp.difficultyReq ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{temp.difficultyReq} Rep</span>
                                    <span className="mx-2">|</span>
                                    Success Rate: {Math.floor(temp.successRate * 100)}%
                                </div>
                            </div>
                            <button 
                                onClick={() => sendPhishing(temp.id)}
                                disabled={player.reputation < temp.difficultyReq}
                                className={`px-4 py-2 text-xs font-bold rounded ${player.reputation < temp.difficultyReq ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:translate-y-1'}`}
                            >
                                LAUNCH
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <span className="font-bold">NOTE:</span> Successful phishing campaigns generate vulnerable targets with reduced firewall integrity. Responses take 10-20 seconds to arrive in your Inbox.
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

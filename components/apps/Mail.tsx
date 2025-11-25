
import React, { useState, useEffect } from 'react';
import { Mail, Mission, LocalFile, PlayerStats, RivalState } from '../../types';
import { PHISHING_TEMPLATES } from '../../constants';
import { GoogleGenAI, Type } from "@google/genai";

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
  rival: RivalState;
}

interface ReplyOptions {
    aggressive: string;
    defensive: string;
    neutral: string;
}

export const MailApp: React.FC<MailAppProps> = ({ 
  mails, activeMission, acceptMission, completeMission, triggerSpam, draggingFile, replyToRival, sendPhishing, player, rival
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [view, setView] = useState<'inbox' | 'phish'>('inbox');
  
  // AI State
  const [replyOptions, setReplyOptions] = useState<ReplyOptions | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

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

  const generateAIReplies = async (senderName: string) => {
      setIsLoadingAI(true);
      try {
          if (process.env.API_KEY) {
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const model = ai.models.getGenerativeModel({ 
                  model: "gemini-2.5-flash",
                  systemInstruction: "You are a writing assistant for a cyberpunk hacking game. Generate short, punchy email responses."
              });

              const prompt = `Generate 3 email reply options (Aggressive, Defensive, Neutral) for a player responding to a rival hacker named ${senderName}. 
              Player Reputation: ${player.reputation}. 
              Rival Aggression: ${rival.aggression}/100.
              Rival Skill: ${rival.skill}.
              
              Return JSON: { "aggressive": "string", "defensive": "string", "neutral": "string" }`;

              const response = await model.generateContent({
                  contents: { role: 'user', parts: [{ text: prompt }] },
                  config: {
                      responseMimeType: "application/json",
                      responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                              aggressive: { type: Type.STRING },
                              defensive: { type: Type.STRING },
                              neutral: { type: Type.STRING }
                          }
                      }
                  }
              });

              const text = response.text;
              if (text) {
                  setReplyOptions(JSON.parse(text));
              }
          } else {
              throw new Error("No API Key");
          }
      } catch (e) {
          // Fallback
          setReplyOptions({
              aggressive: "Back off or I'll brick your system.",
              defensive: "I don't want any trouble.",
              neutral: "Message received. Continuing operations."
          });
      } finally {
          setIsLoadingAI(false);
      }
  };

  useEffect(() => {
      if (isReplying && selectedMail?.canReply && !replyOptions) {
          generateAIReplies(selectedMail.sender);
      }
  }, [isReplying, selectedMail]);

  return (
    <div className="h-full flex flex-col bg-[#e0e0e0] text-black font-jersey select-none">
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
                                onClick={() => { setSelectedId(mail.id); setIsReplying(false); setReplyOptions(null); }}
                                className={`p-3 border-b border-gray-300 cursor-pointer text-base transition-colors ${selectedId === mail.id ? 'bg-blue-200' : mail.isSpam ? 'hover:bg-red-100 bg-red-50' : 'hover:bg-white bg-gray-50'} ${!mail.read ? 'font-bold border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="truncate flex justify-between mb-1">
                                    <span className="truncate pr-2">{mail.sender}</span>
                                    <span className="text-[10px] text-gray-500 shrink-0">{mail.date}</span>
                                </div>
                                <div className={`truncate text-sm ${mail.isSpam ? 'text-red-600 italic' : 'text-gray-600'}`}>{mail.subject}</div>
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
                                <h2 className={`font-bold text-2xl ${selectedMail.isSpam ? 'text-red-600' : ''}`}>{selectedMail.subject}</h2>
                                <div className="text-xs text-gray-500 flex justify-between mt-2">
                                    <span className="bg-gray-200 px-2 py-0.5 rounded border border-gray-300">From: {selectedMail.sender}</span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 flex-1 overflow-auto whitespace-pre-line text-xl leading-relaxed text-gray-800">
                                {selectedMail.body}
                                {selectedMail.isSpam && (
                                    <div className="mt-8 text-center">
                                        <button onClick={handleLinkClick} className="bg-red-600 text-white font-bold py-3 px-6 rounded animate-bounce shadow-lg hover:bg-red-700 uppercase">
                                            💰 {selectedMail.spamButtonText || 'CLAIM PRIZE NOW!!!'} 💰
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
                                            <h3 className="text-gray-700 font-bold mb-4 text-lg">
                                                {isLoadingAI ? 'GENERATING RESPONSE OPTIONS...' : 'SELECT RESPONSE'}
                                            </h3>
                                            
                                            {isLoadingAI ? (
                                                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                                            ) : replyOptions ? (
                                                <div className="flex flex-col gap-2 w-full max-w-lg">
                                                    <button onClick={() => replyToRival(selectedMail.id, 'aggressive')} className="text-left bg-red-50 hover:bg-red-100 text-red-900 p-3 rounded border border-red-200 text-sm shadow-sm group">
                                                        <span className="font-bold block text-red-700 mb-1">AGGRESSIVE</span>
                                                        "{replyOptions.aggressive}"
                                                    </button>
                                                    <button onClick={() => replyToRival(selectedMail.id, 'neutral')} className="text-left bg-blue-50 hover:bg-blue-100 text-blue-900 p-3 rounded border border-blue-200 text-sm shadow-sm group">
                                                        <span className="font-bold block text-blue-700 mb-1">NEUTRAL</span>
                                                        "{replyOptions.neutral}"
                                                    </button>
                                                    <button onClick={() => replyToRival(selectedMail.id, 'defensive')} className="text-left bg-gray-50 hover:bg-gray-100 text-gray-900 p-3 rounded border border-gray-200 text-sm shadow-sm group">
                                                        <span className="font-bold block text-gray-700 mb-1">DEFENSIVE</span>
                                                        "{replyOptions.defensive}"
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-red-500">Error loading options.</div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`text-4xl mb-2 transition-transform ${isDragOver ? 'scale-125' : ''}`}>
                                                {isDragOver ? '🔓' : '📎'}
                                            </div>
                                            <div className="font-bold text-gray-600 text-xl">
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
                            <div className="text-xl">Select a message to read</div>
                        </div>
                    )}
                </div>
            </>
        ) : (
            // PHISHING TAB
            <div className="flex-1 bg-purple-50 p-6 overflow-auto">
                <h2 className="text-2xl font-bold text-purple-900 mb-4 border-b border-purple-200 pb-2">SOCIAL ENGINEERING CAMPAIGNS</h2>
                <div className="grid grid-cols-1 gap-4">
                    {PHISHING_TEMPLATES.map(temp => (
                        <div key={temp.id} className="bg-white p-4 rounded shadow border border-purple-100 flex justify-between items-center">
                            <div className="flex-1">
                                <h3 className="font-bold text-purple-800 text-lg">{temp.label}</h3>
                                <p className="text-sm text-gray-500 italic mb-2">"{temp.subject}"</p>
                                <div className="text-sm text-gray-600">
                                    Difficulty: <span className={player.reputation >= temp.difficultyReq ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{temp.difficultyReq} Rep</span>
                                    <span className="mx-2">|</span>
                                    Success Rate: {Math.floor(temp.successRate * 100)}%
                                </div>
                            </div>
                            <button 
                                onClick={() => sendPhishing(temp.id)}
                                disabled={player.reputation < temp.difficultyReq}
                                className={`px-4 py-2 text-sm font-bold rounded ${player.reputation < temp.difficultyReq ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:translate-y-1'}`}
                            >
                                LAUNCH
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <span className="font-bold">NOTE:</span> Successful phishing campaigns generate vulnerable targets with reduced firewall integrity. Responses take 10-20 seconds to arrive in your Inbox.
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
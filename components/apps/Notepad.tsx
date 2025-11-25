
import React, { useState } from 'react';

export const Notepad: React.FC = () => {
  const [text, setText] = useState(() => localStorage.getItem('zeroday_notes') || '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    localStorage.setItem('zeroday_notes', e.target.value);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(text).then(() => {
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 text-black font-jersey">
        <div className="bg-gray-300 px-2 py-1 text-xs border-b border-gray-400 flex gap-2 items-center">
            <span className="font-bold mr-4">Notepad.exe</span>
            <button 
                onClick={copyAll}
                className="px-2 py-0.5 bg-gray-200 border border-gray-400 hover:bg-white active:bg-gray-300 rounded shadow-sm text-[10px]"
            >
                COPY ALL
            </button>
            <button 
                onClick={() => setText('')}
                className="px-2 py-0.5 bg-gray-200 border border-gray-400 hover:bg-white active:bg-gray-300 rounded shadow-sm text-[10px]"
            >
                CLEAR
            </button>
        </div>
        <textarea 
            className="flex-1 p-2 resize-none outline-none bg-white text-lg select-text font-tiny5"
            value={text}
            onChange={handleChange}
            placeholder="System Notes, IP Addresses, Passwords..."
            spellCheck={false}
        />
    </div>
  );
};
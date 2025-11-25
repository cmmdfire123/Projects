
import React from 'react';
import { LocalFile } from '../../types';

interface FileExplorerProps {
  files: LocalFile[];
  setDraggingFile: (file: LocalFile | null) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, setDraggingFile }) => {
  
  const handleDragStart = (e: React.DragEvent, file: LocalFile) => {
    setDraggingFile(file);
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a custom drag image (optional, but looks better)
    const dragIcon = document.createElement('div');
    dragIcon.innerText = file.type === 'binary' ? '💾' : '📄';
    dragIcon.style.fontSize = '24px';
    dragIcon.style.position = 'absolute';
    dragIcon.style.top = '-1000px';
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 0, 0);
    setTimeout(() => document.body.removeChild(dragIcon), 0);
  };

  const handleDragEnd = () => {
    setDraggingFile(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono text-sm select-none">
      <div className="bg-gray-800 p-2 border-b border-gray-700 flex gap-2 items-center">
        <button className="text-gray-400 hover:text-white">←</button>
        <button className="text-gray-400 hover:text-white">→</button>
        <div className="flex-1 px-2 py-1 bg-black/50 border border-gray-600 rounded text-xs text-white truncate">
          /home/user/loot
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        <div className="grid grid-cols-4 gap-4">
          {files.length === 0 && (
            <div className="col-span-4 text-center text-gray-500 mt-20 flex flex-col items-center">
              <span className="text-4xl mb-2">📂</span>
              <span>Directory Empty</span>
              <span className="text-xs mt-2">Connect to a remote host and use 'scp' to populate.</span>
            </div>
          )}
          {files.map((file) => (
            <div 
              key={file.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, file)}
              onDragEnd={handleDragEnd}
              className="flex flex-col items-center p-2 hover:bg-blue-900/40 rounded cursor-grab active:cursor-grabbing group border border-transparent hover:border-blue-500/50 transition-all active:scale-95"
            >
              <div className="w-12 h-12 mb-2 flex items-center justify-center text-4xl drop-shadow-md group-hover:scale-110 transition-transform">
                {file.type === 'binary' ? '💾' : file.type === 'encrypted' ? '🔒' : '📄'}
              </div>
              <div className="text-center text-xs truncate w-full font-bold group-hover:text-white">{file.name}</div>
              <div className="text-[10px] text-gray-500 group-hover:text-gray-300">{file.type.toUpperCase()}</div>
              <div className="text-[10px] text-green-600">${file.value}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-800 p-1 text-xs text-gray-400 border-t border-gray-700 flex justify-between px-3">
        <span>{files.length} object(s)</span>
        <span>Total Est. Value: ${files.reduce((acc, f) => acc + f.value, 0)}</span>
      </div>
    </div>
  );
};

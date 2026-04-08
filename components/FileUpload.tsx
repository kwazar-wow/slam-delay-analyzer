import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onDataParsed: (csvContent: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onDataParsed(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-20">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-slate-600 hover:border-blue-400 hover:bg-slate-800'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-700 rounded-full text-blue-400">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Upload Combat Log CSV</h3>
            <p className="text-slate-400 mt-2">
              Drag and drop your CSV file here, or click to browse.
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded border border-slate-700 max-w-sm">
            Format: "Time", "Event" columns required.<br/>
            E.g., "00:02.696", "Player Melee..."
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Example Data Button for Testing */}
      <div className="mt-8 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const exampleData = `"Time","Event",""\n"00:02.696","Player Melee Hellfire Channeler 1 1676",""\n"00:06.006","Player Melee Hellfire Channeler 1 986",""\n"00:06.898","Player Slam Hellfire Channeler 1 1132",""`;
            onDataParsed(exampleData);
          }}
          className="text-sm text-slate-500 hover:text-blue-400 underline"
        >
          Load minimal sample data
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
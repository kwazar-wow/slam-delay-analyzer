import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import { parseAndAnalyzeCSV } from './utils/parser';
import { AnalyzedEvent, AnalysisSummary } from './types';
import { Swords } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<{ events: AnalyzedEvent[], summary: AnalysisSummary } | null>(null);

  const handleDataParsed = (csvContent: string) => {
    try {
      const result = parseAndAnalyzeCSV(csvContent);
      setData(result);
    } catch (error) {
      console.error("Failed to parse CSV", error);
      alert("Failed to parse the provided CSV. Please ensure formatting matches the requirement.");
    }
  };

  const handleReset = () => {
    setData(null);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30 pb-12">
      {/* App Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
            <Swords size={24} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Slam Delay Analyzer
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {!data ? (
          <div className="animate-fade-in">
            <FileUpload onDataParsed={handleDataParsed} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <AnalysisDashboard 
              events={data.events} 
              summary={data.summary} 
              onReset={handleReset} 
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
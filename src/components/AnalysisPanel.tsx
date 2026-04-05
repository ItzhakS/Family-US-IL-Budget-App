import React, { useState } from 'react';
import { Transaction } from '../types';
import { getSpendingInsights } from '../services/geminiService';
import { Sparkles, Send, Loader2, MessageSquare } from 'lucide-react';

interface AnalysisPanelProps {
  transactions: Transaction[];
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ transactions }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await getSpendingInsights(transactions, query);
      setResponse(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
      <div className="flex items-center gap-2 mb-4 text-indigo-900">
        <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600">
          <Sparkles size={20} />
        </div>
        <h3 className="font-bold text-lg">AI Financial Advisor</h3>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-indigo-50 p-4 mb-4 min-h-[100px]">
        {response ? (
          <div className="prose prose-sm text-gray-700">
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        ) : (
          <div className="text-gray-400 text-sm flex flex-col items-center justify-center h-full py-4">
            <MessageSquare size={24} className="mb-2 opacity-20" />
            <p>Ask questions about your spending habits...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleAsk} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. How much did I spend on food last month?"
          className="w-full pl-4 pr-12 py-3 rounded-lg border border-indigo-100 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
      
      <div className="mt-3 flex flex-wrap gap-2">
        {['Highest expense?', 'Food spending?', 'Balance trend?'].map(q => (
          <button 
            key={q}
            onClick={() => setQuery(q)}
            className="text-xs px-3 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

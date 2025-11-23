import React, { useState, useEffect } from 'react';
import { AppState, Language, Scenario, VocabularyItem } from './types';
import { SCENARIOS } from './constants';
import { ScenarioCard } from './components/ScenarioCard';
import { WordViewer } from './components/WordViewer';
import { generateVocabularyList } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SCENARIO_SELECTION);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  
  // Learning Data State
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleScenarioSelect = async (scenario: Scenario) => {
    setCurrentScenario(scenario);
    setLoading(true);
    setAppState(AppState.LEARNING);
    
    try {
      const items = await generateVocabularyList(scenario.name, selectedLanguage);
      setVocabulary(items);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Failed to load vocabulary", error);
      alert("Failed to generate vocabulary. Please try again.");
      setAppState(AppState.SCENARIO_SELECTION);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleBackToMenu = () => {
    setAppState(AppState.SCENARIO_SELECTION);
    setVocabulary([]);
    setCurrentScenario(null);
  };

  const handleRefresh = async () => {
    if(currentScenario) {
        handleScenarioSelect(currentScenario);
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToMenu}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">TS</div>
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">TriLingual Scenes</h1>
        </div>

        {appState === AppState.SCENARIO_SELECTION && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
                {Object.values(Language).map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            selectedLanguage === lang 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>
        )}

        {appState === AppState.LEARNING && currentScenario && (
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    <span>{currentScenario.icon}</span>
                    <span>{currentScenario.name}</span>
                </div>
                <button 
                    onClick={handleBackToMenu}
                    className="text-sm font-bold text-slate-500 hover:text-slate-800"
                >
                    Exit
                </button>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* SCENARIO SELECTION */}
        {appState === AppState.SCENARIO_SELECTION && (
          <div className="h-full overflow-y-auto p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Choose a Scene</h2>
                <p className="text-slate-500">Pick a context to start generating useful vocabulary in <span className="font-bold text-indigo-600">{selectedLanguage}</span>.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {SCENARIOS.map(scenario => (
                  <ScenarioCard 
                    key={scenario.id} 
                    scenario={scenario} 
                    onClick={handleScenarioSelect} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEARNING VIEW */}
        {appState === AppState.LEARNING && (
            <div className="h-full flex flex-col items-center justify-center p-4">
                {loading ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                        <h3 className="text-xl font-bold text-slate-700">Consulting Gemini...</h3>
                        <p className="text-slate-500">Generating vocabulary list for {currentScenario?.name}</p>
                    </div>
                ) : vocabulary.length > 0 ? (
                    <div className="w-full h-full flex flex-col justify-between max-h-[800px]">
                         {/* Card Area */}
                         <div className="flex-1 flex items-center justify-center">
                             <WordViewer 
                                item={vocabulary[currentIndex]} 
                                scenarioName={currentScenario?.name || ''} 
                                targetLanguage={selectedLanguage}
                             />
                         </div>

                         {/* Controls */}
                         <div className="w-full max-w-4xl mx-auto py-6 px-4 flex items-center justify-between border-t border-slate-100 bg-white/50 backdrop-blur-sm rounded-t-3xl">
                             <button 
                                onClick={handlePrev} 
                                disabled={currentIndex === 0}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                                Prev
                             </button>

                             <div className="text-sm font-bold text-slate-400">
                                {currentIndex + 1} / {vocabulary.length}
                             </div>
                             
                             {currentIndex === vocabulary.length - 1 ? (
                                <button 
                                  onClick={handleRefresh}
                                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                                >
                                  Load New Words
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                  </svg>
                                </button>
                             ) : (
                                <button 
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                                >
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                             )}
                         </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-slate-500 mb-4">No words found.</p>
                        <button onClick={handleBackToMenu} className="text-indigo-600 font-bold">Go Back</button>
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
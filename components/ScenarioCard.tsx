import React from 'react';
import { Scenario } from '../types';

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: (scenario: Scenario) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onClick }) => {
  return (
    <button
      onClick={() => onClick(scenario)}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 transition-all hover:-translate-y-1 group"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
        {scenario.icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{scenario.name}</h3>
      <p className="text-xs text-slate-500 text-center">{scenario.description}</p>
    </button>
  );
};
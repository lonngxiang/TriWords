export enum Language {
  ENGLISH = 'English',
  JAPANESE = 'Japanese',
  CHINESE = 'Chinese'
}

export interface VocabularyItem {
  word: string;
  pronunciation: string; // IPA or Romaji/Pinyin
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export enum AppState {
  SCENARIO_SELECTION = 'SCENARIO_SELECTION',
  LEARNING = 'LEARNING'
}
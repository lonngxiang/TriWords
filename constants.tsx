import React from 'react';
import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  { id: 'coffee', name: 'Cafe & Ordering', icon: '☕', description: 'Ordering drinks, snacks, and cafe etiquette.' },
  { id: 'travel', name: 'Travel & Transport', icon: '✈️', description: 'Airports, trains, hotels, and directions.' },
  { id: 'business', name: 'Business Meeting', icon: '💼', description: 'Formal introductions, presentations, and office talk.' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', description: 'Clothes, sizes, bargaining, and payments.' },
  { id: 'hospital', name: 'Medical & Health', icon: '🏥', description: 'Symptoms, pharmacy, and doctor visits.' },
  { id: 'restaurant', name: 'Dining Out', icon: '🍽️', description: 'Reservations, menus, allergies, and bills.' },
  { id: 'home', name: 'Daily Life', icon: '🏠', description: 'Chores, furniture, family routines.' },
  { id: 'tech', name: 'Digital & Tech', icon: '💻', description: 'Internet, gadgets, troubleshooting.' },
];

// A room shuffles this deck once and plays each bonus only once before reshuffling.
type Text = { en: string; es: string };
type Quiz = { kind: 'quiz'; prompt: Text; answers: { en: string[]; es: string[] }; correct: number };
type Search = { kind: 'search'; prompt: Text; target: string; fillers: string[] };
export type BonusChallenge = Quiz | Search;

const quiz = (en: string, es: string, answers: string[], correct: number): Quiz => ({
  kind: 'quiz', prompt: { en, es }, answers: { en: answers, es: answers }, correct,
});

export const bonusChallenges: BonusChallenge[] = [
  quiz('What comes next? 2, 4, 8, 16, …', '¿Qué sigue? 2, 4, 8, 16, …', ['24', '30', '32', '34'], 2),
  quiz('What comes next? 1, 1, 2, 3, 5, …', '¿Qué sigue? 1, 1, 2, 3, 5, …', ['7', '8', '9', '10'], 1),
  quiz('What comes next? 3, 6, 9, 12, …', '¿Qué sigue? 3, 6, 9, 12, …', ['14', '16', '18', '15'], 3),
  quiz('What comes next? 10, 9, 8, 7, …', '¿Qué sigue? 10, 9, 8, 7, …', ['6', '5', '8', '10'], 0),
  quiz('Quick! What is 5 + 7?', '¡Rápido! ¿Cuánto es 5 + 7?', ['10', '11', '12', '13'], 2),
  quiz('Quick! What is 9 − 4?', '¡Rápido! ¿Cuánto es 9 − 4?', ['4', '5', '6', '7'], 1),
  quiz('Quick! What is 3 × 4?', '¡Rápido! ¿Cuánto es 3 × 4?', ['7', '10', '14', '12'], 3),
  quiz('Quick! What is 20 ÷ 5?', '¡Rápido! ¿Cuánto es 20 ÷ 5?', ['4', '5', '10', '15'], 0),
  quiz('How many sides does a hexagon have?', '¿Cuántos lados tiene un hexágono?', ['5', '6', '7', '8'], 1),
  quiz('Which number is even?', '¿Qué número es par?', ['11', '15', '18', '21'], 2),
  quiz('Which number comes right before 50?', '¿Qué número va justo antes de 50?', ['47', '48', '51', '49'], 3),
  quiz('What comes next? 4, 8, 12, 16, …', '¿Qué sigue? 4, 8, 12, 16, …', ['20', '18', '22', '24'], 0),
  quiz('What is half of 18?', '¿Cuál es la mitad de 18?', ['8', '9', '10', '12'], 1),
  quiz('Quick! What is 7 + 8?', '¡Rápido! ¿Cuánto es 7 + 8?', ['13', '14', '16', '15'], 3),
  { kind: 'search', prompt: { en: 'Find the star!', es: '¡Encuentra la estrella!' }, target: '✦', fillers: ['✿', '◆', '●', '✚'] },
  { kind: 'search', prompt: { en: 'Find the crown!', es: '¡Encuentra la corona!' }, target: '👑', fillers: ['💎', '💜', '⭐', '✨'] },
  { kind: 'search', prompt: { en: 'Find the heart!', es: '¡Encuentra el corazón!' }, target: '❤️', fillers: ['🔴', '🟠', '🟡', '🟣'] },
  { kind: 'search', prompt: { en: 'Find the lightning bolt!', es: '¡Encuentra el rayo!' }, target: '⚡', fillers: ['☁️', '🌙', '💧', '🌫️'] },
  { kind: 'search', prompt: { en: 'Find the rocket!', es: '¡Encuentra el cohete!' }, target: '🚀', fillers: ['⭐', '🌟', '✨', '🪐'] },
  { kind: 'search', prompt: { en: 'Find the banana!', es: '¡Encuentra la banana!' }, target: '🍌', fillers: ['🌙', '🍋', '🌽', '🥐'] },
  { kind: 'search', prompt: { en: 'Find the pizza!', es: '¡Encuentra la pizza!' }, target: '🍕', fillers: ['🧁', '🍩', '🍪', '🍰'] },
  { kind: 'search', prompt: { en: 'Find the paw!', es: '¡Encuentra la huella!' }, target: '🐾', fillers: ['🌸', '🌼', '🌺', '🍀'] },
  { kind: 'search', prompt: { en: 'Find the diamond!', es: '¡Encuentra el diamante!' }, target: '💎', fillers: ['🔷', '🔹', '🟦', '🟪'] },
  { kind: 'search', prompt: { en: 'Find the music note!', es: '¡Encuentra la nota musical!' }, target: '🎵', fillers: ['🔤', '🔠', '🔡', '🔢'] },
];

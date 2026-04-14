const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Badge = require('./models/Badge');

const quizzes = [
  { question: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Transfer Text Protocol', 'HyperTool Text Protocol'], correctAnswer: 0, category: 'Technology', difficulty: 'easy', xpReward: 10, explanation: 'HTTP = HyperText Transfer Protocol, the foundation of web communication.' },
  { question: 'Which data structure uses LIFO order?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 1, category: 'Programming', difficulty: 'easy', xpReward: 10, explanation: 'Stack uses Last-In-First-Out (LIFO) order.' },
  { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctAnswer: 2, category: 'Programming', difficulty: 'medium', xpReward: 20, explanation: 'Binary search halves the search space each step → O(log n).' },
  { question: 'Who invented the World Wide Web?', options: ['Bill Gates', 'Tim Berners-Lee', 'Linus Torvalds', 'Steve Jobs'], correctAnswer: 1, category: 'Technology', difficulty: 'easy', xpReward: 10 },
  { question: 'What does CSS stand for?', options: ['Creative Style Sheets', 'Computer Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets'], correctAnswer: 2, category: 'Technology', difficulty: 'easy', xpReward: 10 },
  { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Saturn', 'Mars'], correctAnswer: 3, category: 'Science', difficulty: 'easy', xpReward: 10 },
  { question: 'What is 2^10?', options: ['512', '1024', '2048', '256'], correctAnswer: 1, category: 'Mathematics', difficulty: 'easy', xpReward: 10 },
  { question: 'Which language runs in a web browser?', options: ['Java', 'C++', 'JavaScript', 'Python'], correctAnswer: 2, category: 'Programming', difficulty: 'easy', xpReward: 10 },
  { question: 'What is the fastest sorting algorithm on average?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'QuickSort'], correctAnswer: 3, category: 'Programming', difficulty: 'hard', xpReward: 30, explanation: 'QuickSort is O(n log n) average case and very cache-friendly.' },
  { question: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correctAnswer: 2, category: 'Technology', difficulty: 'medium', xpReward: 20 },
  { question: 'What does RAM stand for?', options: ['Read Access Memory', 'Random Access Memory', 'Run Application Memory', 'Root Access Module'], correctAnswer: 1, category: 'Technology', difficulty: 'easy', xpReward: 10 },
  { question: 'In JavaScript, what does === check?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctAnswer: 2, category: 'Programming', difficulty: 'easy', xpReward: 10 },
];

const badges = [
  { name: 'First Chat', description: 'Sent your first message', icon: '🎯', rarity: 'common', condition: { type: 'messages', threshold: 1 }, xpReward: 25 },
  { name: 'Chatterbox', description: 'Sent 100 messages', icon: '💬', rarity: 'uncommon', condition: { type: 'messages', threshold: 100 }, xpReward: 75 },
  { name: 'Community Builder', description: 'Created your first post', icon: '🌟', rarity: 'common', condition: { type: 'posts', threshold: 1 }, xpReward: 30 },
  { name: 'Prolific Poster', description: 'Created 10 posts', icon: '📝', rarity: 'uncommon', condition: { type: 'posts', threshold: 10 }, xpReward: 100 },
  { name: 'Scholar', description: 'Reached Level 5', icon: '📚', rarity: 'rare', condition: { type: 'level', threshold: 5 }, xpReward: 150 },
  { name: 'Veteran', description: 'Reached Level 8', icon: '⚔️', rarity: 'epic', condition: { type: 'level', threshold: 8 }, xpReward: 300 },
  { name: 'Legend', description: 'Reached Level 10', icon: '👑', rarity: 'legendary', condition: { type: 'level', threshold: 10 }, xpReward: 1000 },
  { name: 'On Fire', description: '7-day login streak', icon: '🔥', rarity: 'uncommon', condition: { type: 'streak', threshold: 7 }, xpReward: 100 },
  { name: 'Dedicated', description: '30-day login streak', icon: '💪', rarity: 'epic', condition: { type: 'streak', threshold: 30 }, xpReward: 500 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected to MongoDB');

  // Make admin user
  const updated = await User.findOneAndUpdate(
    { email: 'admin@chatsphere.com' },
    { isAdmin: true },
    { new: true }
  );
  if (updated) console.log(`✅ ${updated.username} is now admin`);

  // Seed quizzes
  await Quiz.deleteMany({});
  await Quiz.insertMany(quizzes);
  console.log(`✅ Seeded ${quizzes.length} quiz questions`);

  // Seed badges
  await Badge.deleteMany({});
  await Badge.insertMany(badges);
  console.log(`✅ Seeded ${badges.length} badges`);

  await mongoose.disconnect();
  console.log('✅ Done!');
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });

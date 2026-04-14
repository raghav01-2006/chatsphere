import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, Trophy, Users, ArrowRight, Shield, Globe } from 'lucide-react';

const features = [
  { icon: MessageSquare, title: 'Real-time Chat', desc: 'Instant messaging with typing indicators, reactions, and read receipts.' },
  { icon: Users, title: 'Communities', desc: 'Create or join communities around any topic. Post, comment, and upvote.' },
  { icon: Zap, title: 'Gamification', desc: 'Earn XP, level up, unlock badges, and compete on leaderboards.' },
  { icon: Trophy, title: 'Daily Quiz', desc: 'Test your knowledge daily and earn bonus XP to climb the ranks.' },
  { icon: Shield, title: 'Safe & Moderated', desc: 'Block users, report content, and admin controls for safe spaces.' },
  { icon: Globe, title: 'Public & Private', desc: 'Create private rooms with invite codes or open communities.' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-y-auto scrollbar-none">
      {/* Noise texture overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      {/* Header */}
      <header className="border-b border-border-subtle px-6 py-4 flex items-center justify-between sticky top-0 bg-bg-primary/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
            <MessageSquare size={16} className="text-black" />
          </div>
          <span className="font-bold tracking-tight">Chat Sphere</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost text-sm">Sign in</button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm">Get started →</button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-text-muted mb-8 border">
            <Zap size={12} className="text-warning" />
            Gamified · Real-time · Community-driven
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="text-gradient">Chat. Compete.</span>
            <br />
            <span className="text-white">Level Up.</span>
          </h1>
          <p className="text-text-muted text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Chat Sphere is the platform where conversations become journeys.
            Chat in real-time, build communities, earn XP, and rise to the top.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              id="cta-register"
              onClick={() => navigate('/register')}
              className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
            >
              Start for free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary px-6 py-3 text-base"
            >
              Sign in
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 border-y border-border-subtle">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Users', value: '10K+' },
            { label: 'Messages / day', value: '500K+' },
            { label: 'Communities', value: '2K+' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-text-muted text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Everything you need</h2>
        <p className="text-text-muted text-center mb-12">One platform. Infinite possibilities.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated hover:border-border-strong transition-colors group"
            >
              <div className="w-9 h-9 bg-bg-tertiary rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
                <f.icon size={16} className="text-text-secondary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-text-muted text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center border-t border-border-subtle">
        <h2 className="text-3xl font-bold mb-4">Ready to level up?</h2>
        <p className="text-text-muted mb-8">Join thousands of users already chatting and competing.</p>
        <button onClick={() => navigate('/register')} className="btn-primary px-8 py-3 text-base">
          Create your account →
        </button>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-border-subtle text-center text-text-muted text-xs">
        © 2024 Chat Sphere · Built with ❤️ using React, Node.js & MongoDB
      </footer>
    </div>
  );
};

export default LandingPage;

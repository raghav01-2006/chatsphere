import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-black" />
          </div>
          <span className="text-xl font-bold">Chat Sphere</span>
        </div>

        <div className="card-elevated">
          <h2 className="text-xl font-bold mb-1">Create account</h2>
          <p className="text-text-muted text-sm mb-6">Join the community today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Username</label>
              <input
                id="reg-username"
                type="text"
                placeholder="cooluser123"
                className="input"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
                minLength={3}
                maxLength={30}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                className="input"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  className="input pr-10"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-text-disabled mt-4">
          By creating an account you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getAvatarFallback, generateColor } from '../utils/helpers';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    status: user?.status || '',
    avatar: user?.avatar || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', profile);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-none p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border-subtle">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-white border-white'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Avatar preview */}
            <div className="flex items-center gap-4 p-4 bg-bg-elevated rounded-2xl border border-border-subtle">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-xl font-bold"
                style={{ background: profile.avatar ? 'transparent' : generateColor(profile.username) }}>
                {profile.avatar
                  ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  : getAvatarFallback(profile.username)
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Avatar URL</p>
                <input
                  className="input text-xs"
                  placeholder="https://example.com/avatar.png"
                  value={profile.avatar}
                  onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Username</label>
              <input className="input" value={profile.username}
                onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                minLength={3} maxLength={30} required />
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Bio</label>
              <textarea className="input resize-none" rows={3} placeholder="Tell others about yourself..."
                value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} maxLength={200} />
              <p className="text-right text-[11px] text-text-disabled mt-1">{profile.bio.length}/200</p>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Status</label>
              <input className="input" placeholder="🟢 Active" value={profile.status}
                onChange={e => setProfile(p => ({ ...p, status: e.target.value }))} maxLength={60} />
            </div>

            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="card bg-bg-elevated">
              <h3 className="font-semibold text-sm mb-4">Change Password</h3>
              {[
                { key: 'currentPassword', label: 'Current Password' },
                { key: 'newPassword', label: 'New Password' },
                { key: 'confirmPassword', label: 'Confirm New Password' },
              ].map(field => (
                <div key={field.key} className="mb-4">
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">{field.label}</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="••••••••"
                      value={passwords[field.key]}
                      onChange={e => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                      required
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <Lock size={14} /> {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;

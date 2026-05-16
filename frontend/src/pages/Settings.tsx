import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Save } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Settings() {
  const { user, changePassword } = useAuth();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/daemon/settings');
        setSettings(data);
      } catch {
        // Settings may not be available if daemon is stopped
      }
    };
    fetchSettings();
  }, []);

  const handlePasswordChange = async () => {
    setPassMsg('');
    setPassError('');
    if (newPass !== confirmPass) {
      setPassError('Passwords do not match');
      return;
    }
    if (newPass.length < 8) {
      setPassError('Password must be at least 8 characters');
      return;
    }
    try {
      await changePassword(oldPass, newPass);
      setPassMsg('Password changed successfully');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassError(err.response?.data?.detail || 'Failed to change password');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.post('/daemon/settings', settings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Settings" />
      <div className="p-6 space-y-6 max-w-2xl">
        {user?.must_change_password && (
          <div className="bg-warning/10 border border-warning/30 text-yellow-300 px-4 py-3 rounded-lg text-sm">
            You must change your default password before continuing.
          </div>
        )}

        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-accent-green" /> Change Password
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="input-field w-full"
              placeholder="Current password"
            />
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="input-field w-full"
              placeholder="New password"
            />
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="input-field w-full"
              placeholder="Confirm new password"
            />
            {passError && <p className="text-danger text-sm">{passError}</p>}
            {passMsg && <p className="text-accent-green text-sm">{passMsg}</p>}
            <button onClick={handlePasswordChange} className="btn-primary">Change Password</button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <SettingsIcon className="w-4 h-4 text-accent-purple" /> Daemon Settings
          </h3>
          <div className="space-y-3">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs text-text-muted mb-1 font-mono">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            ))}
            {Object.keys(settings).length === 0 && (
              <p className="text-text-muted text-sm">Start the daemon to view settings.</p>
            )}
            {Object.keys(settings).length > 0 && (
              <button onClick={handleSaveSettings} disabled={saving} className="btn-secondary flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

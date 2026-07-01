import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";
import GeneralSettings from './settings/GeneralSettings';
import ProfileSettings from './settings/ProfileSettings';
import SecuritySettings from './settings/SecuritySettings';

const SettingsPage = () => {
  const { t } = useTranslation('settings');
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'general';

  // Connection diagnostics
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isSyncing, setIsSyncing] = useState(false);

  // Profile details
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  useEffect(() => {
    checkHealth();
    fetchProfile();
  }, []);

  const checkHealth = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        setBackendStatus('Operational (Online)');
      } else {
        setBackendStatus('Degraded (HTTP Error)');
      }
    } catch {
      setBackendStatus('Offline (Connection Refused)');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || '');
        setEmail(data.email || '');
      }
    } catch (err) {
      console.error('Failed to prefill settings profile:', err);
    }
  };



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profile save error');
      
      // Sync localStorage so sidebar/topbar reflect updates immediately
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      
      setProfileMsg(t('profileUpdateSuccess'));
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err) {
      setProfileErr(err.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');

    if (newPassword !== confirmPassword) {
      setPwErr(t('passwordMatchError'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password update error');

      setPwMsg(t('passwordUpdateSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 4000);
    } catch (err) {
      setPwErr(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2">
            <Settings className="text-[#7C3AED]" />
            <span>
              {currentTab === 'general' ? t('generalSettingsTitle') :
               currentTab === 'profile' ? t('securityProfileTitle') :
               currentTab === 'security' ? t('credentialSecurityTitle') : t('systemConfigTitle')}
            </span>
          </h1>
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold mt-1">
            {currentTab === 'general' ? t('generalSettingsDesc') :
             currentTab === 'profile' ? t('securityProfileDesc') :
             currentTab === 'security' ? t('credentialSecurityDesc') :
             t('systemConfigDesc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {currentTab === 'general' && (
          <GeneralSettings 
            checkHealth={checkHealth} 
            isSyncing={isSyncing} 
            backendStatus={backendStatus} 
          />
        )}

        {currentTab === 'profile' && (
          <ProfileSettings 
            username={username} 
            setUsername={setUsername} 
            email={email} 
            setEmail={setEmail} 
            profileMsg={profileMsg} 
            profileErr={profileErr} 
            handleUpdateProfile={handleUpdateProfile} 
          />
        )}

        {currentTab === 'security' && (
          <SecuritySettings 
            currentPassword={currentPassword} 
            setCurrentPassword={setCurrentPassword} 
            newPassword={newPassword} 
            setNewPassword={setNewPassword} 
            confirmPassword={confirmPassword} 
            setConfirmPassword={setConfirmPassword} 
            pwMsg={pwMsg} 
            pwErr={pwErr} 
            handleUpdatePassword={handleUpdatePassword} 
          />
        )}



      </div>
    </div>
  );
};

export default SettingsPage;

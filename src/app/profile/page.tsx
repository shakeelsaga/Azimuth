'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AzimuthLogo, AzimuthWordmark } from '@/components/brand/AzimuthLogo';
import {
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
  Plus,
  Trash2,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

function ProfileContent() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isPwdPending, startPwdTransition] = useTransition();

  // Emergency contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [isContactPending, startContactTransition] = useTransition();

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    }
  }, [status, router]);

  // Fetch emergency contacts
  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/emergency-contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch {
      // Best-effort
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchContacts();
    }
  }, [session]);

  // Handle password update
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    startPwdTransition(async () => {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPwdError(data.message || 'Could not update password.');
        } else {
          setPwdSuccess('Your password has been updated securely.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      } catch {
        setPwdError('Network error while updating password.');
      }
    });
  };

  // Handle add emergency contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess('');

    if (!newContactName.trim()) {
      setContactError('Please provide a contact name.');
      return;
    }
    if (!newContactEmail.trim() && !newContactPhone.trim()) {
      setContactError('Please provide at least an email address or an E.164 phone number (e.g. +919876543210).');
      return;
    }

    startContactTransition(async () => {
      try {
        const res = await fetch('/api/emergency-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newContactName.trim(),
            email: newContactEmail.trim() || undefined,
            phone: newContactPhone.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setContactError(data.message || 'Could not add emergency contact. Phone must be in E.164 format (+...).');
        } else {
          setContactSuccess(`Added ${data.name} to your trusted SOS contacts.`);
          setNewContactName('');
          setNewContactEmail('');
          setNewContactPhone('');
          fetchContacts();
        }
      } catch {
        setContactError('Network error. Try again.');
      }
    });
  };

  // Handle delete emergency contact
  const handleDeleteContact = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/emergency-contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContactSuccess(`Removed ${name} from your contacts.`);
        setContacts((prev) => prev.filter((c) => c.id !== id));
      } else {
        setContactError('Could not delete contact.');
      }
    } catch {
      setContactError('Failed to remove contact.');
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper)' }}>
        <p style={{ color: 'var(--color-steel)', fontSize: '14px' }}>Loading profile...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const isGoogleUser = Boolean(user.image?.includes('googleusercontent.com'));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', paddingBottom: '80px' }}>
      {/* Top Header */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--color-faint-ash)',
          background: 'var(--color-paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 48px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Planner</span>
          </Link>
          <div style={{ height: '16px', width: '1px', background: 'var(--color-faint-ash)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AzimuthLogo size={22} />
            <AzimuthWordmark size="13px" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#b91c1c',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main
        style={{
          maxWidth: '780px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        {/* Page Title */}
        <div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--color-ink)',
              margin: '0 0 6px 0',
            }}
          >
            Profile & Travel Security
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-charcoal)', margin: 0, lineHeight: 1.5 }}>
            View your account credentials, update security keys, and manage designated emergency contacts for one-tap SOS dispatch.
          </p>
        </div>

        {/* Section 1: User Login Credentials (No Passwords Shown) */}
        <div
          style={{
            background: 'var(--color-paper)',
            border: '1px solid #e0e0e0',
            borderRadius: 'var(--radius-cards)',
            padding: 'clamp(20px, 3vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={18} style={{ color: 'var(--color-ink)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
              Account Credentials
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              padding: '16px',
              background: 'var(--color-faint-ash)',
              borderRadius: 'var(--radius-small)',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-steel)', fontWeight: 600 }}>
                Full Name
              </span>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', marginTop: '2px' }}>
                {user.name || 'Traveler'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-steel)', fontWeight: 600 }}>
                Email Address
              </span>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', marginTop: '2px', wordBreak: 'break-all' }}>
                {user.email}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-steel)', fontWeight: 600 }}>
                Account Authentication
              </span>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-charcoal)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} style={{ color: '#16a34a' }} />
                <span>{isGoogleUser ? 'Google OAuth Account' : 'Email & Password Account'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-steel)', fontWeight: 600 }}>
                Status
              </span>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#16a34a', marginTop: '2px' }}>
                Verified & Active
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Password Reset / Security */}
        <div
          style={{
            background: 'var(--color-paper)',
            border: '1px solid #e0e0e0',
            borderRadius: 'var(--radius-cards)',
            padding: 'clamp(20px, 3vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound size={18} style={{ color: 'var(--color-ink)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
              Password & Security
            </h2>
          </div>

          {isGoogleUser ? (
            <p style={{ fontSize: '14px', color: 'var(--color-charcoal)', margin: 0, lineHeight: 1.5 }}>
              Your account is authenticated via Google. Password changes and multi-factor authentication are safely managed through your Google Account.
            </p>
          ) : (
            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '440px' }}>
              {pwdError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-small)', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', display: 'flex', gap: '8px' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{pwdError}</span>
                </div>
              )}
              {pwdSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-small)', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-small)', border: '1px solid #d4d4d4', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  New Password (at least 8 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-small)', border: '1px solid #d4d4d4', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-small)', border: '1px solid #d4d4d4', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isPwdPending}
                style={{
                  alignSelf: 'flex-start',
                  padding: '11px 20px',
                  borderRadius: 'var(--radius-buttons)',
                  background: 'var(--color-ink)',
                  color: 'var(--color-paper)',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isPwdPending ? 'not-allowed' : 'pointer',
                  opacity: isPwdPending ? 0.7 : 1,
                  marginTop: '4px',
                }}
              >
                {isPwdPending ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* Section 3: Emergency Contacts (SOS Integration) */}
        <div
          style={{
            background: 'var(--color-paper)',
            border: '1px solid #e0e0e0',
            borderRadius: 'var(--radius-cards)',
            padding: 'clamp(20px, 3vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={18} style={{ color: '#b91c1c' }} />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                  Emergency SOS Contacts
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-steel)', margin: '2px 0 0 0' }}>
                  Designated contacts receive live coordinates and emergency alerts when you trigger SOS in any itinerary.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback banners */}
          {contactError && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-small)', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{contactError}</span>
            </div>
          )}
          {contactSuccess && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-small)', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', display: 'flex', gap: '8px' }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{contactSuccess}</span>
            </div>
          )}

          {/* Existing Contacts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {contacts.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  background: 'var(--color-faint-ash)',
                  borderRadius: 'var(--radius-small)',
                  textAlign: 'center',
                  color: 'var(--color-steel)',
                  fontSize: '14px',
                }}
              >
                No emergency contacts configured yet. Add your trusted contacts below to enable instant SOS protection.
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-small)',
                    background: 'var(--color-faint-ash)',
                    border: '1px solid #e2e2e2',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
                      {contact.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-steel)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                      {contact.email && <span>{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteContact(contact.id, contact.name)}
                    aria-label={`Remove ${contact.name}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b91c1c',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Contact Form */}
          <form
            onSubmit={handleAddContact}
            style={{
              marginTop: '12px',
              padding: '20px',
              border: '1px dashed #cccccc',
              borderRadius: 'var(--radius-small)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
              Add a Trusted Contact
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-steel)', marginBottom: '4px' }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe (Brother)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-small)', border: '1px solid #d4d4d4', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-steel)', marginBottom: '4px' }}>
                  Phone (E.164 with country code)
                </label>
                <input
                  type="tel"
                  placeholder="+919876543210 or +14155552671"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-small)', border: '1px solid #d4d4d4', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-steel)', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="contact@family.com"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-small)', border: '1px solid #d4d4d4', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isContactPending}
              style={{
                alignSelf: 'flex-start',
                padding: '9px 18px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: isContactPending ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              <Plus size={14} />
              <span>{isContactPending ? 'Saving...' : 'Add Emergency Contact'}</span>
            </button>
          </form>
        </div>

        {/* Section 4: Log Out */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-buttons)',
              border: '1px solid #d4d4d4',
              background: 'var(--color-paper)',
              color: '#b91c1c',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background var(--transition-fast), border-color var(--transition-fast)',
            }}
            className="profile-logout-btn"
          >
            <LogOut size={16} />
            <span>Log Out of Azimuth</span>
          </button>
        </div>
      </main>

      <style>{`
        .profile-logout-btn:hover {
          background: #fef2f2 !important;
          border-color: #fca5a5 !important;
        }
      `}</style>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-paper)' }} />}>
      <ProfileContent />
    </Suspense>
  );
}

'use client';

import { useState, useTransition, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'motion/react';
import { AzimuthLogo, AzimuthWordmark } from '@/components/brand/AzimuthLogo';
import { ArrowLeft, Sparkles, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [signupStep, setSignupStep] = useState<'details' | 'verify'>('details');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setSignupStep('details');
    setForgotStep('request');
    setCode('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setErrorMsg('Could not connect to Google. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    startTransition(async () => {
      try {
        const endpoint = mode === 'signup' ? '/api/auth/register/send-code' : '/api/auth/password-reset/request';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || undefined }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg(`A fresh 6-digit code has been dispatched to ${email.trim()}.`);
        } else {
          setErrorMsg(data.message || 'Could not resend code. Please wait a moment.');
        }
      } catch {
        setErrorMsg('Network error. Could not resend code.');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // --- FORGOT PASSWORD FLOW ---
    if (mode === 'forgot') {
      if (forgotStep === 'request') {
        if (!email.trim() || !email.includes('@')) {
          setErrorMsg('Please enter a valid registered email address.');
          return;
        }

        startTransition(async () => {
          try {
            const res = await fetch('/api/auth/password-reset/request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (!res.ok) {
              setErrorMsg(data.message || 'Could not send reset code. Please check your email.');
            } else {
              setForgotStep('verify');
              if (data.devCode) {
                setCode(data.devCode);
                setSuccessMsg(`Sandbox code generated: ${data.devCode} (custom domain pending). Enter new password below.`);
              } else {
                setSuccessMsg(`Account verified! We sent a 6-digit reset code to ${email.trim()}.`);
              }
            }
          } catch {
            setErrorMsg('Network error. Please try again later.');
          }
        });
        return;
      }

      // forgotStep === 'verify'
      if (!code.trim() || code.trim().length !== 6) {
        setErrorMsg('Please enter the 6-digit reset code.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('New password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      startTransition(async () => {
        try {
          const res = await fetch('/api/auth/password-reset/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              code: code.trim(),
              password,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setErrorMsg(data.message || 'Could not reset password. Code may be invalid or expired.');
          } else {
            // Automatically sign in with the newly updated password
            const result = await signIn('credentials', {
              email: email.trim().toLowerCase(),
              password,
              redirect: false,
              callbackUrl,
            });

            if (result?.error) {
              switchMode('signin');
              setSuccessMsg('Password updated successfully! Please sign in with your new password.');
            } else {
              router.push(callbackUrl);
              router.refresh();
            }
          }
        } catch {
          setErrorMsg('An unexpected error occurred. Please try again.');
        }
      });
      return;
    }

    // --- SIGN UP FLOW (DIRECT ONBOARDING WITHOUT CODE VERIFICATION) ---
    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please provide your name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters.');
        return;
      }

      startTransition(async () => {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setErrorMsg(data.message || 'Registration failed. Please check your details.');
            return;
          }

          // Automatically sign in the newly registered user
          const result = await signIn('credentials', {
            email: email.trim().toLowerCase(),
            password,
            redirect: false,
            callbackUrl,
          });

          if (result?.error) {
            switchMode('signin');
            setSuccessMsg('Account created successfully! Please sign in with your credentials.');
          } else {
            router.push(callbackUrl);
            router.refresh();
          }
        } catch {
          setErrorMsg('An unexpected error occurred. Please try again.');
        }
      });
      return;
    }

    // --- SIGN IN FLOW ---
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setErrorMsg('Invalid email or password. Please verify your details.');
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } catch {
        setErrorMsg('Sign in failed. Please check your connection and try again.');
      }
    });
  };

  const isVerificationStep = (mode === 'signup' && signupStep === 'verify') || (mode === 'forgot' && forgotStep === 'verify');

  return (
    <div className="login-split-layout">
      {/* Left Column: Hero Split Screen Image */}
      <div
        className="login-hero-pane"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(28px, 4vw, 48px)',
          color: 'var(--color-paper)',
        }}
      >
        <Image
          src="/assets/Login_Herio_Image.png"
          alt="Peaceful Japanese architecture"
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
        {/* Scrim overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.85) 100%)',
            zIndex: 1,
          }}
        />

        {/* Top brand badge */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AzimuthLogo size={32} />
          <AzimuthWordmark size="15px" style={{ color: 'var(--color-paper)' }} />
        </div>

        {/* Bottom editorial tagline */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '440px' }}>

          <h2
            style={{
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            Every journey begins with a calm intention.
          </h2>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.55,
              color: 'rgba(255, 255, 255, 0.85)',
              margin: 0,
            }}
          >
            Handcrafted itineraries tailored to your pace, saved securely and synced across all your devices.
          </p>
        </div>
      </div>

      {/* Right Column: Auth Form with Independent Scroll */}
      <div className="login-form-pane">
        <div className="login-form-inner">
          {/* Top return link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--text-caption)',
                fontWeight: 500,
                color: 'var(--color-steel)',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)',
              }}
              className="back-home-link"
            >
              <ArrowLeft size={14} />
              <span>Return to <AzimuthWordmark size="13px" /></span>
            </Link>
          </div>

          <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Header Title */}
          <div style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: 'clamp(26px, 3vw, 34px)',
                fontWeight: 700,
                color: 'var(--color-ink)',
                letterSpacing: '-0.02em',
                margin: '0 0 8px 0',
              }}
            >
              {mode === 'signup'
                ? signupStep === 'verify'
                  ? 'Verify your email'
                  : 'Create an account'
                : mode === 'forgot'
                ? forgotStep === 'verify'
                  ? 'Choose new password'
                  : 'Reset your password'
                : 'Welcome back'}
            </h1>
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-charcoal)',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              {mode === 'signup'
                ? signupStep === 'verify'
                  ? `Enter the 6-digit code sent to ${email} to verify your account.`
                  : 'Save itineraries, sync across devices, and configure emergency SOS.'
                : mode === 'forgot'
                ? forgotStep === 'verify'
                  ? `Enter the 6-digit code sent to ${email} along with your new password.`
                  : 'Enter your registered email and we will send a 6-digit reset code.'
                : 'Sign in to access your saved trips and personalized travel settings.'}
            </p>
          </div>

          {/* Mode Switcher Pills (Sign In / Sign Up) - only on initial steps */}
          {mode !== 'forgot' && !isVerificationStep && (
            <div
              style={{
                display: 'flex',
                background: 'var(--color-faint-ash)',
                padding: '4px',
                borderRadius: 'var(--radius-buttons)',
                marginBottom: '24px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-buttons)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: mode === 'signin' ? 'var(--color-ink)' : 'transparent',
                  color: mode === 'signin' ? 'var(--color-paper)' : 'var(--color-charcoal)',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-buttons)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: mode === 'signup' ? 'var(--color-ink)' : 'transparent',
                  color: mode === 'signup' ? 'var(--color-paper)' : 'var(--color-charcoal)',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Google OAuth Button - only on initial steps */}
          {mode !== 'forgot' && !isVerificationStep && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 'var(--radius-buttons)',
                border: '1px solid #dcdcdc',
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)',
                marginBottom: '20px',
              }}
              className="google-btn"
            >
              <Image
                src="/assets/Google_Favicon.svg"
                alt="Google Logo"
                width={20}
                height={20}
                style={{ flexShrink: 0 }}
              />
              <span>Continue with Google</span>
            </button>
          )}

          {/* Divider */}
          {mode !== 'forgot' && !isVerificationStep && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                margin: '20px 0',
                color: 'var(--color-steel)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--color-faint-ash)' }} />
              <span>or with email</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-faint-ash)' }} />
            </div>
          )}

          {/* Alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-small)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '13px',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-small)',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '13px',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Advisory for Sign Up & Domain Verification */}
          {mode === 'signup' && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-small)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '13px', fontWeight: 700 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>Security Advisory: Sign in with Google Recommended</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-charcoal)', lineHeight: 1.5 }}>
                <strong>Notice:</strong> Email confirmation is temporarily bypassed because sending transactional verification emails requires a verified custom domain with SPF/DKIM DNS records (currently in setup). Direct email registration creates an unverified account.
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
                For verified account protection and instant access, we strongly recommend using <strong>Continue with Google</strong> above. Once our custom domain is connected, strict cryptographic 6-digit email confirmation will be re-enabled.
              </p>
            </div>
          )}

          {/* Domain Notice for Forgot Password */}
          {mode === 'forgot' && forgotStep === 'request' && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-small)',
                background: 'var(--color-faint-ash)',
                border: '1px solid #e5e5e5',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Domain Verification Notice
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-steel)', lineHeight: 1.45 }}>
                Transactional email dispatch requires a verified custom domain. If you signed in with Google, please use Google sign-in. For development testing, a sandbox reset code will be provided.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sign up details: Name input */}
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="signup-name"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-charcoal)',
                    marginBottom: '6px',
                  }}
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-small)',
                    border: '1px solid #d4d4d4',
                    background: 'var(--color-paper)',
                    fontSize: '14px',
                    color: 'var(--color-ink)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  className="auth-input"
                />
              </div>
            )}

            {/* Email input (used in signin, signup details, and forgot request) */}
            {!isVerificationStep && (
              <div>
                <label
                  htmlFor="auth-email"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-charcoal)',
                    marginBottom: '6px',
                  }}
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-small)',
                    border: '1px solid #d4d4d4',
                    background: 'var(--color-paper)',
                    fontSize: '14px',
                    color: 'var(--color-ink)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  className="auth-input"
                />
              </div>
            )}

            {/* Password input for signin or signup */}
            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    htmlFor="auth-password"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '12px',
                        color: 'var(--color-steel)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-small)',
                    border: '1px solid #d4d4d4',
                    background: 'var(--color-paper)',
                    fontSize: '14px',
                    color: 'var(--color-ink)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  className="auth-input"
                />
              </div>
            )}

            {/* Verification Code input for Step 2 (both signup and forgot) */}
            {isVerificationStep && (
              <div>
                <label
                  htmlFor="auth-code"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-ink)',
                    marginBottom: '8px',
                    textAlign: 'center',
                  }}
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-small)',
                    border: '1.5px solid var(--color-ink)',
                    background: 'var(--color-paper)',
                    fontSize: '26px',
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace',
                    letterSpacing: '10px',
                    textAlign: 'center',
                    color: 'var(--color-ink)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  className="auth-input"
                />
              </div>
            )}

            {/* Additional Password fields for forgotStep === 'verify' */}
            {mode === 'forgot' && forgotStep === 'verify' && (
              <>
                <div>
                  <label
                    htmlFor="reset-password"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--color-charcoal)',
                      marginBottom: '6px',
                    }}
                  >
                    New Password (8+ characters)
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-small)',
                      border: '1px solid #d4d4d4',
                      background: 'var(--color-paper)',
                      fontSize: '14px',
                      color: 'var(--color-ink)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    className="auth-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--color-charcoal)',
                      marginBottom: '6px',
                    }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-small)',
                      border: '1px solid #d4d4d4',
                      background: 'var(--color-paper)',
                      fontSize: '14px',
                      color: 'var(--color-ink)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    className="auth-input"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '14px 20px',
                borderRadius: 'var(--radius-buttons)',
                border: 'none',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background var(--transition-fast), transform var(--transition-fast)',
              }}
              className="submit-auth-btn"
            >
              {isPending ? (
                <span>Processing...</span>
              ) : mode === 'signup' ? (
                <span>Create Account →</span>
              ) : mode === 'forgot' ? (
                forgotStep === 'request' ? (
                  <span>Send 6-Digit Reset Code →</span>
                ) : (
                  <span>Update Password & Sign In →</span>
                )
              ) : (
                <span>Sign In →</span>
              )}
            </button>
          </form>

          {/* Action Links for Code Steps */}
          {isVerificationStep && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'signup') setSignupStep('details');
                  if (mode === 'forgot') setForgotStep('request');
                  setErrorMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  color: 'var(--color-steel)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Back / change details
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isPending}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  color: 'var(--color-ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCw size={12} />
                <span>Resend Code</span>
              </button>
            </div>
          )}

          {/* Mode Switcher Backlink for Forgot Password */}
          {mode === 'forgot' && !isVerificationStep && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: 'var(--color-steel)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      <style>{`
        .login-split-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          background: var(--color-paper);
        }
        .login-hero-pane {
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          position: relative;
        }
        .login-form-pane {
          height: 100vh;
          max-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--color-paper);
          padding: clamp(24px, 4vw, 56px);
        }
        .login-form-inner {
          width: 100%;
          max-width: 420px;
          margin: auto 0;
          padding: 24px 0;
        }

        @media (max-width: 899px) {
          .login-split-layout {
            grid-template-columns: 1fr !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .login-hero-pane {
            min-height: 280px !important;
            height: 35vh !important;
            max-height: 380px !important;
          }
          .login-form-pane {
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
          .login-form-inner {
            margin: 0 !important;
          }
        }

        .back-home-link:hover {
          color: var(--color-ink) !important;
        }
        .google-btn:hover {
          border-color: var(--color-ink) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }
        .auth-input:focus {
          border-color: var(--color-ink) !important;
          box-shadow: 0 0 0 2px rgba(10, 10, 10, 0.08);
        }
        .submit-auth-btn:not(:disabled):hover {
          transform: translateY(-1px);
          background: #1e1e1e !important;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-paper)' }} />}>
      <LoginContent />
    </Suspense>
  );
}

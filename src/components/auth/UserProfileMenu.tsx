'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User, Bookmark, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileMenuProps {
  onOpenSavedTrips?: () => void;
  className?: string;
}

export function UserProfileMenu({ onOpenSavedTrips, className = '' }: UserProfileMenuProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Compute initials (e.g. "Maya Lin" -> "ML")
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AZ';
  };

  if (status === 'loading') {
    return (
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--color-faint-ash)',
        }}
      />
    );
  }

  // Not logged in: Show Log In / Sign Up button
  if (!session?.user) {
    return (
      <Link
        href="/login"
        className={`auth-nav-btn ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          borderRadius: 'var(--radius-buttons)',
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          fontSize: '13px',
          fontWeight: 700,
          textDecoration: 'none',
          letterSpacing: '0.02em',
          transition: 'background var(--transition-fast), transform var(--transition-fast)',
          whiteSpace: 'nowrap',
        }}
      >
        <User size={14} />
        <span>Log In</span>
      </Link>
    );
  }

  // Logged in: Show avatar with dropdown
  const initials = getInitials(session.user.name, session.user.email);

  return (
    <div ref={menuRef} style={{ position: 'relative' }} className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="User profile options"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1.5px solid var(--color-ink)',
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          overflow: 'hidden',
          transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        }}
        className="profile-avatar-btn"
      >
        {session.user.image && !imageError ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User avatar'}
            width={38}
            height={38}
            style={{ objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
            {initials}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              background: 'var(--color-paper)',
              borderRadius: 'var(--radius-cards)',
              boxShadow: 'var(--shadow-overlay)',
              border: '1px solid #e2e2e2',
              padding: '8px',
              zIndex: 'var(--z-modal)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {/* User Meta header */}
            <div style={{ padding: '10px 12px 12px 12px', borderBottom: '1px solid var(--color-faint-ash)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
                {session.user.name || 'Traveler'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-steel)', marginTop: '2px', wordBreak: 'break-all' }}>
                {session.user.email}
              </div>
            </div>

            {/* Menu options */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-small)',
                fontSize: '13px',
                color: 'var(--color-ink)',
                textDecoration: 'none',
                transition: 'background var(--transition-fast)',
              }}
              className="dropdown-item"
            >
              <Settings size={15} style={{ color: 'var(--color-steel)' }} />
              <span>My Profile & SOS</span>
            </Link>

            {onOpenSavedTrips && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSavedTrips();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-small)',
                  fontSize: '13px',
                  color: 'var(--color-ink)',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background var(--transition-fast)',
                }}
                className="dropdown-item"
              >
                <Bookmark size={15} style={{ color: 'var(--color-steel)' }} />
                <span>Saved Trips</span>
              </button>
            )}

            <div style={{ height: '1px', background: 'var(--color-faint-ash)', margin: '4px 0' }} />

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-small)',
                fontSize: '13px',
                color: '#b91c1c',
                background: 'none',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background var(--transition-fast)',
              }}
              className="dropdown-item-danger"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .auth-nav-btn:hover {
          background: #222222 !important;
          transform: translateY(-1px);
        }
        .profile-avatar-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .dropdown-item:hover {
          background: var(--color-faint-ash) !important;
        }
        .dropdown-item-danger:hover {
          background: #fef2f2 !important;
        }
      `}</style>
    </div>
  );
}

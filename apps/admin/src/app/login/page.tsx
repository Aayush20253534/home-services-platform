'use client';

import { useState, type FormEvent } from 'react';
import { ShieldCheck, ArrowRight, LoaderCircle, Phone } from 'lucide-react';

export default function AdminLogin() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/auth/${challengeId ? 'verify-otp' : 'request-otp'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeId ? { phone, challengeId, code } : { phone }),
      });
      const data = await response.json() as { challengeId?: string; message?: string };
      if (!response.ok) throw new Error(data.message || 'Authentication failed');
      if (challengeId) window.location.assign('/');
      else if (data.challengeId) setChallengeId(data.challengeId);
      else throw new Error('Verification request incomplete');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-shell">
    <section className="login-panel">
      <div className="login-mark"><ShieldCheck size={28}/></div>
      <p className="eyebrow">HOME SERVICES · OPERATIONS</p>
      <h1>Secure admin sign in</h1>
      <p className="page-description">Enter your provisioned admin phone number. Access requires a one-time verification code.</p>
      <form onSubmit={(event) => { void submit(event); }} className="login-form">
        <label htmlFor="admin-phone">Admin phone number</label>
        <div className="login-input-wrap"><Phone size={18}/><input id="admin-phone" type="tel" required value={phone} onChange={(event) => { setPhone(event.target.value.trim()); setChallengeId(null); }} placeholder="+919876543210" autoComplete="tel" disabled={busy}/></div>
        {challengeId && <>
          <label htmlFor="admin-code">6-digit verification code</label>
          <input id="admin-code" className="login-code" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))} autoComplete="one-time-code" disabled={busy}/>
        </>}
        {message && <p role="alert" className="login-error">{message}</p>}
        <button className="primary-button login-submit" type="submit" disabled={busy}>
          {busy ? <LoaderCircle size={18} /> : <ArrowRight size={18} />}
          {challengeId ? 'Verify and sign in' : 'Send verification code'}
        </button>
      </form>
      {challengeId && <button type="button" className="text-link" onClick={() => {setChallengeId(null);setCode('');setMessage('');}}>Use a different number</button>}
      <p className="login-foot">Administrator access is invitation-only. Phone verification cannot create an admin account.</p>
    </section>
  </main>;
}

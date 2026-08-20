import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const WORKFLOW_STEPS = [
  { label: 'AI Chatbot', detail: 'Collects applicant information' },
  { label: 'Documents', detail: 'Uploaded through chat' },
  { label: 'Payment', detail: 'Verified by backend' },
  { label: 'Admin Review', detail: 'You are here' },
  { label: 'Government Form', detail: 'Manually filed by your team' },
];

function WorkflowRail() {
  return (
    <ol className="relative ml-1 space-y-8 border-l border-white/15 pl-8">
      {WORKFLOW_STEPS.map((step, index) => {
        const isCurrent = step.detail === 'You are here';
        return (
          <li key={step.label} className="relative">
            <span
              className={`absolute -left-[2.32rem] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-ink-900 ${
                isCurrent ? 'bg-accent' : 'bg-white/30'
              }`}
            />
            <p className={`font-display text-sm font-semibold ${isCurrent ? 'text-accent' : 'text-white'}`}>
              {String(index + 1).padStart(2, '0')} &middot; {step.label}
            </p>
            <p className="mt-0.5 text-sm text-white/60">{step.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}

export default function Login() {
  const { login, status } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (status === 'authenticated') {
    const redirectTo = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setFormError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Identity / context panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />

        <div>
          <p className="font-display text-lg font-semibold tracking-tight">Scheme Admin</p>
          <p className="mt-1 text-sm text-white/50">Application management console</p>
        </div>

        <div className="relative">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white">
            Every application,
            <br />
            one place to work it.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            From the moment an applicant pays through to the day their government form is
            filed, this is where your team reviews, communicates, and closes the loop.
          </p>
          <div className="mt-10">
            <WorkflowRail />
          </div>
        </div>

        <p className="relative text-xs text-white/35">Internal tool &middot; Admin and Super Admin access only</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-lg font-semibold text-slate-950">Scheme Admin</p>
            <p className="text-sm text-slate-500">Application management console</p>
          </div>

          <h2 className="font-display text-2xl font-semibold text-slate-950">Log in</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your admin credentials to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-950">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-950">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {formError && (
              <div className="rounded-lg border border-rose/30 bg-rose-light px-3.5 py-2.5 text-sm text-rose">
                {formError}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

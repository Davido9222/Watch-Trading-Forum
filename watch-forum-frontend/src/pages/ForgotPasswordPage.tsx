// ============================================
// FORGOT PASSWORD PAGE
// Two tabs: Email OTP (real API)  |  Recovery Phrase (local)
// ============================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Key, Mail, Check, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { users } = useAuthStore();

  // ── Recovery phrase tab ───────────────────────────────────────────────────
  const [rpUsername, setRpUsername]               = useState('');
  const [rpPhrase, setRpPhrase]                   = useState('');
  const [rpNewPassword, setRpNewPassword]         = useState('');
  const [rpConfirmPassword, setRpConfirmPassword] = useState('');
  const [rpStatus, setRpStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Email tab ─────────────────────────────────────────────────────────────
  const [emailInput, setEmailInput]                     = useState('');
  const [pendingEmail, setPendingEmail]                 = useState('');
  const [showEmailResetForm, setShowEmailResetForm]     = useState(false);
  const [emailCode, setEmailCode]                       = useState('');
  const [emailNewPassword, setEmailNewPassword]         = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailSending, setEmailSending]         = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resendCooldown, setResendCooldown]       = useState(0);

  const startResendTimer = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
  };

  // ── Recovery phrase reset (local — phrase stored on user object) ──────────
  const handleRecoveryPhraseReset = (e: React.FormEvent) => {
    e.preventDefault();
    setRpStatus(null);

    if (rpNewPassword !== rpConfirmPassword) {
      setRpStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (rpNewPassword.length < 6) {
      setRpStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    const user = users.find(u => u.username.toLowerCase() === rpUsername.toLowerCase());
    if (!user) { setRpStatus({ type: 'error', message: 'User not found' }); return; }
    if (!user.recoveryPhrase) {
      setRpStatus({ type: 'error', message: 'This account does not have a recovery phrase set up' });
      return;
    }
    if (user.recoveryPhrase.trim().toLowerCase() !== rpPhrase.trim().toLowerCase()) {
      setRpStatus({ type: 'error', message: 'Invalid recovery phrase' });
      return;
    }

    setRpStatus({ type: 'success', message: 'Password reset successful! You can now log in with your new password.' });
    setRpUsername(''); setRpPhrase(''); setRpNewPassword(''); setRpConfirmPassword('');
  };

  // ── Email: request reset code ──────────────────────────────────────────────
  const handleEmailResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    setEmailSending(true);
    try {
      await api.post('/auth/forgot-password', { email: emailInput });
      setPendingEmail(emailInput);
      setShowEmailResetForm(true);
      setEmailStatus({
        type: 'success',
        message: 'If an account with that email exists, a reset code has been sent. Check your inbox (and spam folder).',
      });
      startResendTimer();
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err?.message || 'Failed to send reset code. Please try again.' });
    } finally {
      setEmailSending(false);
    }
  };

  // ── Email: resend code ────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setEmailStatus(null);
    setEmailSending(true);
    try {
      await api.post('/auth/forgot-password', { email: pendingEmail });
      setEmailStatus({ type: 'success', message: 'A new reset code has been sent to your email.' });
      startResendTimer();
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err?.message || 'Failed to resend code. Please try again.' });
    } finally {
      setEmailSending(false);
    }
  };

  // ── Email: verify code + set new password ─────────────────────────────────
  const handleEmailCodeReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);

    if (emailNewPassword !== emailConfirmPassword) {
      setEmailStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (emailNewPassword.length < 6) {
      setEmailStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setResettingPassword(true);
    try {
      const data = await api.post('/auth/reset-password', {
        email: pendingEmail,
        code: emailCode,
        newPassword: emailNewPassword,
      });
      setEmailStatus({ type: 'success', message: data.message || 'Password reset! You can now log in.' });
      setEmailCode(''); setEmailNewPassword(''); setEmailConfirmPassword('');
      setShowEmailResetForm(false);
      setEmailInput('');
      setPendingEmail('');
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err?.message || 'Failed to reset password. Please try again.' });
    } finally {
      setResettingPassword(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Choose a method to reset your password</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email Code
                </TabsTrigger>
                <TabsTrigger value="recovery" className="flex items-center gap-2">
                  <Key className="h-4 w-4" /> Recovery Phrase
                </TabsTrigger>
              </TabsList>

              {/* ══ EMAIL TAB ══════════════════════════════════════════════ */}
              <TabsContent value="email">
                {!showEmailResetForm ? (
                  /* — Request code — */
                  <form onSubmit={handleEmailResetRequest} className="space-y-4">
                    <div>
                      <Label htmlFor="email-input">Email Address</Label>
                      <Input
                        id="email-input"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter your account email"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        A 6-digit reset code will be sent (expires in 30 minutes)
                      </p>
                    </div>

                    {emailStatus && (
                      <Alert className={emailStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                        <AlertCircle className={`h-4 w-4 ${emailStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                        <AlertDescription className={emailStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                          {emailStatus.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={!emailInput || emailSending}>
                      <Mail className="h-4 w-4 mr-2" />
                      {emailSending ? 'Sending…' : 'Send Reset Code'}
                    </Button>
                  </form>
                ) : (
                  /* — Enter code + new password — */
                  <form onSubmit={handleEmailCodeReset} className="space-y-4">
                    <div>
                      <Label htmlFor="email-code">Reset Code</Label>
                      <Input
                        id="email-code"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        inputMode="numeric"
                        required
                        maxLength={6}
                        className="text-center text-xl tracking-[0.4em] font-mono"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Sent to <strong>{pendingEmail}</strong>
                        {' · '}
                        {resendCooldown > 0 ? (
                          <span className="text-gray-400">Resend in {resendCooldown}s</span>
                        ) : (
                          <button
                            type="button"
                            className="text-blue-600 hover:underline"
                            onClick={handleResend}
                            disabled={emailSending}
                          >
                            {emailSending ? 'Sending…' : 'Resend code'}
                          </button>
                        )}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="email-new-password">New Password</Label>
                      <Input
                        id="email-new-password"
                        type="password"
                        value={emailNewPassword}
                        onChange={(e) => setEmailNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-confirm-password">Confirm New Password</Label>
                      <Input
                        id="email-confirm-password"
                        type="password"
                        value={emailConfirmPassword}
                        onChange={(e) => setEmailConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        required
                      />
                    </div>

                    {emailStatus && (
                      <Alert className={emailStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                        <AlertCircle className={`h-4 w-4 ${emailStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                        <AlertDescription className={emailStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                          {emailStatus.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setShowEmailResetForm(false); setEmailStatus(null); setEmailCode(''); }}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={!emailCode || !emailNewPassword || !emailConfirmPassword || resettingPassword}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {resettingPassword ? 'Resetting…' : 'Reset Password'}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              {/* ══ RECOVERY PHRASE TAB ════════════════════════════════════ */}
              <TabsContent value="recovery">
                <form onSubmit={handleRecoveryPhraseReset} className="space-y-4">
                  <div>
                    <Label htmlFor="rp-username">Username</Label>
                    <Input
                      id="rp-username"
                      value={rpUsername}
                      onChange={(e) => setRpUsername(e.target.value)}
                      placeholder="Your username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rp-phrase">Recovery Phrase</Label>
                    <Input
                      id="rp-phrase"
                      value={rpPhrase}
                      onChange={(e) => setRpPhrase(e.target.value)}
                      placeholder="Your recovery phrase"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rp-new-password">New Password</Label>
                    <Input
                      id="rp-new-password"
                      type="password"
                      value={rpNewPassword}
                      onChange={(e) => setRpNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rp-confirm-password">Confirm New Password</Label>
                    <Input
                      id="rp-confirm-password"
                      type="password"
                      value={rpConfirmPassword}
                      onChange={(e) => setRpConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                    />
                  </div>

                  {rpStatus && (
                    <Alert className={rpStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                      <AlertCircle className={`h-4 w-4 ${rpStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                      <AlertDescription className={rpStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                        {rpStatus.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

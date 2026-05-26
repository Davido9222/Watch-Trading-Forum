// ============================================
// REGISTER PAGE
// Two-step OTP flow:
//   Step 1 — fill form, click "Send Verification Code" → OTP email sent
//   Step 2 — enter 6-digit OTP → account created + auto-logged-in
// ============================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';
import { COUNTRIES } from '@/data/countries';
import { api, setToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, UserPlus, Globe, MapPin, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // ── Form fields ──────────────────────────────────────────────────────────
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry]                 = useState('');
  const [language, setLanguage]               = useState('en');
  const [showPassword, setShowPassword]       = useState(false);

  // ── OTP step ─────────────────────────────────────────────────────────────
  const [step, setStep]                     = useState<'form' | 'otp'>('form');
  const [otp, setOtp]                       = useState('');
  const [otpSending, setOtpSending]         = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Status ───────────────────────────────────────────────────────────────
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const validateForm = (): string | null => {
    if (username.length < 3)          return 'Username must be at least 3 characters';
    if (!email.includes('@'))         return 'Enter a valid email address';
    if (password.length < 6)          return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const startResendTimer = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setOtpSending(true);
    try {
      await api.post('/auth/send-register-otp', { email, username });
      setStep('otp');
      startResendTimer();
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setOtpSending(true);
    try {
      await api.post('/auth/send-register-otp', { email, username });
      startResendTimer();
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Step 2: verify OTP + create account ───────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) { setError('Enter the 6-digit code from your email'); return; }

    setIsLoading(true);
    try {
      // Register with OTP — api helper uses VITE_API_BASE_URL
      const data = await api.post('/auth/register', {
        username, email, password, country, language, otp,
      });
      // Store the token and log the user in via the auth store
      setToken(data.token);
      // Use login() to fully hydrate auth state (users list, notifications, etc.)
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — STEP 1: Registration form
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join the Watch Trading Forums community</CardDescription>
          </CardHeader>

          <form onSubmit={handleSendOtp}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  A 6-digit verification code will be sent here to confirm your email
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Country
                </Label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Preferred Language
                </Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  This changes the display language of the entire site for you
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={otpSending}>
                <Mail className="h-4 w-4 mr-2" />
                {otpSending ? 'Sending verification code…' : 'Send Verification Code'}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — STEP 2: Enter OTP
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We sent a 6-digit verification code to{' '}
            <strong className="text-gray-800">{email}</strong>.<br />
            Enter it below to finish creating your account.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleCreateAccount}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            <p className="text-center text-sm text-gray-500">
              Didn&apos;t receive it? Check your spam folder, or{' '}
              {resendCooldown > 0 ? (
                <span className="text-gray-400">resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={handleResend}
                  disabled={otpSending}
                >
                  {otpSending ? 'Sending…' : 'resend code'}
                </button>
              )}
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || otp.length !== 6}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mx-auto"
              onClick={() => { setStep('form'); setOtp(''); setError(''); }}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to form
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;

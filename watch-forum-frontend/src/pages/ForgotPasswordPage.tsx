// ============================================
// FORGOT PASSWORD PAGE
// Two options: Recovery phrase or email reset
// ============================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Key, Mail, Check, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { users } = useAuthStore();
  
  // Recovery phrase method states
  const [rpUsername, setRpUsername] = useState('');
  const [rpPhrase, setRpPhrase] = useState('');
  const [rpNewPassword, setRpNewPassword] = useState('');
  const [rpConfirmPassword, setRpConfirmPassword] = useState('');
  const [rpStatus, setRpStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Email method states
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [emailNewPassword, setEmailNewPassword] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [showEmailResetForm, setShowEmailResetForm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Handle recovery phrase reset
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
    
    if (!user) {
      setRpStatus({ type: 'error', message: 'User not found' });
      return;
    }
    
    if (!user.recoveryPhrase) {
      setRpStatus({ type: 'error', message: 'This account does not have a recovery phrase set up' });
      return;
    }
    
    if (user.recoveryPhrase.trim().toLowerCase() !== rpPhrase.trim().toLowerCase()) {
      setRpStatus({ type: 'error', message: 'Invalid recovery phrase' });
      return;
    }
    
    // Reset password
    user.password = rpNewPassword; // In production, this would be hashed
    setRpStatus({ type: 'success', message: 'Password reset successful! You can now log in with your new password.' });
    
    // Clear form
    setRpUsername('');
    setRpPhrase('');
    setRpNewPassword('');
    setRpConfirmPassword('');
  };

  // Handle email reset request
  const handleEmailResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    
    const user = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
    
    if (!user) {
      setEmailStatus({ type: 'error', message: 'No account found with this email address' });
      return;
    }
    
    // In a real implementation, this would call the PHP backend
    // For demo, we'll simulate the email being sent
    setPendingEmail(emailInput);
    setShowEmailResetForm(true);
    setEmailStatus({ 
      type: 'success', 
      message: 'A reset code has been sent to your email. Enter it below along with your new password.' 
    });
  };

  // Handle email code verification and password reset
  const handleEmailCodeReset = (e: React.FormEvent) => {
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
    
    // In production, this would verify the code with the backend
    // For demo, any 6-digit code works
    if (!/^\d{6}$/.test(emailCode)) {
      setEmailStatus({ type: 'error', message: 'Please enter a valid 6-digit code' });
      return;
    }
    
    const user = users.find(u => u.email.toLowerCase() === pendingEmail.toLowerCase());
    if (user) {
      user.password = emailNewPassword; // In production, this would be hashed
      setEmailStatus({ type: 'success', message: 'Password reset successful! You can now log in with your new password.' });
      
      // Clear form
      setEmailInput('');
      setEmailCode('');
      setEmailNewPassword('');
      setEmailConfirmPassword('');
      setShowEmailResetForm(false);
      setPendingEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Key className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Choose a method to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="recovery" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recovery">
                  <Key className="h-4 w-4 mr-2" />
                  Recovery Phrase
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              {/* Recovery Phrase Method */}
              <TabsContent value="recovery">
                <form onSubmit={handleRecoveryPhraseReset} className="space-y-4">
                  <div>
                    <Label htmlFor="rp-username">Username</Label>
                    <Input
                      id="rp-username"
                      value={rpUsername}
                      onChange={(e) => setRpUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rp-phrase">Recovery Phrase</Label>
                    <Input
                      id="rp-phrase"
                      value={rpPhrase}
                      onChange={(e) => setRpPhrase(e.target.value)}
                      placeholder="Enter your recovery phrase"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the phrase you set up in your profile settings
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="rp-new-password">New Password</Label>
                    <Input
                      id="rp-new-password"
                      type="password"
                      value={rpNewPassword}
                      onChange={(e) => setRpNewPassword(e.target.value)}
                      placeholder="Enter new password"
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
                      placeholder="Confirm new password"
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

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!rpUsername || !rpPhrase || !rpNewPassword || !rpConfirmPassword}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </form>
              </TabsContent>

              {/* Email Method */}
              <TabsContent value="email">
                {!showEmailResetForm ? (
                  <form onSubmit={handleEmailResetRequest} className="space-y-4">
                    <div>
                      <Label htmlFor="email-input">Email Address</Label>
                      <Input
                        id="email-input"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        A reset code will be sent to this email (expires in 30 minutes)
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

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={!emailInput}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Code
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleEmailCodeReset} className="space-y-4">
                    <div>
                      <Label htmlFor="email-code">Reset Code</Label>
                      <Input
                        id="email-code"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="Enter 6-digit code from email"
                        required
                        maxLength={6}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email-new-password">New Password</Label>
                      <Input
                        id="email-new-password"
                        type="password"
                        value={emailNewPassword}
                        onChange={(e) => setEmailNewPassword(e.target.value)}
                        placeholder="Enter new password"
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
                        placeholder="Confirm new password"
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
                        onClick={() => {
                          setShowEmailResetForm(false);
                          setEmailStatus(null);
                        }}
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={!emailCode || !emailNewPassword || !emailConfirmPassword}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

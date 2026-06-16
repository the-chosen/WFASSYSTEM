import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, Save, Upload, Trash2, Key, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth, apiFetch } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS: Record<string, string> = {
  user: 'Staff',
  admin: 'Admin',
  super_admin: 'Super Admin',
};
const ROLE_COLORS: Record<string, string> = {
  user: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
  super_admin: 'bg-amber-100 text-amber-800',
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const sigRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [signatureImage, setSignatureImage] = useState(user?.signatureImage ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setSignatureImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName, email, signatureImage }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      await refreshUser();
      toast({ title: 'Profile saved', description: 'Your details have been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Could not save profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPwd.length < 6) {
      toast({ title: 'Password too short', description: 'Minimum 6 characters.', variant: 'destructive' });
      return;
    }
    setPwdSaving(true);
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed');
      }
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      toast({ title: 'Password changed successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPwdSaving(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
              <User className="w-8 h-8 text-accent" /> My Profile
            </h1>
            <p className="text-muted-foreground mt-1">Manage your name, signature, and password.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        {/* Identity Card */}
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Account Info</CardTitle>
            <Badge className={`text-xs ${ROLE_COLORS[user.role] ?? ''}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user.username} disabled className="bg-muted/30 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Display Name (Prepared By)</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-semibold">Signature</Label>
              <p className="text-xs text-muted-foreground">Upload once — it auto-fills on every document you prepare.</p>
              {signatureImage ? (
                <div className="flex items-end gap-4">
                  <div className="border border-border rounded-lg p-3 bg-white inline-block">
                    <img src={signatureImage} alt="Signature" className="max-h-16 max-w-[200px] object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => sigRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5 mr-1" /> Change
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setSignatureImage('')}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => sigRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Signature
                </Button>
              )}
              <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={handleSigUpload} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Key className="w-5 h-5" /> Change Password</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="repeat new password" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={pwdSaving} variant="outline">
                {pwdSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

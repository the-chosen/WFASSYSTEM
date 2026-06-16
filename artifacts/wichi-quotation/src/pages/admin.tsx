import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Shield, Plus, Trash2,
  Edit2, UserPlus, Loader2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, apiFetch } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { useListQuotations, useListUsers, useCreateUser, useDeleteUser, useUpdateUser } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};
const ROLE_LABELS: Record<string, string> = { user: 'Staff', admin: 'Admin', super_admin: 'Super Admin' };
const ROLE_COLORS: Record<string, string> = {
  user: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
  super_admin: 'bg-amber-100 text-amber-800',
};

const fmtDate = (d: string) => { try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; } };

export default function Admin() {
  const { user, isSuperAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotations = [], refetch: refetchQ } = useListQuotations();
  const { data: users = [], refetch: refetchU } = useListUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();

  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [userDialog, setUserDialog] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ username: '', displayName: '', email: '', password: '', role: 'user' });

  const pendingQuotations = quotations.filter(q => (q as any).status === 'pending');
  const allQuotations = [...quotations].reverse();

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/quotations/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      await refetchQ();
      toast({ title: 'Document approved', description: 'It can now be downloaded as PDF.' });
    } catch {
      toast({ title: 'Approval failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (id: number) => { setRejectId(id); setRejectReason(''); setRejectDialog(true); };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) { toast({ title: 'Please enter a reason', variant: 'destructive' }); return; }
    setActionLoading(rejectId);
    try {
      const res = await apiFetch(`/quotations/${rejectId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error('Failed');
      setRejectDialog(false);
      await refetchQ();
      toast({ title: 'Document rejected' });
    } catch {
      toast({ title: 'Rejection failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const openNewUser = () => {
    setEditUser(null);
    setUserForm({ username: '', displayName: '', email: '', password: '', role: 'user' });
    setUserDialog(true);
  };

  const openEditUser = (u: any) => {
    setEditUser(u);
    setUserForm({ username: u.username, displayName: u.displayName, email: u.email ?? '', password: '', role: u.role });
    setUserDialog(true);
  };

  const saveUser = async () => {
    try {
      if (editUser) {
        await updateUserMutation.mutateAsync({ id: editUser.id, data: { role: userForm.role as any, displayName: userForm.displayName, email: userForm.email } });
        toast({ title: 'User updated' });
      } else {
        await createUserMutation.mutateAsync({ data: { username: userForm.username, displayName: userForm.displayName, email: userForm.email, password: userForm.password, role: userForm.role as any } });
        toast({ title: 'User created' });
      }
      setUserDialog(false);
      refetchU();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    await deleteUserMutation.mutateAsync({ id });
    refetchU();
    toast({ title: 'User deleted' });
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" /> Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">Approve documents and manage users.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        <Tabs defaultValue="approvals">
          <TabsList>
            <TabsTrigger value="approvals">
              Approvals
              {pendingQuotations.length > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-white text-xs px-1.5 py-0">{pendingQuotations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          </TabsList>

          {/* Pending approvals */}
          <TabsContent value="approvals" className="mt-4">
            {pendingQuotations.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-16 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-3" />
                  <p className="text-muted-foreground">No documents pending approval.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingQuotations.map(q => (
                  <Card key={q.id} className="shadow-sm border-yellow-200 bg-yellow-50/30">
                    <div className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                          <span className="font-semibold text-primary font-mono text-sm">{q.quotationNumber}</span>
                          {q.clientName && <span className="text-sm text-foreground">— {q.clientName}</span>}
                          {q.companyName && <span className="text-sm text-muted-foreground">({q.companyName})</span>}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{(q as any).documentType ?? 'quotation'}</span>
                          <span>Prepared by: {q.preparedBy}</span>
                          <span>Saved: {fmtDate(q.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setLocation(`/?load=${q.id}`)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={actionLoading === q.id}
                          onClick={() => handleApprove(q.id)}
                        >
                          {actionLoading === q.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={actionLoading === q.id}
                          onClick={() => openReject(q.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All documents */}
          <TabsContent value="all" className="mt-4">
            <Card className="shadow-sm">
              <CardContent className="pt-0 divide-y divide-border">
                {allQuotations.length === 0 && (
                  <p className="py-12 text-center text-muted-foreground">No documents yet.</p>
                )}
                {allQuotations.map(q => (
                  <div key={q.id} className="flex items-center justify-between py-3 px-2 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-primary">{q.quotationNumber}</span>
                        {q.clientName && <span className="text-sm">— {q.clientName}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{q.preparedBy} · {fmtDate(q.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs ${STATUS_STYLES[(q as any).status ?? 'draft']}`}>{(q as any).status ?? 'draft'}</Badge>
                      <Button size="sm" variant="outline" onClick={() => setLocation(`/?load=${q.id}`)}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> Open
                      </Button>
                      {(q as any).status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(q.id)}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => openReject(q.id)}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users (super_admin only) */}
          {isSuperAdmin && (
            <TabsContent value="users" className="mt-4">
              <div className="flex justify-end mb-3">
                <Button size="sm" onClick={openNewUser} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <UserPlus className="w-4 h-4 mr-1" /> Add User
                </Button>
              </div>
              <Card className="shadow-sm">
                <CardContent className="pt-0 divide-y divide-border">
                  {(users as any[]).map(u => (
                    <div key={u.id} className="flex items-center justify-between py-3 px-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{u.displayName}</span>
                          <span className="text-xs text-muted-foreground">@{u.username}</span>
                          <Badge className={`text-xs ${ROLE_COLORS[u.role] ?? ''}`}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                        </div>
                        {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditUser(u)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {u.id !== user.id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Document</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason for rejection *</Label>
            <Textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain what needs to be corrected..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Display Name *</Label>
              <Input value={userForm.displayName} onChange={e => setUserForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Full Name" />
            </div>
            {!editUser && (
              <>
                <div className="space-y-1.5">
                  <Label>Username *</Label>
                  <Input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} placeholder="john.doe" />
                </div>
                <div className="space-y-1.5">
                  <Label>Password *</Label>
                  <Input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="min 6 characters" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>Cancel</Button>
            <Button onClick={saveUser} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editUser ? 'Update' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

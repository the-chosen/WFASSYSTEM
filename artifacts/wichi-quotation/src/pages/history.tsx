import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { FileText, FolderOpen, Trash2, Plus, ArrowLeft, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useListQuotations, useDeleteQuotation } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function History() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quotations, isLoading, isError } = useListQuotations();

  const deleteMutation = useDeleteQuotation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listQuotations'] });
        toast({ title: 'Quotation deleted', description: 'The quotation has been removed.' });
      },
      onError: () => {
        toast({ title: 'Delete failed', description: 'Could not delete the quotation.', variant: 'destructive' });
      },
    },
  });

  const handleLoad = (id: number) => {
    setLocation(`/?load=${id}`);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
              <Clock className="w-8 h-8 text-accent" />
              Quotation History
            </h1>
            <p className="text-muted-foreground mt-1">All saved quotations for Wichi Farms.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Builder
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setLocation('/')}>
              <Plus className="w-4 h-4 mr-1" /> New Quotation
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-center text-destructive">
              Failed to load quotations. Please try again.
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && quotations && quotations.length === 0 && (
          <Card className="shadow-sm border-border">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground text-lg">No saved quotations yet.</p>
              <p className="text-muted-foreground/60 text-sm">Build a quotation and click "Save" to store it here.</p>
              <Button onClick={() => setLocation('/')} className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                <Plus className="w-4 h-4 mr-2" /> Create First Quotation
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && quotations && quotations.length > 0 && (
          <Card className="shadow-sm border-border">
            <CardHeader className="bg-muted/20 border-b border-border pb-4">
              <CardTitle className="text-lg">
                {quotations.length} saved quotation{quotations.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y divide-border">
              {[...quotations].reverse().map((q) => (
                <div key={q.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-primary font-mono text-sm">{q.quotationNumber}</span>
                      {q.clientName && (
                        <span className="text-sm text-foreground">— {q.clientName}</span>
                      )}
                      {q.companyName && (
                        <span className="text-sm text-muted-foreground">({q.companyName})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Date: {q.date}</span>
                      {q.validUntil && <span>Valid: {q.validUntil}</span>}
                      <span className="text-muted-foreground/60">Saved: {formatDate(q.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoad(q.id)}
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-1" /> Load
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{q.quotationNumber}</strong>
                            {q.clientName ? ` for ${q.clientName}` : ''}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(q.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

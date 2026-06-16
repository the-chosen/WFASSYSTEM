import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Preview from "@/pages/preview";
import History from "@/pages/history";
import Inventory from "@/pages/inventory";
import Leads from "@/pages/leads";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) setLocation("/");
  }, [loading, isAdmin]);

  if (loading) return null;
  if (!isAdmin) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <RequireAuth><Home /></RequireAuth>
      </Route>
      <Route path="/preview">
        <RequireAuth><Preview /></RequireAuth>
      </Route>
      <Route path="/history">
        <RequireAuth><History /></RequireAuth>
      </Route>
      <Route path="/inventory">
        <RequireAuth><Inventory /></RequireAuth>
      </Route>
      <Route path="/leads">
        <RequireAuth><Leads /></RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth><Profile /></RequireAuth>
      </Route>
      <Route path="/admin">
        <RequireAuth><RequireAdmin><Admin /></RequireAdmin></RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

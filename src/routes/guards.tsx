import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import { LogoMark } from "@/components/brand/Logo";

function FullscreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <LogoMark className="h-12 w-12 animate-pulse" />
    </div>
  );
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireClinic() {
  const { hasClinic, loading } = useClinic();
  if (loading) return <FullscreenLoader />;
  if (!hasClinic) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function RequirePlatformAdmin() {
  const { profile, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (profile?.platform_role !== "platform_admin")
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

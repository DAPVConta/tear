import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { ClinicProvider } from "@/providers/ClinicProvider";
import { ThemeApplier } from "@/providers/ThemeApplier";
import { queryClient } from "@/lib/queryClient";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClinicProvider>
            <ThemeApplier />
            <TooltipProvider delayDuration={200}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ClinicProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);

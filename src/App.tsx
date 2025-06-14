
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AnalyticsProvider from "./contexts/AnalyticsContext";
import { ContentProvider } from "./contexts/ContentContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EnhancedMCQPractice from "./pages/EnhancedMCQPractice";
import Dashboard from "./components/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <ContentProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mcq-practice" element={<EnhancedMCQPractice />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ContentProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

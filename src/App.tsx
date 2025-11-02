// src/App.tsx
import React, { Suspense } from 'react';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { ApiProvider } from "./api/loja-fisica/empresas/EmpresasContexto";
import { CarrinhoProvider } from "./api/loja-online/CarrinhoContext";
import { FavoritosProvider } from "./api/loja-online/FavoritosContext";
import { AvaliacoesProvider } from "./api/loja-online/AvaliacoesContext";

// Componentes globais
import Header from "./components/Header";
import Footer from "./components/Footer";

// Importações das páginas principais
import Index from "./pages/Index";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Importações das páginas de autenticação
import AuthPage from "./pages/auth/AuthPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Importações das lojas com dashboards
import LojaOnlineDashboard from "./pages/loja-online/Dashboard";
import LojaFisicaDashboard from "./pages/loja-fisica/Dashboard";
import LojaOnline from "./pages/loja-online/RotasLojaOnline";
import LojaFisica from "./pages/loja-fisica/RotasLojaFisica";
// Importação da página de checkout para loja online
const Checkout = React.lazy(() => import("./pages/loja-online/Checkout"));

// Cliente para React Query (gerenciamento de estado e cache)
const queryClient = new QueryClient();

// Componente de fallback para carregamento de páginas lazy
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-t-amber-500 border-r-transparent border-b-amber-500 border-l-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-medium text-gray-700">Carregando...</p>
    </div>
  </div>
);

const App = () => (
  // Providers encadeados para funcionalidades globais
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ApiProvider>
        <CarrinhoProvider>
          <FavoritosProvider>
            <AvaliacoesProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    {/* Layout principal: Header fixo, conteúdo principal expansível, Footer fixo */}
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      {/* Área principal com padding-top para compensar header fixo */}
                      <main className="flex-grow pt-16">
                        <Suspense fallback={<LoadingFallback />}>
                          <Routes>
                            {/* Rotas públicas do site */}
                            <Route path="/" element={<Index />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/menu" element={<Menu />} />
                            <Route path="/sobre" element={<Sobre />} />
                            <Route path="/contato" element={<Contato />} />
                            <Route path="/auth" element={<AuthPage />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            
                            {/* Rotas protegidas da Loja Online */}
                            <Route path="/loja-online" element={
                              <ProtectedRoute requiredType="online">
                                <LojaOnlineDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/loja-online/*" element={
                              <ProtectedRoute requiredType="online">
                                <LojaOnline />
                              </ProtectedRoute>
                            } />
                            
                            {/* Rotas protegidas da Loja Física */}
                            <Route path="/loja-fisica" element={
                              <ProtectedRoute requiredType="fisica">
                                <LojaFisicaDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/loja-fisica/*" element={
                              <ProtectedRoute requiredType="fisica">
                                <LojaFisica />
                              </ProtectedRoute>
                            } />
                            
                            {/* Rota coringa para páginas não encontradas */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Suspense>
                      </main>
                      <Footer />
                    </div>
                  </BrowserRouter>
                </TooltipProvider>
              </ThemeProvider>
            </AvaliacoesProvider>
          </FavoritosProvider>
        </CarrinhoProvider>
      </ApiProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

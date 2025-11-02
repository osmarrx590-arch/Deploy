
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import LayoutDaLojaOnline from "../../components/layout/layout_loja_online";
import Loja from "./Loja";
import Produtos from "./Produtos";
import ProdutoDetalhes from "./ProdutoDetalhes";
import Historico from "./Historico";
import Favoritos from "./Favoritos";
import Avaliacoes from "./Avaliacoes";
const Checkout = React.lazy(() => import("./Checkout"));

const LojaOnline = () => (
  <ProtectedRoute>
    <LayoutDaLojaOnline>
      <Suspense fallback={<div>Carregando...</div>}>
        <Routes>
          <Route index element={<Loja />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="produto/:id" element={<ProdutoDetalhes />} />
          <Route path="historico" element={<Historico />} />
          <Route path="favoritos" element={<Favoritos />} />
          <Route path="avaliacoes" element={<Avaliacoes />} />
          {/* Rota para página de checkout da loja online */}
          <Route path="checkout" element={<Checkout />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </Suspense>
    </LayoutDaLojaOnline>
  </ProtectedRoute>
);

export default LojaOnline;

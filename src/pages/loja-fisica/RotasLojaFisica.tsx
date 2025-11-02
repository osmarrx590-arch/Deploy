
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

// Layout interno (sem Header e Footer global)
import LayoutLojaFisica from "@/components/layout/layout_loja_fisica";

// Páginas específicas da loja física
import LojaFisicaIndex from "./Index";
import ListarProdutos from "./produto/ListarProdutos";
import EmpresaList from "./empresas/EmpresaList";
import EmpresaCadastro from "./empresas/EmpresaCadastro";
import EmpresaDetail from "./empresas/EmpresaDetail";
import EstoqueList from "./estoque/EstoqueList";
import CategoriaList from "./categoria/CategoriaList";
import MesasPages from "./mesas/MesasPages";
import MesaDetalhes from "./mesas/MesaDetalhes";
import PedidosOnline from "./pedidos/PedidosOnline";
import PedidosLocais from "./pedidos/PedidosLocais";

// Componente principal da loja física
const LojaFisica = () => (
  <ProtectedRoute>
    <LayoutLojaFisica>
      <Routes>
        <Route index element={<LojaFisicaIndex />} />
        <Route path="produtos" element={<ListarProdutos />} />
        <Route path="produtos/:slug" element={<ListarProdutos />} />
        <Route path="empresas" element={<EmpresaList />} />
        <Route path="empresas/cadastro" element={<EmpresaCadastro />} />
        <Route path="empresas/:id" element={<EmpresaDetail />} />
        <Route path="estoque" element={<EstoqueList />} />
        <Route path="mesas" element={<MesasPages />} />
        <Route path="mesas/:id" element={<MesaDetalhes />} />
        <Route path="categorias" element={<CategoriaList />} />
        <Route path="pedidos-online" element={<PedidosOnline />} />
        <Route path="pedidos-recebidos" element={<PedidosLocais />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </LayoutLojaFisica>
  </ProtectedRoute>
);

export default LojaFisica;

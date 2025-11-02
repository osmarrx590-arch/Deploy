
import { formataPreco } from '@/contexts/moeda'; // Função para formatação de preço)

import { ItemMesaPrint as ItemMesa } from '@/types/common';

export const printComanda = (mesaPedido: number | string | undefined, itensMesa: ItemMesa[], totalGeral: number) => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comanda #${mesaPedido}</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: black;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          body.loaded {
            opacity: 1;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .info {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .total {
            text-align: right;
            font-weight: bold;
            margin-top: 20px;
          }
          .actions {
            text-align: center;
            margin-top: 20px;
          }
          .print-button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 4px;
          }
          @media print {
            .actions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>COMANDA</h2>
        </div>
        <div class="info">
          <p><strong>Mesa:</strong> ${mesaPedido}</p>
          <p><strong>Data:</strong> ${currentDate}</p>
          <p><strong>Hora:</strong> ${currentTime}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd</th>
              <th>Preço Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itensMesa.map(item => `
              <tr>
                <td>${item.nome}</td>
                <td>${item.quantidade}</td>
                <td>${formataPreco(item.venda)}</td>
                <td>${formataPreco(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>Total a Pagar: ${formataPreco(totalGeral)}</p>
        </div>
        <div class="actions">
          <button class="print-button" onclick="window.print()">Imprimir Comanda</button>
          <button class="print-button" style="background-color: #f44336;" onclick="window.close()">Fechar</button>
        </div>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            document.body.classList.add('loaded');
            
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                window.close();
              } else if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
              }
            });
          });
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Não foi possível abrir janela de impressão');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
};


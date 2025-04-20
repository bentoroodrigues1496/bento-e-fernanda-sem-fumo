
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Make sure the root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
}

// Adicionar um console log para depuração
console.log("main.tsx: carregando aplicativo");

// Renderizar o aplicativo com tratamento de erros
try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log("main.tsx: aplicativo renderizado com sucesso");
} catch (error) {
  console.error("main.tsx: erro ao renderizar aplicativo", error);
  // Mostrar erro na tela para facilitar a depuração
  const errorDiv = document.createElement('div');
  errorDiv.style.padding = '20px';
  errorDiv.style.margin = '20px';
  errorDiv.style.backgroundColor = '#ffdddd';
  errorDiv.style.border = '1px solid #ff0000';
  errorDiv.innerHTML = `<h2>Erro ao iniciar o aplicativo</h2><pre>${error}</pre>`;
  document.body.appendChild(errorDiv);
}

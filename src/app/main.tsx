import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@/ui/theme/tokens.css';
import '@/ui/theme/app.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root não encontrado');

// Sem <StrictMode>: o duplo mount de desenvolvimento criaria dois Phaser.Game/WebGL.
createRoot(root).render(<App />);

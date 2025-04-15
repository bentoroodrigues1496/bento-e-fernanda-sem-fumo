
import React from 'react';
import { Share2 } from 'lucide-react';
import Settings from './Settings';

const Header: React.FC = () => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Sem Fumar - Bento e Fernanda',
        text: 'Acompanhe nosso progresso para parar de fumar!',
        url: window.location.href,
      })
      .catch((error) => console.log('Erro ao compartilhar:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copiado para a área de transferência!'))
        .catch((error) => console.log('Erro ao copiar link:', error));
    }
  };

  return (
    <div className="flex justify-between items-center mb-6 p-2 backdrop-blur-sm rounded-2xl bg-white/30 shadow-sm">
      <h1 className="text-2xl font-bold text-primary pl-2 text-gradient">Sem Fumar</h1>
      <div className="flex gap-2">
        <button 
          onClick={handleShare} 
          className="p-2 rounded-full hover:bg-mint/30 transition-colors"
          aria-label="Compartilhar"
        >
          <Share2 size={20} className="text-primary" />
        </button>
        <Settings />
      </div>
    </div>
  );
};

export default Header;

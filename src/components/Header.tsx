
import React from 'react';
import { Share2, Settings } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

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
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-primary">Sem Fumar</h1>
      <div className="flex gap-2">
        <button 
          onClick={handleShare} 
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Compartilhar"
        >
          <Share2 size={20} />
        </button>
        <button 
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Configurações"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default Header;

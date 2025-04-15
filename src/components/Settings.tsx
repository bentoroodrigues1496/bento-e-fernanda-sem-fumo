
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';

const Settings: React.FC = () => {
  const { data, updateDailyValue } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [bentoValue, setBentoValue] = useState(data.dailyValueBento);
  const [fernandaValue, setFernandaValue] = useState(data.dailyValueFernanda);

  const handleSave = () => {
    updateDailyValue('bento', Number(bentoValue));
    updateDailyValue('fernanda', Number(fernandaValue));
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => {
          setBentoValue(data.dailyValueBento);
          setFernandaValue(data.dailyValueFernanda);
          setIsOpen(true);
        }}
        className="p-2 rounded-full hover:bg-mint/30 transition-colors"
        aria-label="Configurações"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl bg-gradient-to-br from-white to-blue-light/30 backdrop-blur-sm border border-blue-light">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Configurações</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Defina o valor diário para cada pessoa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="bento-value" className="text-md">
                Valor diário - Bento
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="bento-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bentoValue}
                  onChange={(e) => setBentoValue(parseFloat(e.target.value) || 0)}
                  className="pl-9 bg-white/70 backdrop-blur-sm border-mint"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(bentoValue * 30)} por mês
              </p>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="fernanda-value" className="text-md">
                Valor diário - Fernanda
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="fernanda-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fernandaValue}
                  onChange={(e) => setFernandaValue(parseFloat(e.target.value) || 0)}
                  className="pl-9 bg-white/70 backdrop-blur-sm border-mint"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(fernandaValue * 30)} por mês
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSave} 
              className="bg-mint-dark hover:bg-mint-dark/90 text-white w-full"
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings;

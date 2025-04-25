
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const SetNameForm = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Nome salvo com sucesso!",
        description: "Bem-vindo ao aplicativo.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Erro ao salvar nome",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-br from-white via-blue-light/20 to-mint/30 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto rounded-2xl bg-white/50 backdrop-blur-sm shadow-lg border border-white/50 p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-primary">Bem-vindo!</h2>
        <p className="text-center mb-6 text-gray-600">Para começar, por favor nos diga seu nome.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              disabled={loading}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-mint-dark hover:bg-mint-dark/90"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Continuar'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SetNameForm;


import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthProvider: iniciando");
    
    // Configurar listener para mudanças de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("AuthProvider: evento de autenticação", event, newSession?.user?.email);
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        } else if (event === 'SIGNED_IN') {
          navigate('/');
        }
      }
    );

    // DEPOIS checar sessão atual
    const getSession = async () => {
      try {
        console.log("AuthProvider: buscando sessão");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao buscar sessão:', error);
          setLoading(false);
          return;
        }
        
        console.log("AuthProvider: sessão encontrada", data.session?.user?.email);
        setSession(data.session);
        setUser(data.session?.user || null);
        setLoading(false);
      } catch (error) {
        console.error('Erro inesperado:', error);
        setLoading(false);
      }
    };
    
    getSession();

    return () => {
      console.log("AuthProvider: limpando listener");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    console.log("AuthProvider: iniciando logout");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  console.log("AuthProvider: renderizando", { user: user?.email, loading });

  return (
    <AuthContext.Provider value={{ user, session, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

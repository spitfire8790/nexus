import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Globe2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        navigate('/');
        return;
      }
      navigate('/');
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="animate-spin">
        <Globe2 className="h-8 w-8 text-primary" />
      </div>
    </div>
  );
}

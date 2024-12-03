import { useEffect } from 'react';
import { useMapStore } from '@/lib/map-store';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useSavedProperties() {
  const { user } = useAuth();
  const setSavedProperties = useMapStore((state) => state.setSavedProperties);

  useEffect(() => {
    if (!user) {
      setSavedProperties([]);
      return;
    }

    const fetchSavedProperties = async () => {
      const { data, error } = await supabase
        .from('saved_properties')
        .select('*');

      if (error) {
        console.error('Error fetching saved properties:', error);
        return;
      }

      setSavedProperties(data);
    };

    fetchSavedProperties();

    // Subscribe to changes
    const channel = supabase
      .channel('saved_properties_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'saved_properties' 
        }, 
        fetchSavedProperties
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, setSavedProperties]);
} 
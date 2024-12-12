import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useMapStore } from '@/lib/map-store';

export function useNearmapKey() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const updateLayerUrl = useMapStore((state) => state.updateLayerUrl);

  const createNearmapUrl = (apiKey: string) => {
    const params = new URLSearchParams({
      service: 'WMS',
      request: 'GetMap',
      layers: 'Vert',
      styles: '',
      format: 'image/jpeg',
      transparent: 'true',
      version: '1.1.1'
    });
    return `https://api.nearmap.com/wms/v1/latest/apikey/${apiKey}?${params.toString()}`;
  };

  useEffect(() => {
    const loadApiKey = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('nearmap_key')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error fetching Nearmap API key:', error);
        return;
      }
      
      if (data?.nearmap_key) {
        const nearmapUrl = createNearmapUrl(data.nearmap_key);
        updateLayerUrl('nearmap', nearmapUrl);
      }
    };

    loadApiKey();
  }, [user, updateLayerUrl]);

  const updateApiKey = async (newKey: string) => {
    if (!user) {
      console.error('No user found');
      return false;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          nearmap_key: newKey,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const nearmapUrl = createNearmapUrl(newKey);
      updateLayerUrl('nearmap', nearmapUrl);
      
      return true;
    } catch (error) {
      console.error('Detailed error updating Nearmap API key:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateApiKey,
    isLoading
  };
} 
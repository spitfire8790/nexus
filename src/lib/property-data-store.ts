import { create } from 'zustand';

export interface SharedPropertyData {
  overview: any;
  demographics: any;
  zoning: any;
  loading: boolean;
  error: string | null;
}

interface PropertyDataState {
  propertyData: SharedPropertyData;
  setPropertyData: (type: keyof Omit<SharedPropertyData, 'loading' | 'error'>, data: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPropertyData: () => void;
}

const initialState: SharedPropertyData = {
  overview: null,
  demographics: null,
  zoning: null,
  loading: false,
  error: null,
};

export const usePropertyDataStore = create<PropertyDataState>((set) => ({
  propertyData: initialState,
  setPropertyData: (type, data) =>
    set((state) => ({
      propertyData: {
        ...state.propertyData,
        [type]: data,
      },
    })),
  setLoading: (loading) =>
    set((state) => ({
      propertyData: {
        ...state.propertyData,
        loading,
      },
    })),
  setError: (error) =>
    set((state) => ({
      propertyData: {
        ...state.propertyData,
        error,
      },
    })),
  clearPropertyData: () =>
    set(() => ({
      propertyData: initialState,
    })),
}));

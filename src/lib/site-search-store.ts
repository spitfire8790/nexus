import { create } from 'zustand';

interface SiteSearchState {
  availableSuburbs: string[];
  availableLGAs: string[];
  councilNames: Record<string, string>;
  isLoadingLocations: boolean;
  setAvailableSuburbs: (suburbs: string[]) => void;
  setAvailableLGAs: (lgas: string[]) => void;
  setCouncilNames: (names: Record<string, string>) => void;
  setIsLoadingLocations: (isLoading: boolean) => void;
}

export const useSiteSearchStore = create<SiteSearchState>((set) => ({
  availableSuburbs: [],
  availableLGAs: [],
  councilNames: {},
  isLoadingLocations: true,
  setAvailableSuburbs: (suburbs) => set({ availableSuburbs: suburbs }),
  setAvailableLGAs: (lgas) => set({ availableLGAs: lgas }),
  setCouncilNames: (names) => set({ councilNames: names }),
  setIsLoadingLocations: (isLoading) => set({ isLoadingLocations: isLoading }),
})); 
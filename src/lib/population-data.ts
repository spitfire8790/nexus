import Papa from 'papaparse';

let populationDataCache: Record<string, Record<string, number>> | null = null;

export async function loadPopulationData() {
  if (populationDataCache) return populationDataCache;

  try {
    const response = await fetch('/popprojSA2.csv');
    const csvText = await response.text();
    
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    populationDataCache = data.reduce((acc: Record<string, Record<string, number>>, row: any) => {
      const sa2Name = row.SA2;
      delete row.SA2;
      acc[sa2Name] = Object.entries(row).reduce((yearData, [year, pop]) => {
        yearData[year] = Number(pop);
        return yearData;
      }, {} as Record<string, number>);
      return acc;
    }, {});

    return populationDataCache;
  } catch (error) {
    console.error('Error loading population data:', error);
    throw error;
  }
} 
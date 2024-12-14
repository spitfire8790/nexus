interface SaleData {
  id: string;
  suburb: string;
  address: string;
  price: number;
  sold_date: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  land_size: string;
  collected_at: string;
}

function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (char === ',' && !inQuotes) {
      fields.push(field.trim());
      field = '';
      continue;
    }
    
    field += char;
  }
  
  fields.push(field.trim()); // Push the last field
  return fields;
}

export async function loadSaleData(): Promise<SaleData[]> {
  try {
    const response = await fetch('/data/sale prices/sale_prices_all.csv');
    const text = await response.text();
    
    // Parse CSV
    const rows = text.split('\n').slice(1); // Skip header
    return rows
      .filter(row => row.trim()) // Remove empty rows
      .map(row => {
        const [
          id,
          suburb,
          address,
          price,
          sold_date,
          property_type,
          bedrooms,
          bathrooms,
          parking,
          land_size,
          collected_at
        ] = parseCSVRow(row);

        const sale = {
          id,
          suburb, 
          address,
          price: parseInt(price) || 0,
          sold_date,
          property_type: property_type?.toLowerCase() || '',
          bedrooms: parseInt(bedrooms) || 0,
          bathrooms: parseInt(bathrooms) || 0,
          parking: parseInt(parking) || 0,
            land_size,
          collected_at
        };

        // Debug log
        console.log('Parsed sale:', {
          property_type: sale.property_type,
          bedrooms: sale.bedrooms,
          price: sale.price
        });

        return sale;
      });
  } catch (error) {
    console.error('Error loading sale data:', error);
    return [];
  }
} 
interface PlanningDefinitions {
    [key: string]: string;
  }
  
  export const planningDefinitions: PlanningDefinitions = {};
  
  export function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { // Handle escaped quotes
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  export async function loadDefinitions() {
    const response = await fetch('/data/planning/epi-2006-155a_2024-12-14_definitions.csv');
    const text = await response.text();
    
    // Sanitize the text
    const sanitizedText = text
      .replace(/^\uFEFF/, '') // Remove BOM if present
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/\u2013|\u2014/g, '-'); // Replace em/en dashes
    
    return sanitizedText;
  }
  
  const definitions: Record<string, string> = {};
  
  // Initialize definitions
  loadDefinitions().then(csv => {
    csv.split('\n').forEach((line, index) => {
      if (index === 0) return; // Skip header
      const [term, landUse, definition] = parseCSVLine(line);
      if (term && definition) {
        // Remove any remaining quotes and normalize whitespace
        definitions[term.toLowerCase()] = definition
          .replace(/^"?|"?$/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    });
    console.log('Parsed definitions:', definitions);
  });
  
  export function getPlanningDefinition(term: string): string | undefined {
    console.log('Looking up definition for:', term);
    
    // Normalize the search term
    const normalizedSearch = term.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b(places|place)\b/g, 'place')
      .replace(/\bof\b/g, 'of')
      .replace(/ies\b/g, 'y')
      .replace(/s\b/g, '');
    
    // Find the closest matching key
    const matchingKey = Object.keys(definitions).find(key => {
      const normalizedKey = key.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\b(places|place)\b/g, 'place')
        .replace(/\bof\b/g, 'of')
        .replace(/ies\b/g, 'y')
        .replace(/s\b/g, '');
        
      return normalizedKey === normalizedSearch;
    });

    const definition = matchingKey ? definitions[matchingKey] : undefined;
    console.log('Found definition:', definition);
    return definition;
  }
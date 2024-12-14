interface PlanningDefinitions {
    [key: string]: string;
  }
  
  // Use fetch to get the CSV content
  async function loadDefinitions() {
    const response = await fetch('/data/planning/epi-2006-155a_2024-12-14_definitions.csv');
    const text = await response.text();
    return text;
  }
  
  const definitions: Record<string, string> = {};
  
  // Initialize definitions
  loadDefinitions().then(csv => {
    csv.split('\n').forEach((line, index) => {
      if (index === 0) return; // Skip header
      const [term, , definition] = line.split(',');
      if (term && definition) {
        definitions[term.toLowerCase()] = definition.replace(/^"|"$/g, '');
      }
    });
  });
  
  export function getPlanningDefinition(term: string): string | undefined {
    return definitions[term.toLowerCase()];
  }
import PptxGenJS from 'pptxgenjs';
import { PropertyData } from '@/types/property';
import { ScreenshotType, captureMapScreenshot, captureZoningMap, captureFSRMap, captureHOBMap } from './map-screenshot';

/**
 * Add a cover slide to the presentation
 * 
 * @param pptx PptxGenJS instance
 * @param propertyData Property data
 * @param mapScreenshot Map screenshot (optional)
 */
export const addCoverSlide = (
  pptx: PptxGenJS, 
  propertyData: PropertyData, 
  mapScreenshot?: string
) => {
  const slide = pptx.addSlide();
  
  // Add title
  slide.addText("Property Analysis Report", {
    x: 0.5,
    y: 1.0,
    w: 8.5,
    h: 1.0,
    fontSize: 36,
    bold: true,
    align: 'center'
  });
  
  // Add property address
  slide.addText(propertyData.propertyAddress || "Property Analysis", {
    x: 0.5,
    y: 2.2,
    w: 8.5,
    h: 0.8,
    fontSize: 28,
    align: 'center',
    color: '0088CC'
  });
  
  // Add date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  slide.addText(`Generated on ${dateStr}`, {
    x: 0.5,
    y: 3.2,
    w: 8.5,
    h: 0.5,
    fontSize: 16,
    align: 'center',
    color: '666666'
  });
  
  // Add map screenshot if available
  if (mapScreenshot) {
    slide.addImage({
      data: mapScreenshot,
      x: 2.0,
      y: 4.0,
      w: 5.5,
      h: 3.5
    });
  }
  
  // Add footer with logo
  slide.addText("Nexus Analytics", {
    x: 0.5,
    y: 7.3,
    w: 8.5,
    h: 0.3,
    fontSize: 12,
    align: 'center',
    color: '888888'
  });
  
  return slide;
};

/**
 * Add a property overview slide to the presentation
 * 
 * @param pptx PptxGenJS instance
 * @param propertyData Property data
 * @param mapScreenshot Map screenshot (optional)
 */
export const addPropertyOverviewSlide = (
  pptx: PptxGenJS, 
  propertyData: PropertyData, 
  mapScreenshot?: string
) => {
  const slide = pptx.addSlide();
  
  // Add title
  slide.addText("Property Overview", {
    x: 0.5,
    y: 0.5,
    w: 8.5,
    h: 0.8,
    fontSize: 24,
    bold: true
  });
  
  // Property details table
  const tableData = [
    [{ text: 'Property Information', options: { bold: true, fill: 'E0E0E0', colSpan: 2 } }],
    ['Address', propertyData.propertyAddress || 'N/A'],
    ['Local Government Area', propertyData.lgaName || 'N/A'],
    ['Land Size', propertyData.area ? `${propertyData.area.toLocaleString('en-AU', { maximumFractionDigits: 0 })} m²` : 'N/A'],
    ['Minimum Width', propertyData.width ? `${Math.round(propertyData.width).toLocaleString('en-AU')}m` : 'N/A'],
    ['Lot/DP', propertyData.cadastre?.lots?.[0] || 'N/A']
  ];
  
  slide.addTable(tableData, {
    x: 0.5,
    y: 1.5,
    w: 4.0,
    colW: [2.0, 2.0],
    border: { type: 'solid', pt: 1, color: 'CFCFCF' }
  });
  
  // Add map screenshot if available
  if (mapScreenshot) {
    slide.addImage({
      data: mapScreenshot,
      x: 5.0,
      y: 1.5,
      w: 4.0,
      h: 3.0
    });
  }
  
  return slide;
};

/**
 * Add a planning controls slide to the presentation
 * 
 * @param pptx PptxGenJS instance
 * @param propertyData Property data
 * @param zoningScreenshot Zoning map screenshot (optional)
 * @param fsrScreenshot FSR map screenshot (optional)
 * @param hobScreenshot HOB map screenshot (optional)
 */
export const addPlanningSlide = (
  pptx: PptxGenJS, 
  propertyData: PropertyData, 
  zoningScreenshot?: string,
  fsrScreenshot?: string,
  hobScreenshot?: string
) => {
  const slide = pptx.addSlide();
  
  // Add title
  slide.addText("Planning Controls", {
    x: 0.5,
    y: 0.5,
    w: 8.5,
    h: 0.8,
    fontSize: 24,
    bold: true
  });
  
  // Planning information table
  const tableData = [
    [{ text: 'Planning Information', options: { bold: true, fill: 'E0E0E0', colSpan: 2 } }],
    ['Land Zone', propertyData.zoneInfo || 'N/A'],
    ['Floor Space Ratio', propertyData.floorSpaceRatio || 'N/A'],
    ['Height of Building', propertyData.maxHeight || 'N/A'],
    ['Minimum Lot Size', propertyData.minLotSize || 'N/A'],
    ['Heritage', propertyData.heritage && propertyData.heritage.length > 0 ? 'Yes' : 'No']
  ];
  
  slide.addTable(tableData, {
    x: 0.5,
    y: 1.5,
    w: 4.0,
    colW: [2.0, 2.0],
    border: { type: 'solid', pt: 1, color: 'CFCFCF' }
  });
  
  // Add zoning map if available
  if (zoningScreenshot) {
    slide.addText("Zoning", {
      x: 5.0,
      y: 1.5,
      w: 4.0,
      h: 0.3,
      fontSize: 14,
      bold: true
    });
    
    slide.addImage({
      data: zoningScreenshot,
      x: 5.0,
      y: 1.9,
      w: 4.0,
      h: 2.5
    });
  }
  
  // Add FSR and HOB maps in a smaller format
  const smallMapWidth = 2.0;
  const smallMapHeight = 1.5;
  
  if (fsrScreenshot) {
    slide.addText("Floor Space Ratio", {
      x: 0.5,
      y: 4.5,
      w: smallMapWidth,
      h: 0.3,
      fontSize: 10,
      bold: true
    });
    
    slide.addImage({
      data: fsrScreenshot,
      x: 0.5,
      y: 4.8,
      w: smallMapWidth,
      h: smallMapHeight
    });
  }
  
  if (hobScreenshot) {
    slide.addText("Height of Building", {
      x: 3.0,
      y: 4.5,
      w: smallMapWidth,
      h: 0.3,
      fontSize: 10,
      bold: true
    });
    
    slide.addImage({
      data: hobScreenshot,
      x: 3.0,
      y: 4.8,
      w: smallMapWidth,
      h: smallMapHeight
    });
  }
  
  return slide;
};

/**
 * Add a scoring summary slide to the presentation
 * 
 * @param pptx PptxGenJS instance
 * @param propertyData Property data
 * @param scores Category scores
 * @param overallScore Overall property score
 */
export const addScoringSlide = (
  pptx: PptxGenJS, 
  propertyData: PropertyData, 
  scores: Record<string, number>,
  overallScore: number
) => {
  const slide = pptx.addSlide();
  
  // Add title
  slide.addText("Property Scoring Summary", {
    x: 0.5,
    y: 0.5,
    w: 8.5,
    h: 0.8,
    fontSize: 24,
    bold: true
  });
  
  // Add overall score as a big number
  slide.addText(`${overallScore}`, {
    x: 0.5,
    y: 1.5,
    w: 2.0,
    h: 2.0,
    fontSize: 72,
    bold: true,
    color: getScoreColor(overallScore),
    align: 'center'
  });
  
  slide.addText('Overall Score', {
    x: 0.5,
    y: 3.5,
    w: 2.0,
    h: 0.5,
    fontSize: 16,
    align: 'center'
  });
  
  // Generate table data for category scores
  const tableData: any[][] = [
    [
      { text: 'Category', options: { bold: true, fill: 'E0E0E0' } },
      { text: 'Weight', options: { bold: true, fill: 'E0E0E0' } },
      { text: 'Score', options: { bold: true, fill: 'E0E0E0' } }
    ]
  ];
  
  // Add category scores to the table
  // This would typically come from the scoring configuration
  // Here we're just showing a sample of what it might look like
  Object.entries(scores).forEach(([category, score]) => {
    tableData.push([
      category,
      '20%', // This would be the actual weight from the scoring config
      { text: `${score}`, options: { bold: true, color: getScoreColor(score) } }
    ]);
  });
  
  slide.addTable(tableData, {
    x: 3.0,
    y: 1.5,
    w: 6.0,
    h: 3.0,
    colW: [3.0, 1.5, 1.5],
    border: { type: 'solid', pt: 1, color: 'CFCFCF' }
  });
  
  return slide;
};

/**
 * Get the color for a score display
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return '008800'; // Green
  if (score >= 65) return '888800'; // Yellow
  return 'CC0000'; // Red
};

/**
 * Generate a complete property report presentation
 * 
 * @param pptx PptxGenJS instance
 * @param propertyData Property data
 * @param mapInstance Map instance for capturing screenshots
 * @param reportOptions Report generation options
 */
export const generatePropertyReport = async (
  propertyData: PropertyData,
  mapInstance: any,
  reportOptions: {
    includeOverview: boolean;
    includePlanning: boolean;
    includeScoring: boolean;
    scores?: Record<string, number>;
    overallScore?: number;
  }
) => {
  // Create new presentation
  const pptx = new PptxGenJS();
  
  // Set global presentation options
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Nexus Analytics';
  pptx.subject = 'Property Analysis Report';
  pptx.title = `Property Report - ${propertyData.propertyAddress || 'Analysis'}`;
  
  // Capture base map screenshot for cover slide
  const coverScreenshot = await captureMapScreenshot(mapInstance, ScreenshotType.BASE, true);
  
  // Add cover slide
  addCoverSlide(pptx, propertyData, coverScreenshot);
  
  // Add property overview slide if requested
  if (reportOptions.includeOverview) {
    const overviewScreenshot = await captureMapScreenshot(mapInstance, ScreenshotType.AERIAL, true);
    addPropertyOverviewSlide(pptx, propertyData, overviewScreenshot);
  }
  
  // Add planning slide if requested
  if (reportOptions.includePlanning) {
    const zoningScreenshot = await captureZoningMap(mapInstance);
    const fsrScreenshot = await captureFSRMap(mapInstance);
    const hobScreenshot = await captureHOBMap(mapInstance);
    
    addPlanningSlide(pptx, propertyData, zoningScreenshot, fsrScreenshot, hobScreenshot);
  }
  
  // Add scoring slide if requested
  if (reportOptions.includeScoring && reportOptions.scores && reportOptions.overallScore) {
    addScoringSlide(pptx, propertyData, reportOptions.scores, reportOptions.overallScore);
  }
  
  // Write the file
  await pptx.writeFile({ 
    fileName: `Nexus_Property_Report_${propertyData.propertyAddress?.replace(/[^a-z0-9]/gi, '_') || 'Analysis'}_${new Date().toISOString().split('T')[0]}.pptx` 
  });
  
  return pptx;
}; 
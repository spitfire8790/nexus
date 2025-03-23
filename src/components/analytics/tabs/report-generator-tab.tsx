import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileDown,
  Save,
  Plus,
  Settings,
  Lock,
  FileCog,
  BarChart,
  Home,
  Building,
  Map,
  Check,
  X,
  Loader2
} from 'lucide-react';
import PptxGenJS from 'pptxgenjs';
import { useMapStore } from '@/lib/map-store';
import { usePropertyDataStore } from '@/lib/property-data-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import { PropertyData } from '@/types/property';
import { 
  captureMapScreenshot, 
  captureZoningMap, 
  captureFSRMap, 
  captureHOBMap, 
  captureHeritageMap, 
  captureContourMap, 
  captureAerialMap,
  ScreenshotType
} from '../utils/map-screenshot';
import {
  addCoverSlide,
  addPropertyOverviewSlide,
  addPlanningSlide,
  addScoringSlide,
  generatePropertyReport,
  getScoreColor
} from '../utils/slide-generators';

// Types
interface ScoringCriteria {
  id: string;
  name: string;
  weight: number;
  enabled: boolean;
  description: string;
}

interface ScoringCategory {
  id: string;
  name: string;
  criteria: ScoringCriteria[];
  weight: number;
  enabled: boolean;
}

interface ScoringTemplate {
  id?: string;
  name: string;
  categories: ScoringCategory[];
  userId?: string;
  createdAt?: string;
  overallScore?: number;
}

interface ReportContent {
  includeOverview: boolean;
  includePlanning: boolean;
  includeZoning: boolean;
  includeSiteAnalysis: boolean;
  includeNeighborhood: boolean;
  includeSalesHistory: boolean;
  includeAmenities: boolean;
  includeDemographics: boolean;
  includeMarketAnalysis: boolean;
  includeTransportation: boolean;
  includeScoringSummary: boolean;
}

// Progress tracking
interface GenerationProgress {
  status: 'idle' | 'preparing' | 'capturing' | 'generating' | 'completed' | 'failed';
  step: string;
  progress: number;
  message: string;
}

// Default scoring template
const defaultScoringTemplate: ScoringTemplate = {
  name: "Default Scoring",
  categories: [
    {
      id: "location",
      name: "Location",
      weight: 25,
      enabled: true,
      criteria: [
        { id: "proximity_cbd", name: "Proximity to CBD", weight: 30, enabled: true, description: "Distance to central business district" },
        { id: "transport_access", name: "Public Transport Access", weight: 25, enabled: true, description: "Access to buses, trains, etc." },
        { id: "schools_nearby", name: "Schools Nearby", weight: 15, enabled: true, description: "Quality and proximity of schools" },
        { id: "shopping_nearby", name: "Shopping Nearby", weight: 15, enabled: true, description: "Access to retail and commercial areas" },
        { id: "neighborhood_quality", name: "Neighborhood Quality", weight: 15, enabled: true, description: "Overall neighborhood desirability" }
      ]
    },
    {
      id: "planning",
      name: "Planning Controls",
      weight: 25,
      enabled: true,
      criteria: [
        { id: "zoning", name: "Zoning", weight: 30, enabled: true, description: "Land use zoning permissibility" },
        { id: "fsr", name: "Floor Space Ratio", weight: 25, enabled: true, description: "Maximum allowable floor space ratio" },
        { id: "height", name: "Building Height", weight: 20, enabled: true, description: "Maximum height limits" },
        { id: "min_lot_size", name: "Minimum Lot Size", weight: 15, enabled: true, description: "Lot size requirements" },
        { id: "overlay_restrictions", name: "Overlay Restrictions", weight: 10, enabled: true, description: "Additional planning controls" }
      ]
    },
    {
      id: "property",
      name: "Property Characteristics",
      weight: 20,
      enabled: true,
      criteria: [
        { id: "land_size", name: "Land Size", weight: 25, enabled: true, description: "Total land area" },
        { id: "street_frontage", name: "Street Frontage", weight: 20, enabled: true, description: "Width of street frontage" },
        { id: "property_shape", name: "Property Shape", weight: 15, enabled: true, description: "Regular or irregular shape" },
        { id: "topography", name: "Topography", weight: 15, enabled: true, description: "Flat vs. sloping land" },
        { id: "aspect", name: "Aspect/Orientation", weight: 15, enabled: true, description: "Solar orientation" },
        { id: "site_access", name: "Site Access", weight: 10, enabled: true, description: "Access to the property" }
      ]
    },
    {
      id: "market",
      name: "Market Conditions",
      weight: 15,
      enabled: true,
      criteria: [
        { id: "price_trends", name: "Price Trends", weight: 35, enabled: true, description: "Historical price movement" },
        { id: "days_on_market", name: "Days on Market", weight: 20, enabled: true, description: "Average selling time" },
        { id: "supply_demand", name: "Supply/Demand", weight: 25, enabled: true, description: "Market supply vs demand" },
        { id: "development_activity", name: "Development Activity", weight: 20, enabled: true, description: "Construction in the area" }
      ]
    },
    {
      id: "risks",
      name: "Risk Assessment",
      weight: 15,
      enabled: true,
      criteria: [
        { id: "environmental", name: "Environmental Constraints", weight: 35, enabled: true, description: "Flooding, bushfire, etc." },
        { id: "heritage", name: "Heritage Constraints", weight: 25, enabled: true, description: "Heritage listings/overlays" },
        { id: "easements", name: "Easements/Encumbrances", weight: 20, enabled: true, description: "Legal constraints on land" },
        { id: "site_contamination", name: "Contamination Risk", weight: 20, enabled: true, description: "Environmental contamination" }
      ]
    }
  ]
};

// Default report content settings
const defaultReportContent: ReportContent = {
  includeOverview: true,
  includePlanning: true,
  includeZoning: true,
  includeSiteAnalysis: true,
  includeNeighborhood: true,
  includeSalesHistory: true,
  includeAmenities: true,
  includeDemographics: true, 
  includeMarketAnalysis: true,
  includeTransportation: true,
  includeScoringSummary: true
};

export function ReportGeneratorTab() {
  const [scoringTemplate, setScoringTemplate] = useState<ScoringTemplate>(defaultScoringTemplate);
  const [reportContent, setReportContent] = useState<ReportContent>(defaultReportContent);
  const [templates, setTemplates] = useState<ScoringTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [activeTab, setActiveTab] = useState("scoring");
  const [calculatedScores, setCalculatedScores] = useState<Record<string, number>>({});
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    status: 'idle',
    step: '',
    progress: 0,
    message: ''
  });
  
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const mapInstance = useMapStore((state) => state.mapInstance);
  const propertyData = usePropertyDataStore((state) => state.propertyData);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedProperty && propertyData) {
      calculateScores();
    }
  }, [selectedProperty, propertyData, scoringTemplate]);

  const loadTemplates = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('scoring_templates')
        .select('*')
        .eq('user_id', user.user.id);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplate = async () => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const templateData = {
        name: newTemplateName || scoringTemplate.name,
        categories: scoringTemplate.categories,
        user_id: user.user.id,
        created_at: new Date().toISOString(),
        overall_score: overallScore
      };

      const { data, error } = await supabase
        .from('scoring_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      
      await loadTemplates();
      setIsSaveDialogOpen(false);
      setNewTemplateName("");
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = (template: ScoringTemplate) => {
    setScoringTemplate(template);
  };

  const updateCategoryWeight = (categoryId: string, weight: number) => {
    setScoringTemplate(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === categoryId ? { ...category, weight } : category
      )
    }));
  };

  const updateCategoryEnabled = (categoryId: string, enabled: boolean) => {
    setScoringTemplate(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === categoryId ? { ...category, enabled } : category
      )
    }));
  };

  const updateCriteriaWeight = (categoryId: string, criteriaId: string, weight: number) => {
    setScoringTemplate(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              criteria: category.criteria.map(criteria =>
                criteria.id === criteriaId ? { ...criteria, weight } : criteria
              )
            }
          : category
      )
    }));
  };

  const updateCriteriaEnabled = (categoryId: string, criteriaId: string, enabled: boolean) => {
    setScoringTemplate(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              criteria: category.criteria.map(criteria =>
                criteria.id === criteriaId ? { ...criteria, enabled } : criteria
              )
            }
          : category
      )
    }));
  };

  const calculateScores = () => {
    if (!propertyData) return;
    
    const scores: Record<string, number> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    // Helper function to calculate criteria score
    const calculateCriteriaScore = (categoryId: string, criteriaId: string) => {
      // In a real implementation, we would calculate scores based on property data
      // For now, we'll use a mix of real data where available and simulated scores
      
      // Check for specific criteria we can score based on real data
      if (categoryId === 'property' && criteriaId === 'land_size' && propertyData.area) {
        // Score based on land size - larger is better, scale from 60-95
        const sizeScore = Math.min(95, Math.max(60, 60 + (propertyData.area / 2000) * 35));
        return Math.round(sizeScore);
      }
      
      if (categoryId === 'property' && criteriaId === 'street_frontage' && propertyData.width) {
        // Score based on street frontage - wider is better, scale from 60-95
        const frontageScore = Math.min(95, Math.max(60, 60 + (propertyData.width / 50) * 35));
        return Math.round(frontageScore);
      }
      
      if (categoryId === 'planning' && criteriaId === 'zoning' && propertyData.zoneInfo) {
        // Score based on zoning - residential zones generally score higher
        const zoneText = propertyData.zoneInfo.toLowerCase();
        if (zoneText.includes('r4') || zoneText.includes('high density')) return 90;
        if (zoneText.includes('r3') || zoneText.includes('medium density')) return 85;
        if (zoneText.includes('r2') || zoneText.includes('low density')) return 80;
        if (zoneText.includes('r1') || zoneText.includes('general residential')) return 75;
        if (zoneText.includes('business') || zoneText.includes('b')) return 85;
        if (zoneText.includes('industrial') || zoneText.includes('in')) return 70;
        return 65; // Default for other zones
      }
      
      // For criteria we don't have specific data for, generate a reasonable random score
      // We use a predictable random based on criteria ID to keep scores consistent
      const hash = criteriaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const pseudoRandom = (hash % 35) + 60; // Range 60-95
      return pseudoRandom;
    };
    
    scoringTemplate.categories.forEach(category => {
      if (!category.enabled) return;
      
      let categoryScore = 0;
      let categoryTotalWeight = 0;
      
      category.criteria.forEach(criteria => {
        if (!criteria.enabled) return;
        
        const criteriaScore = calculateCriteriaScore(category.id, criteria.id);
        scores[`${category.id}_${criteria.id}`] = criteriaScore;
        
        categoryScore += criteriaScore * (criteria.weight / 100);
        categoryTotalWeight += criteria.weight;
      });
      
      // Calculate normalized category score
      const normalizedCategoryScore = categoryTotalWeight > 0 
        ? categoryScore / (categoryTotalWeight / 100) 
        : 0;
      
      scores[category.id] = Math.round(normalizedCategoryScore);
      
      totalWeightedScore += normalizedCategoryScore * (category.weight / 100);
      totalWeight += category.enabled ? category.weight : 0;
    });
    
    const calculatedOverallScore = totalWeight > 0 
      ? Math.round(totalWeightedScore / (totalWeight / 100)) 
      : 0;
    
    setCalculatedScores(scores);
    setOverallScore(calculatedOverallScore);
  };

  const generatePowerPoint = async () => {
    if (!selectedProperty || !mapInstance) return;
    
    try {
      setIsLoading(true);
      setGenerationProgress({
        status: 'preparing',
        step: 'initialization',
        progress: 5,
        message: "Preparing to generate PowerPoint..."
      });
      
      // Convert property data from the store to our PropertyData type
      const formattedPropertyData: PropertyData = {
        propertyAddress: propertyData?.propertyAddress || selectedProperty.address,
        lgaName: propertyData?.lgaName,
        area: propertyData?.area,
        width: propertyData?.width,
        zoneInfo: propertyData?.zoneInfo,
        floorSpaceRatio: propertyData?.floorSpaceRatio,
        maxHeight: propertyData?.maxHeight,
        minLotSize: propertyData?.minLotSize,
        heritage: propertyData?.heritage,
        cadastre: {
          lots: selectedProperty.cadastre?.lots
        },
        coordinates: selectedProperty.coordinates
      };
      
      // Create PptxGenJS instance
      const pptx = new PptxGenJS();
      
      // Set presentation properties
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'Nexus Analytics';
      pptx.subject = 'Property Analysis Report';
      pptx.title = `Property Report - ${formattedPropertyData.propertyAddress || 'Analysis'}`;
      
      // Start capturing screenshots
      setGenerationProgress({
        status: 'capturing',
        step: 'screenshots',
        progress: 10,
        message: "Capturing map screenshots..."
      });
      
      // Create a collection of promises to capture screenshots in parallel
      const screenshotPromises = [];
      
      // Base screenshot for cover
      screenshotPromises.push(
        captureMapScreenshot(mapInstance, ScreenshotType.BASE, true)
          .then(screenshot => ({ type: 'cover', data: screenshot }))
      );
      
      if (reportContent.includeOverview) {
        screenshotPromises.push(
          captureAerialMap(mapInstance, true)
            .then(screenshot => ({ type: 'aerial', data: screenshot }))
        );
      }
      
      if (reportContent.includePlanning) {
        screenshotPromises.push(
          captureZoningMap(mapInstance)
            .then(screenshot => ({ type: 'zoning', data: screenshot }))
        );
        
        screenshotPromises.push(
          captureFSRMap(mapInstance)
            .then(screenshot => ({ type: 'fsr', data: screenshot }))
        );
        
        screenshotPromises.push(
          captureHOBMap(mapInstance)
            .then(screenshot => ({ type: 'hob', data: screenshot }))
        );
        
        screenshotPromises.push(
          captureHeritageMap(mapInstance)
            .then(screenshot => ({ type: 'heritage', data: screenshot }))
        );
      }
      
      if (reportContent.includeSiteAnalysis) {
        screenshotPromises.push(
          captureContourMap(mapInstance)
            .then(screenshot => ({ type: 'contour', data: screenshot }))
        );
      }
      
      // Wait for all screenshots to be captured
      setGenerationProgress({
        status: 'capturing',
        step: 'screenshots',
        progress: 30,
        message: "Processing screenshots..."
      });
      
      const screenshots = await Promise.all(screenshotPromises);
      
      // Store screenshots in an object for easy access
      const screenshotMap: Record<string, string> = {};
      screenshots.forEach(screenshot => {
        screenshotMap[screenshot.type] = screenshot.data;
      });
      
      // Generate slides
      setGenerationProgress({
        status: 'generating',
        step: 'slides',
        progress: 60,
        message: "Generating slides..."
      });
      
      // Add cover slide
      addCoverSlide(pptx, formattedPropertyData, screenshotMap.cover);
      
      // Add property overview slide if requested
      if (reportContent.includeOverview) {
        addPropertyOverviewSlide(pptx, formattedPropertyData, screenshotMap.aerial);
      }
      
      // Add planning slide if requested
      if (reportContent.includePlanning) {
        addPlanningSlide(
          pptx, 
          formattedPropertyData, 
          screenshotMap.zoning,
          screenshotMap.fsr,
          screenshotMap.hob
        );
      }
      
      // Add scoring slide if requested
      if (reportContent.includeScoringSummary && overallScore !== null) {
        addScoringSlide(pptx, formattedPropertyData, calculatedScores, overallScore);
      }
      
      // Add category detail slides if scoring is included
      if (reportContent.includeScoringSummary && overallScore !== null) {
        scoringTemplate.categories.forEach(category => {
          if (!category.enabled) return;
          
          const categoryScore = calculatedScores[category.id] || 0;
          
          const slide = pptx.addSlide();
          
          // Add title
          slide.addText(category.name, {
            x: 0.5,
            y: 0.5,
            w: 8.5,
            h: 0.8,
            fontSize: 24,
            bold: true
          });
          
          slide.addText(`Score: ${categoryScore}/100`, {
            x: 0.5,
            y: 1.3,
            w: 8.5,
            h: 0.5,
            fontSize: 18,
            bold: true,
            color: getScoreColor(categoryScore)
          });
          
          // Add criteria table
          const criteriaTableData: any[][] = [
            [
              { text: 'Criteria', options: { bold: true, fill: 'E0E0E0' } }, 
              { text: 'Weight', options: { bold: true, fill: 'E0E0E0' } }, 
              { text: 'Score', options: { bold: true, fill: 'E0E0E0' } },
              { text: 'Notes', options: { bold: true, fill: 'E0E0E0' } }
            ]
          ];
          
          category.criteria.forEach(criteria => {
            if (!criteria.enabled) return;
            
            const criteriaKey = `${category.id}_${criteria.id}`;
            criteriaTableData.push([
              criteria.name,
              `${criteria.weight}%`,
              { 
                text: `${calculatedScores[criteriaKey] || 'N/A'}`, 
                options: {
                  bold: true,
                  color: getScoreColor(calculatedScores[criteriaKey] || 0)
                }
              },
              criteria.description
            ]);
          });
          
          slide.addTable(criteriaTableData, { 
            x: 0.5,
            y: 2.0,
            w: 8.5,
            colW: [2.5, 1.0, 1.0, 4.0],
            border: { type: 'solid', pt: 1, color: 'CFCFCF' }
          });
        });
      }
      
      // Write the file
      setGenerationProgress({
        status: 'generating',
        step: 'export',
        progress: 90,
        message: "Finalizing presentation..."
      });
      
      await pptx.writeFile({ 
        fileName: `Nexus_Property_Report_${formattedPropertyData.propertyAddress?.replace(/[^a-z0-9]/gi, '_') || 'Analysis'}_${new Date().toISOString().split('T')[0]}.pptx` 
      });
      
      setGenerationProgress({
        status: 'completed',
        step: 'complete',
        progress: 100,
        message: "Report generation complete!"
      });
      
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      setGenerationProgress({
        status: 'failed',
        step: 'error',
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    } finally {
      setIsLoading(false);
      
      // Reset progress after a delay
      setTimeout(() => {
        if (generationProgress.status === 'completed' || generationProgress.status === 'failed') {
          setGenerationProgress({
            status: 'idle',
            step: '',
            progress: 0,
            message: ''
          });
        }
      }, 5000);
    }
  };

  // Helper function to calculate score color for UI display
  const getScoreClass = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Property Report Generator</h2>
          <p className="text-muted-foreground">Create customized property analysis reports with scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
          <Button 
            onClick={generatePowerPoint}
            disabled={isLoading || !selectedProperty || !mapInstance}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {isLoading && (
        <Card className="p-4 mb-6">
          <div className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="mb-2">{generationProgress.message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-md">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${generationProgress.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {generationProgress.status === 'capturing' ? 'Capturing screenshots...' : 
               generationProgress.status === 'generating' ? 'Generating slides...' : 
               'Processing...'}
            </p>
          </div>
        </Card>
      )}

      {generationProgress.status === 'completed' && (
        <Card className="p-4 mb-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-center p-4">
            <Check className="h-6 w-6 text-green-600 mr-2" />
            <p className="text-green-800">Report generated successfully!</p>
          </div>
        </Card>
      )}

      {generationProgress.status === 'failed' && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-center p-4">
            <X className="h-6 w-6 text-red-600 mr-2" />
            <p className="text-red-800">{generationProgress.message}</p>
          </div>
        </Card>
      )}

      {overallScore !== null && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 rounded-full p-6 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreClass(overallScore)}`}>
                  {overallScore}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Overall Property Score</h3>
                <p className="text-muted-foreground">Based on your selected criteria and weights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="scoring">
            <FileCog className="mr-2 h-4 w-4" />
            Scoring Configuration
          </TabsTrigger>
          <TabsTrigger value="content">
            <Settings className="mr-2 h-4 w-4" />
            Report Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-4">
          {scoringTemplate.categories.map(category => (
            <Card key={category.id} className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={category.enabled}
                      onCheckedChange={(checked) => updateCategoryEnabled(category.id, checked)}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Weight: {category.weight}%</span>
                    <div className="w-32">
                      <Slider 
                        value={[category.weight]} 
                        min={0} 
                        max={100} 
                        step={5}
                        disabled={!category.enabled}
                        onValueChange={(value) => updateCategoryWeight(category.id, value[0])}
                      />
                    </div>
                  </div>
                </div>
                {calculatedScores[category.id] && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm mr-2">Score:</span>
                    <span className={`font-semibold ${getScoreClass(calculatedScores[category.id])}`}>
                      {calculatedScores[category.id]}/100
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.criteria.map(criteria => (
                    <div key={criteria.id} className="flex items-center justify-between py-1 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={criteria.enabled}
                          onCheckedChange={(checked) => updateCriteriaEnabled(category.id, criteria.id, checked)}
                          disabled={!category.enabled}
                        />
                        <div>
                          <div className="font-medium">{criteria.name}</div>
                          <div className="text-xs text-muted-foreground">{criteria.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{criteria.weight}%</span>
                        <div className="w-20">
                          <Slider 
                            value={[criteria.weight]} 
                            min={0} 
                            max={100} 
                            step={5}
                            disabled={!category.enabled || !criteria.enabled}
                            onValueChange={(value) => updateCriteriaWeight(category.id, criteria.id, value[0])}
                          />
                        </div>
                        {calculatedScores[`${category.id}_${criteria.id}`] && (
                          <span className={`text-sm font-semibold ml-2 ${getScoreClass(calculatedScores[`${category.id}_${criteria.id}`])}`}>
                            {calculatedScores[`${category.id}_${criteria.id}`]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Content Selection</CardTitle>
              <CardDescription>Select which sections to include in your PowerPoint report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeOverview" 
                    checked={reportContent.includeOverview}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeOverview: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeOverview" className="text-sm font-medium">
                      Property Overview
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Basic property information and map
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includePlanning" 
                    checked={reportContent.includePlanning}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includePlanning: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includePlanning" className="text-sm font-medium">
                      Planning Controls
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Zoning and development controls
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeSiteAnalysis" 
                    checked={reportContent.includeSiteAnalysis}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeSiteAnalysis: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeSiteAnalysis" className="text-sm font-medium">
                      Site Analysis
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Detailed site characteristics
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeNeighborhood" 
                    checked={reportContent.includeNeighborhood}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeNeighborhood: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeNeighborhood" className="text-sm font-medium">
                      Neighborhood Analysis
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Surrounding area assessment
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeSalesHistory" 
                    checked={reportContent.includeSalesHistory}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeSalesHistory: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeSalesHistory" className="text-sm font-medium">
                      Sales History
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Historical sales data
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeAmenities" 
                    checked={reportContent.includeAmenities}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeAmenities: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeAmenities" className="text-sm font-medium">
                      Nearby Amenities
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Schools, shops, and services
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeDemographics" 
                    checked={reportContent.includeDemographics}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeDemographics: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeDemographics" className="text-sm font-medium">
                      Demographics
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Population and demographic data
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeMarketAnalysis" 
                    checked={reportContent.includeMarketAnalysis}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeMarketAnalysis: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeMarketAnalysis" className="text-sm font-medium">
                      Market Analysis
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Price trends and market conditions
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeScoringSummary" 
                    checked={reportContent.includeScoringSummary}
                    onCheckedChange={(checked) => 
                      setReportContent(prev => ({ ...prev, includeScoringSummary: !!checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeScoringSummary" className="text-sm font-medium">
                      Scoring Summary
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Property scoring analysis
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <CardTitle className="text-base mb-2">Restricted Content</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Flood Hazard Maps</span>
                    <X className="h-4 w-4 ml-2 text-red-500" />
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Geoscape Data</span>
                    <X className="h-4 w-4 ml-2 text-red-500" />
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">UDPL Information</span>
                    <X className="h-4 w-4 ml-2 text-red-500" />
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">GPR Analysis</span>
                    <X className="h-4 w-4 ml-2 text-red-500" />
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Utility Infrastructure (Water/Sewer/Power)</span>
                    <X className="h-4 w-4 ml-2 text-red-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Template Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Scoring Template</DialogTitle>
            <DialogDescription>
              Save your current scoring configuration for future use
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="My Custom Scoring Template"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
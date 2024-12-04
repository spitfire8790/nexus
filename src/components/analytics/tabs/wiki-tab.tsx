import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import L from 'leaflet';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { BookOpen } from 'lucide-react';
import * as turf from '@turf/turf';

interface WikiArticle {
  title: string;
  distance: number;
  lat: number;
  lon: number;
  summary?: string;
  url: string;
  thumbnail?: string;
  categories?: string[];
  elevation?: number;
  country?: string;
}

const ON_PROPERTY_THRESHOLD = 0;
const NEARBY_THRESHOLD = 1000;

const ensureMapPanes = (map: L.Map) => {
  if (!map.getPane('wiki-pane')) {
    map.createPane('wiki-pane');
    map.getPane('wiki-pane')!.style.zIndex = '1000';
  }
  if (!map.getPane('wiki-popup-pane')) {
    map.createPane('wiki-popup-pane');
    map.getPane('wiki-popup-pane')!.style.zIndex = '1001';
  }
};

const createWikiIcon = () => {
  const svg = document.createElement('div');
  svg.innerHTML = `
    <div class="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-md border-2 border-black">
      <span class="text-[16px] font-serif font-bold text-black">W</span>
    </div>
  `;

  return L.divIcon({
    html: svg.innerHTML,
    className: 'wiki-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .wiki-marker-icon {
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    padding: 4px;
  }
`;
document.head.appendChild(styleSheet);

const isArticleWithinProperty = (article: WikiArticle, propertyGeometry: any) => {
  const points = propertyGeometry.rings[0].map((coord: number[]) => [
    coord[0] * 180 / 20037508.34,
    Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
  ]);
  const polygon = turf.polygon([points]);
  const point = turf.point([article.lon, article.lat]);
  
  return turf.booleanPointInPolygon(point, polygon);
};

export function WikiTab() {
  const map = useMapStore((state) => state.mapInstance);
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [isShowingOnMap, setIsShowingOnMap] = useState(false);
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const wikiLayerRef = useRef<any>(null);

  const handleArticleClick = (article: WikiArticle) => {
    if (!map) return;
    
    // Center map on article location
    map.setView([article.lat, article.lon], 17);
    
    // Find and open the corresponding marker's popup
    wikiLayerRef.current?.forEach((marker: L.Marker) => {
      const markerLatLng = marker.getLatLng();
      if (markerLatLng.lat === article.lat && markerLatLng.lng === article.lon) {
        marker.openPopup();
      }
    });
  };

  useEffect(() => {
    if (!selectedProperty?.geometry || !map) return;

    setLoading(true);
    setArticles([]);
    
    // Clean up existing markers
    if (wikiLayerRef.current) {
      wikiLayerRef.current.forEach((marker: L.Marker) => marker.remove());
      wikiLayerRef.current = null;
    }
    setIsShowingOnMap(false);

    const rings = selectedProperty.geometry.rings[0];
    const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
    const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

    // Convert Web Mercator to Lat/Lng
    const lng = (centerX * 180) / 20037508.34;
    const lat = (Math.atan(Math.exp((centerY * Math.PI) / 20037508.34)) * 360 / Math.PI - 90);

    // Create a custom Wikipedia layer using fetch
    const fetchWikiArticles = async () => {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=${NEARBY_THRESHOLD}&gscoord=${lat}|${lng}&format=json&origin=*`
        );
        const data = await response.json();
        
        const formattedArticles = data.query.geosearch.map((article: any) => ({
          title: article.title,
          distance: article.dist,
          lat: article.lat,
          lon: article.lon,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`
        }));

        // Fetch summaries for each article
        const summaryPromises = formattedArticles.map(async (article: WikiArticle) => {
          // Fetch multiple properties in parallel
          const [summaryResponse, imageResponse, categoryResponse, coordResponse] = await Promise.all([
            fetch(
              `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&titles=${encodeURIComponent(article.title)}&format=json&origin=*`
            ),
            fetch(
              `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=300&titles=${encodeURIComponent(article.title)}&format=json&origin=*`
            ),
            fetch(
              `https://en.wikipedia.org/w/api.php?action=query&prop=categories&titles=${encodeURIComponent(article.title)}&format=json&origin=*`
            ),
            fetch(
              `https://en.wikipedia.org/w/api.php?action=query&prop=coordinates&titles=${encodeURIComponent(article.title)}&format=json&origin=*`
            )
          ]);

          const [summaryData, imageData, categoryData, coordData] = await Promise.all([
            summaryResponse.json(),
            imageResponse.json(),
            categoryResponse.json(),
            coordResponse.json()
          ]);

          const pages = summaryData.query.pages;
          const pageId = Object.keys(pages)[0];
          
          // Get thumbnail
          const thumbnail = imageData.query.pages[pageId]?.thumbnail?.source;
          
          // Get categories (filter out hidden categories)
          const categories = categoryData.query.pages[pageId]?.categories
            ?.filter((cat: any) => !cat.title.includes('Hidden') && !cat.title.includes('Articles'))
            ?.map((cat: any) => cat.title.replace('Category:', ''))
            ?.slice(0, 2) || [];
            
          // Get detailed coordinates
          const coords = coordData.query.pages[pageId]?.coordinates?.[0] || {};

          return {
            ...article,
            summary: pages[pageId].extract?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            thumbnail,
            categories,
            elevation: coords.elevation,
            country: coords.country
          };
        });

        const articlesWithSummaries = await Promise.all(summaryPromises);
        setArticles(articlesWithSummaries);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Wikipedia articles:', error);
        setLoading(false);
      }
    };

    fetchWikiArticles();

    return () => {
      if (wikiLayerRef.current && map) {
        wikiLayerRef.current.forEach((marker: L.Marker) => marker.remove());
        wikiLayerRef.current = null;
      }
      setIsShowingOnMap(false);
    };
  }, [selectedProperty, map]);

  useEffect(() => {
    if (articles.length > 0 && !isShowingOnMap) {
      handleToggleOnMap();
    }
  }, [articles]);

  useEffect(() => {
    if (articles.length > 0 && map && selectedProperty) {
      // Calculate property bounds
      const propertyBounds = L.latLngBounds(
        selectedProperty.geometry.rings[0].map((coord: number[]) => {
          const pt = L.point(coord[0], coord[1]);
          return L.CRS.EPSG3857.unproject(pt);
        })
      );

      // Calculate center point for the radius
      const rings = selectedProperty.geometry.rings[0];
      const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
      const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;
      const center = L.CRS.EPSG3857.unproject(L.point(centerX, centerY));

      // Create bounds that include both property and 1km radius
      const radiusBounds = L.latLngBounds([
        [center.lat - 0.009, center.lng - 0.012], // Approximately 1km south/west
        [center.lat + 0.009, center.lng + 0.012]  // Approximately 1km north/east
      ]);

      // Combine bounds and fit map
      const bounds = propertyBounds.extend(radiusBounds);
      map.fitBounds(bounds, {
        padding: [50, 50],
        duration: 0.8
      });
    }
  }, [articles, map, selectedProperty]);

  const handleToggleOnMap = () => {
    if (!map || !articles.length) return;
    
    setIsLayerLoading(true);
    ensureMapPanes(map);

    try {
      if (isShowingOnMap) {
        if (wikiLayerRef.current) {
          wikiLayerRef.current.forEach((marker: L.Marker) => marker.remove());
          wikiLayerRef.current = null;
        }
        setIsShowingOnMap(false);
      } else {
        const markers: L.Marker[] = articles.map(article => {
          const marker = L.marker([article.lat, article.lon], {
            icon: createWikiIcon(),
            pane: 'wiki-pane',
            zIndexOffset: 1000,
            interactive: true
          });

          marker.bindPopup(`
            <div class="p-4 max-w-md">
              ${article.thumbnail ? `
                <div class="mb-4">
                  <img src="${article.thumbnail}" alt="${article.title}" class="w-full rounded-lg shadow-sm"/>
                </div>
              ` : ''}
              <h3 class="font-bold text-lg mb-2">${article.title}</h3>
              ${article.summary ? `
                <div class="text-sm text-gray-600 mb-3 leading-relaxed">
                  ${article.summary}
                </div>
              ` : ''}
              <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center text-gray-500">
                  <span>Distance</span>
                  <span class="font-medium">${article.distance.toFixed(0)}m</span>
                </div>
                ${article.elevation ? `
                  <div class="flex justify-between items-center text-gray-500">
                    <span>Elevation</span>
                    <span class="font-medium">${article.elevation}m</span>
                  </div>
                ` : ''}
              </div>
              <div class="mt-4 pt-3 border-t border-gray-200">
                <a href="${article.url}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline">
                  Read full article
                </a>
              </div>
            </div>
          `, {
            pane: 'wiki-popup-pane',
            maxWidth: 400,
            className: 'wiki-popup'
          });

          marker.addTo(map);
          return marker;
        });

        wikiLayerRef.current = markers;
        setIsShowingOnMap(true);
      }
    } catch (error) {
      console.error('Error toggling Wikipedia layer:', error);
    } finally {
      setIsLayerLoading(false);
    }
  };

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view nearby Wikipedia articles</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* On Property Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Articles About This Property
            <TooltipWrapper tooltipKey="wikiArticlesOnProperty" showIcon />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <span className="animate-spin">
                <i className="fas fa-spinner h-4 w-4" />
              </span>
            </div>
          ) : articles.filter(a => isArticleWithinProperty(a, selectedProperty.geometry)).length > 0 ? (
            <div className="space-y-4">
              {articles
                .filter(a => isArticleWithinProperty(a, selectedProperty.geometry))
                .map((article, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between font-medium">
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {article.title}
                      </a>
                    </div>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground">{article.summary}</p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No articles found about this property</AlertTitle>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Nearby Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Nearby Articles
            <TooltipWrapper tooltipKey="wikiArticlesNearby" showIcon />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <span className="animate-spin">
                <i className="fas fa-spinner h-4 w-4" />
              </span>
            </div>
          ) : articles.filter(a => !isArticleWithinProperty(a, selectedProperty.geometry) && a.distance <= NEARBY_THRESHOLD).length > 0 ? (
            <div className="space-y-4">
              {articles
                .filter(a => !isArticleWithinProperty(a, selectedProperty.geometry) && a.distance <= NEARBY_THRESHOLD)
                .sort((a, b) => a.distance - b.distance)
                .map((article, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-3">
                      {article.thumbnail && (
                        <div className="flex-shrink-0">
                          <img 
                            src={article.thumbnail} 
                            alt={article.title} 
                            className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleArticleClick(article)}
                            title="Click to view on map"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between font-medium">
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {article.title}
                          </a>
                          <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                            {(article.distance).toFixed(0)}m
                          </span>
                        </div>
                        {article.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No articles found nearby</AlertTitle>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleToggleOnMap}
            className="w-full"
            disabled={isLayerLoading || !articles.length}
          >
            {isLayerLoading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-spinner fa-spin h-4 w-4" />
                {isShowingOnMap ? 'Removing from map...' : 'Adding to map...'}
              </span>
            ) : (
              isShowingOnMap ? 'Hide from Map' : 'Show on Map'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
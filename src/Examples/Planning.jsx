import React from 'react';
import { motion } from 'framer-motion';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const Section = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow p-3 mb-2"
  >
    <div className="flex items-center mb-2">
      <div className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
    <span className="text-gray-600 mr-4">{label}</span>
    <span className="font-medium text-gray-900 text-right truncate">{value}</span>
  </div>
);

const UsesSection = ({ title, uses }) => (
  <div className="mb-4">
    <h4 className="text-sm font-medium text-gray-800 mb-2">{title}</h4>
    <div className="text-sm text-gray-600">
      {uses ? (
        <ul className="list-disc pl-4 space-y-1">
          {uses.split(', ').map((use, index) => (
            <li key={index}>{use}</li>
          ))}
        </ul>
      ) : (
        <p className="italic">No data available</p>
      )}
    </div>
  </div>
);

const Planning = ({ selectedFeature }) => {
  const [permittedUses, setPermittedUses] = React.useState({
    withConsent: null,
    withoutConsent: null,
    loading: false,
    error: null
  });

  React.useEffect(() => {
    const fetchPermittedUses = async () => {
      if (!selectedFeature?.properties?.copiedFrom) return;

      setPermittedUses(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = selectedFeature.properties.copiedFrom;
        const principal = data.site_suitability__principal_zone_identifier || "";
        const lga = data.site_suitability__LGA;
        const zoneCode = principal.split(" - ")[0];

        console.log(`Fetching permitted uses for LGA: ${lga}, Zone: ${zoneCode}`);

        const response = await fetch('https://8fhvng-8080.csb.app/api/proxy', {
          headers: {
            'EPINAME': lga,
            'ZONECODE': zoneCode,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log('API Response:', jsonData);

        const precinct = jsonData?.[0]?.Precinct?.[0];
        const zone = precinct?.Zone?.find(z => z.ZoneCode === zoneCode);
        const landUse = zone?.LandUse?.[0] || {};

        const withConsent = (landUse.PermittedWithConsent || [])
          .map(use => use.Landuse)
          .join(", ");
        const withoutConsent = (landUse.PermittedWithoutConsent || [])
          .map(use => use.Landuse)
          .join(", ");

        setPermittedUses({
          withConsent,
          withoutConsent,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching permitted uses:', error);
        setPermittedUses({
          withConsent: null,
          withoutConsent: null,
          loading: false,
          error: `Failed to fetch permitted uses for ${data.site_suitability__LGA}. Error: ${error.message}`
        });
      }
    };

    fetchPermittedUses();
  }, [selectedFeature]);

  if (!selectedFeature) return null;

  const data = selectedFeature.properties.copiedFrom;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-full p-2 space-y-2">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {data.site_suitability__principal_zone_identifier}
          </h2>
          <p className="text-sm text-gray-600">
            {data.site_suitability__LGA}
          </p>
        </div>

        <Section title="Zoning Details" icon={<BuildingOfficeIcon />}>
          <div className="space-y-4">
            {permittedUses.loading ? (
              <div className="text-sm text-gray-600">Loading permitted uses...</div>
            ) : permittedUses.error ? (
              <div className="text-sm text-red-600">Error: {permittedUses.error}</div>
            ) : (
              <>
                <UsesSection 
                  title="Permitted Without Consent" 
                  uses={permittedUses.withoutConsent}
                />
                <UsesSection 
                  title="Permitted With Consent" 
                  uses={permittedUses.withConsent}
                />
              </>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default Planning;

import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Map from '../components/gis/Map';
import * as api from '../services/api';
import { HomeIcon, FireExtinguisherIcon, AlertTriangleIcon, TruckIcon } from '../components/icons/Icons';
import { Property, Hydrant, Incident, Apparatus } from '../types';

type LayerVisibility = {
    properties: boolean;
    hydrants: boolean;
    incidents: boolean;
    apparatus: boolean;
}

const GisDashboard: React.FC = () => {
    const [visibleLayers, setVisibleLayers] = useState<LayerVisibility>({
        properties: true,
        hydrants: true,
        incidents: true,
        apparatus: true,
    });
    const [allItems, setAllItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.getGisMapItems().then(setAllItems).finally(() => setIsLoading(false));
    }, []);

    const handleLayerToggle = (layer: keyof LayerVisibility) => {
        setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    const mapItems = useMemo(() => {
        let items = [];
        if (visibleLayers.properties) {
            items.push(...allItems.filter(i => i.type === 'property').map(({data}: {data: Property}) => ({
                id: `prop-${data.id}`, location: data.location!, type: 'Property',
                label: data.address, Icon: HomeIcon, color: 'text-blue-400'
            })));
        }
        if (visibleLayers.hydrants) {
            items.push(...allItems.filter(i => i.type === 'hydrant').map(({data}: {data: Hydrant}) => ({
                id: `hyd-${data.id}`, location: data.location, type: 'Hydrant',
                label: `Hydrant #${data.id} (${data.inspections[0]?.flowGpm || 0} GPM)`, Icon: FireExtinguisherIcon, color: 'text-red-500'
            })));
        }
        if (visibleLayers.incidents) {
            items.push(...allItems.filter(i => i.type === 'incident').map(({data}: {data: Incident})=> ({
                id: `inc-${data.id}`, location: data.location!, type: 'Active Incident',
                label: `${data.type} - ${data.address}`, Icon: AlertTriangleIcon, color: 'text-yellow-400 animate-pulse'
            })));
        }
        if (visibleLayers.apparatus) {
             items.push(...allItems.filter(i => i.type === 'apparatus').map(({data}: {data: Apparatus}) => ({
                id: `app-${data.id}`, location: data.location!, type: 'Apparatus',
                label: data.unitId, Icon: TruckIcon, color: 'text-green-400'
            })));
        }
        return items;
    }, [visibleLayers, allItems]);
    
    const layerOptions: { id: keyof LayerVisibility; label: string }[] = [
        { id: 'properties', label: 'Properties' },
        { id: 'hydrants', label: 'Hydrants' },
        { id: 'incidents', label: 'Active Incidents' },
        { id: 'apparatus', label: 'Apparatus' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            <div className="lg:col-span-3 h-full">
                 <Card className="h-full flex flex-col" title="Situational Awareness Map">
                    <div className="flex-grow p-0 m-0">
                      {isLoading ? <div className="flex items-center justify-center h-full text-dark-text-secondary">Loading Map Data...</div> : <Map items={mapItems} />}
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card title="Map Layers">
                    <div className="space-y-3">
                        {layerOptions.map(layer => (
                            <label key={layer.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleLayers[layer.id]}
                                    onChange={() => handleLayerToggle(layer.id)}
                                    className="h-5 w-5 rounded border-gray-500 text-brand-primary focus:ring-brand-primary"
                                />
                                <span className="text-dark-text">{layer.label}</span>
                            </label>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default GisDashboard;
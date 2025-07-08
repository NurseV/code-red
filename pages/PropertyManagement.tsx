
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { Property, Owner } from '../types';
import { FileSpreadsheetIcon } from '../components/icons/Icons';

const PropertiesTab: React.FC = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<(Property & { ownerNames: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProperties = () => {
        setIsLoading(true);
        api.getProperties().then(setProperties).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchProperties();
    }, []);
    
    const handleImport = async () => {
        if(window.confirm("This is a mock import. It will add one pre-defined property to the list. Proceed?")) {
            await api.importProperties("mock_csv_data");
            fetchProperties();
        }
    }

    const columns = [
        { header: 'Address', accessor: (item: Property) => item.address },
        { header: 'Parcel ID', accessor: (item: Property) => item.parcelId },
        { header: 'Owner(s)', accessor: (item: Property & { ownerNames: string }) => item.ownerNames },
        {
            header: 'Actions',
            accessor: (item: Property) => (
                <Button variant="secondary" onClick={() => navigate(`/app/properties/${item.id}`)} className="py-1 px-2 text-xs">
                    View Details
                </Button>
            ),
        },
    ];

    if (isLoading) return <div className="text-center p-8 text-dark-text-secondary">Loading properties...</div>;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleImport} icon={<FileSpreadsheetIcon className="h-4 w-4 mr-2" />}>
                    Import from CSV
                </Button>
            </div>
            <Table columns={columns} data={properties} />
        </div>
    );
};

const OwnersTab: React.FC = () => {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.getOwners().then(setOwners).finally(() => setIsLoading(false));
    }, []);

    const columns = [
        { header: 'Name', accessor: (item: Owner) => item.name },
        { header: 'Mailing Address', accessor: (item: Owner) => item.mailingAddress },
        { header: 'Phone', accessor: (item: Owner) => item.phone },
        { header: 'Email', accessor: (item: Owner) => item.email },
    ];

    if (isLoading) return <div className="text-center p-8 text-dark-text-secondary">Loading owners...</div>;

    return <Table columns={columns} data={owners} />;
};


const PropertyManagement: React.FC = () => {
    const TABS = [
        { label: 'Properties', content: <PropertiesTab /> },
        { label: 'Owners', content: <OwnersTab /> },
    ];

    return (
        <Card title="Property & Owner Management">
            <Tabs tabs={TABS} />
        </Card>
    );
};

export default PropertyManagement;

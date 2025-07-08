

import React, { useState, useEffect } from 'react';
import * as api from '../../../services/api';
import { Apparatus, ApparatusStatus } from '../../../types';
import Table from '../../ui/Table';

interface Props {
    respondingApparatusIds: string[];
}

const NfirsApparatusModule: React.FC<Props> = ({ respondingApparatusIds }) => {
    const [apparatusList, setApparatusList] = useState<Apparatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.getApparatusList()
            .then(allApparatus => {
                const responding = allApparatus.filter(a => respondingApparatusIds.includes(a.id));
                setApparatusList(responding);
            })
            .finally(() => setIsLoading(false));
    }, [respondingApparatusIds]);

    const columns = [
        {
            header: 'Unit ID',
            accessor: (item: Apparatus) => item.unitId,
        },
        {
            header: 'Type',
            accessor: (item: Apparatus) => item.type,
        },
        {
            header: 'Status During Incident',
            accessor: (item: Apparatus) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === ApparatusStatus.IN_SERVICE ? 'bg-green-100 text-green-800' :
                    item.status === ApparatusStatus.OUT_OF_SERVICE ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    {item.status}
                </span>
            ),
        }
    ];

    if (isLoading) {
        return <div className="text-center p-8 text-dark-text-secondary">Loading apparatus data...</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-dark-text">NFIRS-9: Responding Apparatus</h2>
            {apparatusList.length > 0 ? (
                <Table columns={columns} data={apparatusList} />
            ) : (
                 <div className="text-center p-8 bg-dark-bg rounded-lg">
                    <p className="text-dark-text-secondary mt-2">
                        No apparatus units are assigned to this incident.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NfirsApparatusModule;

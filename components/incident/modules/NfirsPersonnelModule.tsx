

import React, { useState, useEffect } from 'react';
import * as api from '../../../services/api';
import { Personnel } from '../../../types';
import Table from '../../ui/Table';

interface Props {
    respondingPersonnelIds: string[];
}

const NfirsPersonnelModule: React.FC<Props> = ({ respondingPersonnelIds }) => {
    const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.getPersonnelList()
            .then(allPersonnel => {
                const responding = allPersonnel.filter(p => respondingPersonnelIds.includes(p.id));
                setPersonnelList(responding);
            })
            .finally(() => setIsLoading(false));
    }, [respondingPersonnelIds]);

    const columns = [
        {
            header: 'Name',
            accessor: (item: Personnel) => (
                <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full" src={item.avatarUrl} alt="" />
                    <div className="ml-4">
                        <div className="text-sm font-medium text-dark-text">{item.name}</div>
                        <div className="text-sm text-dark-text-secondary">{item.emails?.[0]?.address || 'No email'}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Rank',
            accessor: (item: Personnel) => item.rank,
        },
        {
            header: 'Badge #',
            accessor: (item: Personnel) => item.badgeNumber,
        },
    ];

    if (isLoading) {
        return <div className="text-center p-8 text-dark-text-secondary">Loading personnel data...</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-dark-text">NFIRS-10: Responding Personnel</h2>
             {personnelList.length > 0 ? (
                <Table columns={columns} data={personnelList} />
            ) : (
                 <div className="text-center p-8 bg-dark-bg rounded-lg">
                    <p className="text-dark-text-secondary mt-2">
                        No personnel are assigned to this incident.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NfirsPersonnelModule;

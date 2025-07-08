import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { FireDue, FireDueStatus } from '../types';

interface DetailedFireDue extends FireDue {
    address: string;
    ownerName: string;
}

const FireDues: React.FC = () => {
    const [dues, setDues] = useState<DetailedFireDue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FireDueStatus | 'all'>('all');

    useEffect(() => {
        api.getFireDuesWithDetails()
            .then(setDues)
            .finally(() => setIsLoading(false));
    }, []);

    const handleMarkAsPaid = async (dueId: string) => {
        try {
            await api.updateFireDueStatus(dueId, FireDueStatus.PAID);
            setDues(dues.map(due => 
                due.id === dueId ? { ...due, status: FireDueStatus.PAID } : due
            ));
        } catch (error) {
            alert('Failed to update status.');
        }
    };

    const getStatusColor = (status: FireDueStatus) => {
        switch (status) {
            case FireDueStatus.PAID: return 'bg-green-500/20 text-green-400';
            case FireDueStatus.UNPAID: return 'bg-yellow-500/20 text-yellow-400';
            case FireDueStatus.OVERDUE: return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };
    
    const filteredDues = useMemo(() => {
        if (filter === 'all') return dues;
        return dues.filter(due => due.status === filter);
    }, [dues, filter]);

    const columns = [
        { header: 'Property Address', accessor: (item: DetailedFireDue) => item.address },
        { header: 'Primary Owner', accessor: (item: DetailedFireDue) => item.ownerName },
        { header: 'Amount', accessor: (item: DetailedFireDue) => `$${item.amount.toFixed(2)}` },
        { header: 'Due Date', accessor: (item: DetailedFireDue) => new Date(item.dueDate).toLocaleDateString() },
        {
            header: 'Status',
            accessor: (item: DetailedFireDue) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                </span>
            ),
        },
        {
            header: 'Actions',
            accessor: (item: DetailedFireDue) => (
                item.status !== FireDueStatus.PAID ? (
                    <Button variant="secondary" onClick={() => handleMarkAsPaid(item.id)} className="py-1 px-2 text-xs">
                        Mark Paid
                    </Button>
                ) : null
            ),
        },
    ];

    return (
        <Card title="Fire Dues Tracking">
            <div className="p-4 bg-dark-card mb-4 rounded-lg flex items-center space-x-4">
                <span className="text-sm font-medium text-dark-text-secondary">Filter by status:</span>
                <select 
                  onChange={(e) => setFilter(e.target.value as FireDueStatus | 'all')}
                  value={filter}
                  className="bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                >
                    <option value="all">All</option>
                    <option value={FireDueStatus.PAID}>Paid</option>
                    <option value={FireDueStatus.UNPAID}>Unpaid</option>
                    <option value={FireDueStatus.OVERDUE}>Overdue</option>
                </select>
            </div>
            {isLoading ? (
                <div className="text-center p-8 text-dark-text-secondary">Loading fire dues...</div>
            ) : (
                <Table columns={columns} data={filteredDues} />
            )}
        </Card>
    );
};

export default FireDues;

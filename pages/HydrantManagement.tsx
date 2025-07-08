
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import * as api from '../services/api';
import { Hydrant, HydrantInspection } from '../types';
import { useInternalAuth } from '../hooks/useInternalAuth';
import { PipetteIcon } from '../components/icons/Icons';

const HydrantManagement: React.FC = () => {
    const { user } = useInternalAuth();
    const [hydrants, setHydrants] = useState<Hydrant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHydrant, setSelectedHydrant] = useState<Hydrant | null>(null);
    
    // Form state for new inspection
    const [staticPressure, setStaticPressure] = useState('');
    const [residualPressure, setResidualPressure] = useState('');
    const [flowGpm, setFlowGpm] = useState('');
    const [notes, setNotes] = useState('');

    const fetchHydrants = () => {
        setIsLoading(true);
        api.getHydrants().then(setHydrants).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchHydrants();
    }, []);

    const handleOpenModal = (hydrant: Hydrant) => {
        setSelectedHydrant(hydrant);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedHydrant(null);
        // Reset form
        setStaticPressure('');
        setResidualPressure('');
        setFlowGpm('');
        setNotes('');
    };

    const handleLogInspection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHydrant || !user) return;
        
        const newInspection: Omit<HydrantInspection, 'id'> = {
            hydrantId: selectedHydrant.id,
            date: new Date().toISOString(),
            inspectorName: user.name,
            staticPressure: Number(staticPressure),
            residualPressure: Number(residualPressure),
            flowGpm: Number(flowGpm),
            notes: notes,
        };

        try {
            await api.createHydrantInspection(newInspection);
            alert('Inspection logged successfully!');
            handleCloseModal();
            fetchHydrants();
        } catch (error) {
            alert('Failed to log inspection.');
        }
    };

    const getStatusColor = (status: Hydrant['status']) => {
        switch (status) {
            case 'In Service': return 'bg-green-500/20 text-green-400';
            case 'Out of Service': return 'bg-red-500/20 text-red-400';
            case 'Needs Maintenance': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const columns = [
        { header: 'Hydrant ID', accessor: (item: Hydrant) => <span className="font-mono">{item.id}</span> },
        { 
            header: 'Status', 
            accessor: (item: Hydrant) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                </span>
            )
        },
        { 
            header: 'Last Flow (GPM)', 
            accessor: (item: Hydrant) => item.inspections[0]?.flowGpm.toLocaleString() || 'N/A'
        },
        { 
            header: 'Last Inspection', 
            accessor: (item: Hydrant) => new Date(item.lastInspectionDate).toLocaleDateString() 
        },
        { 
            header: 'Actions', 
            accessor: (item: Hydrant) => (
                <Button variant="secondary" onClick={() => handleOpenModal(item)} className="py-1 px-2 text-xs">
                    View / Test
                </Button>
            )
        },
    ];

    return (
        <>
            <Card title="Hydrant Management">
                {isLoading ? (
                    <div className="text-center p-8 text-dark-text-secondary">Loading hydrants...</div>
                ) : (
                    <Table columns={columns} data={hydrants} />
                )}
            </Card>

            {selectedHydrant && (
                <Modal title={`Hydrant ${selectedHydrant.id}`} isOpen={isModalOpen} onClose={handleCloseModal}>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-dark-text mb-2">Inspection History</h3>
                            {selectedHydrant.inspections.length > 0 ? (
                                <ul className="space-y-2 max-h-48 overflow-y-auto border border-dark-border p-2 rounded-md">
                                    {selectedHydrant.inspections.map(insp => (
                                        <li key={insp.id} className="text-sm p-2 bg-dark-bg rounded">
                                            <p><b>{new Date(insp.date).toLocaleDateString()}:</b> Flowed {insp.flowGpm} GPM (Static: {insp.staticPressure}, Residual: {insp.residualPressure})</p>
                                            <p className="text-dark-text-secondary pl-2">- {insp.notes || "No notes."} (Insp: {insp.inspectorName})</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-dark-text-secondary">No inspection history found.</p>
                            )}
                        </div>
                        
                        <form onSubmit={handleLogInspection} className="space-y-4 border-t border-dark-border pt-4">
                             <h3 className="text-lg font-semibold text-dark-text flex items-center"><PipetteIcon className="h-5 w-5 mr-2 text-brand-primary"/> Log New Flow Test</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Static Pressure (PSI)</label>
                                    <input type="number" value={staticPressure} onChange={e => setStaticPressure(e.target.value)} required className="block w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Residual Pressure (PSI)</label>
                                    <input type="number" value={residualPressure} onChange={e => setResidualPressure(e.target.value)} required className="block w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Flow (GPM)</label>
                                    <input type="number" value={flowGpm} onChange={e => setFlowGpm(e.target.value)} required className="block w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm"/>
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Notes</label>
                                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="block w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm" placeholder="e.g., Caps are tight, no leaks observed."></textarea>
                             </div>
                             <div className="flex justify-end pt-2">
                                <Button type="submit">Log Inspection</Button>
                             </div>
                        </form>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default HydrantManagement;



import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import * as api from '../services/api';
import { TruckIcon, EditIcon, SaveIcon } from '../components/icons/Icons';
import { Apparatus, ApparatusStatus, VitalsLog, Role, RepairTicket, AuditLogEntry } from '../types';
import { useInternalAuth } from '../hooks/useInternalAuth';
import { CompartmentManager } from '../components/apparatus/CompartmentManager';
import Table from '../components/ui/Table';

const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-dark-text-secondary">{label}</dt>
        <dd className="mt-1 text-sm text-dark-text">{value || 'N/A'}</dd>
    </div>
);

const DetailInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-dark-text-secondary">{label}</label>
        <input {...props} className="mt-1 block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
    </div>
);

const ApparatusDetailsTab: React.FC<{ apparatus: Apparatus, onUpdate: (updatedApparatus: Apparatus) => void, canEdit: boolean }> = ({ apparatus, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(apparatus);
    const { user } = useInternalAuth();

    useEffect(() => {
        setFormData(apparatus);
    }, [apparatus]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleNestedChange = (section: 'specifications' | 'serviceDates', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            const updatedApparatus = await api.updateApparatus(apparatus.id, formData, user);
            onUpdate(updatedApparatus);
            setIsEditing(false);
        } catch(e) {
            alert('Failed to update apparatus details.');
        }
    }
    
    const handleCancel = () => {
        setFormData(apparatus);
        setIsEditing(false);
    }

    return (
      <div>
        <div className="flex justify-end mb-4">
            {canEdit && (
                isEditing ? (
                    <div className="flex space-x-2">
                        <Button onClick={handleCancel} variant="ghost">Cancel</Button>
                        <Button onClick={handleSave} icon={<SaveIcon className="h-4 w-4 mr-2"/>}>Save Changes</Button>
                    </div>
                ) : (
                    <Button onClick={() => setIsEditing(true)} icon={<EditIcon className="h-4 w-4 mr-2"/>}>Edit Details</Button>
                )
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <div>
                <h4 className="text-lg font-semibold text-dark-text mb-3">General Information</h4>
                <div className="space-y-4">
                    {isEditing ? <DetailInput label="Unit ID" name="unitId" value={formData.unitId} onChange={handleChange} /> : <DetailItem label="Unit ID" value={apparatus.unitId} />}
                    {isEditing ? <DetailInput label="Make" name="make" value={formData.make || ''} onChange={handleChange} /> : <DetailItem label="Make" value={apparatus.make} />}
                    {isEditing ? <DetailInput label="Model" name="model" value={formData.model || ''} onChange={handleChange} /> : <DetailItem label="Model" value={apparatus.model} />}
                    {isEditing ? <DetailInput label="Year" name="year" type="number" value={formData.year || ''} onChange={handleChange} /> : <DetailItem label="Year" value={apparatus.year} />}
                    {isEditing ? <DetailInput label="VIN" name="vin" value={formData.vin || ''} onChange={handleChange} /> : <DetailItem label="VIN" value={apparatus.vin} />}
                    {isEditing ? <DetailInput label="Purchase Date" name="purchaseDate" type="date" value={formData.purchaseDate?.split('T')[0] || ''} onChange={handleChange} /> : <DetailItem label="Purchase Date" value={apparatus.purchaseDate ? new Date(apparatus.purchaseDate).toLocaleDateString() : 'N/A'} />}
                </div>
            </div>
             <div>
                <h4 className="text-lg font-semibold text-dark-text mb-3">Specifications</h4>
                <div className="space-y-4">
                    {isEditing ? <DetailInput label="Pump Capacity (GPM)" type="number" value={formData.specifications?.pumpCapacityGPM || ''} onChange={e => handleNestedChange('specifications', 'pumpCapacityGPM', Number(e.target.value))} /> : <DetailItem label="Pump Capacity (GPM)" value={apparatus.specifications?.pumpCapacityGPM} />}
                    {isEditing ? <DetailInput label="Water Tank (Gal)" type="number" value={formData.specifications?.waterTankSizeGallons || ''} onChange={e => handleNestedChange('specifications', 'waterTankSizeGallons', Number(e.target.value))} /> : <DetailItem label="Water Tank Size (Gallons)" value={apparatus.specifications?.waterTankSizeGallons} />}
                </div>
            </div>
             <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-dark-text mb-3">Service Dates</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isEditing ? <DetailInput label="Last Annual Service" type="date" value={formData.serviceDates?.lastAnnualService?.split('T')[0] || ''} onChange={e => handleNestedChange('serviceDates', 'lastAnnualService', e.target.value)} /> : <DetailItem label="Last Annual Service" value={apparatus.serviceDates?.lastAnnualService ? new Date(apparatus.serviceDates.lastAnnualService).toLocaleDateString() : 'N/A'} />}
                    {isEditing ? <DetailInput label="Next Annual Due" type="date" value={formData.serviceDates?.nextAnnualServiceDue?.split('T')[0] || ''} onChange={e => handleNestedChange('serviceDates', 'nextAnnualServiceDue', e.target.value)} /> : <DetailItem label="Next Annual Service Due" value={apparatus.serviceDates?.nextAnnualServiceDue ? new Date(apparatus.serviceDates.nextAnnualServiceDue).toLocaleDateString() : 'N/A'} />}
                    {isEditing ? <DetailInput label="Last Pump Test" type="date" value={formData.serviceDates?.lastPumpTest?.split('T')[0] || ''} onChange={e => handleNestedChange('serviceDates', 'lastPumpTest', e.target.value)} /> : <DetailItem label="Last Pump Test" value={apparatus.serviceDates?.lastPumpTest ? new Date(apparatus.serviceDates.lastPumpTest).toLocaleDateString() : 'N/A'} />}
                    {isEditing ? <DetailInput label="Next Pump Test Due" type="date" value={formData.serviceDates?.nextPumpTestDue?.split('T')[0] || ''} onChange={e => handleNestedChange('serviceDates', 'nextPumpTestDue', e.target.value)} /> : <DetailItem label="Next Pump Test Due" value={apparatus.serviceDates?.nextPumpTestDue ? new Date(apparatus.serviceDates.nextPumpTestDue).toLocaleDateString() : 'N/A'} />}
                </div>
            </div>
        </div>
      </div>
    );
}

const HistoryTab: React.FC<{ apparatusId: string }> = ({ apparatusId }) => {
    const [history, setHistory] = useState<VitalsLog[]>([]);
    const [tickets, setTickets] = useState<RepairTicket[]>([]);
    
    useEffect(() => {
        api.getApparatusById(apparatusId).then(app => {
            if(app) setHistory(app.vitalsHistory || []);
        });
        api.getRepairTickets().then(allTickets => {
            setTickets(allTickets.filter(t => t.apparatusId === apparatusId));
        })
    }, [apparatusId]);
    
    const vitalsColumns = [
        { header: "Date", accessor: (item: VitalsLog) => new Date(item.date).toLocaleString()},
        { header: "Mileage", accessor: (item: VitalsLog) => item.mileage.toLocaleString() },
        { header: "Engine Hours", accessor: (item: VitalsLog) => item.engineHours.toFixed(1) },
        { header: "Logged By", accessor: (item: VitalsLog) => "Mock User" /* In real app, look up user name */ }
    ];

     const ticketColumns = [
        { header: "Date", accessor: (item: RepairTicket) => new Date(item.createdAt).toLocaleString()},
        { header: "Item", accessor: (item: RepairTicket) => item.itemDescription },
        { header: "Status", accessor: (item: RepairTicket) => item.status },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-semibold text-dark-text mb-3">Vitals History</h4>
                <Table columns={vitalsColumns} data={history} />
            </div>
             <div>
                <h4 className="text-lg font-semibold text-dark-text mb-3">Repair Ticket History</h4>
                 <Table columns={ticketColumns} data={tickets} />
            </div>
        </div>
    );
};

const AssetLogTab: React.FC<{ apparatusId: string }> = ({ apparatusId }) => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.getAuditLogs({ targetId: apparatusId })
            .then(allLogs => {
                const assetLogs = allLogs.filter(log => log.action === 'ASSET_TRANSFER');
                setLogs(assetLogs);
            })
            .finally(() => setIsLoading(false));
    }, [apparatusId]);

    const columns = [
        { header: "Timestamp", accessor: (item: AuditLogEntry) => new Date(item.timestamp).toLocaleString() },
        { header: "User", accessor: (item: AuditLogEntry) => item.userName },
        { header: "Asset", accessor: (item: AuditLogEntry) => item.details.assetName },
        { header: "From", accessor: (item: AuditLogEntry) => item.details.from },
        { header: "To", accessor: (item: AuditLogEntry) => item.details.to },
    ];

    if(isLoading) return <div className="text-center text-dark-text-secondary p-8">Loading asset log...</div>;

    return <Table columns={columns} data={logs} />;
};


const ApparatusDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useInternalAuth();
    const [apparatus, setApparatus] = useState<Apparatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const canEdit = user?.role === Role.ADMINISTRATOR || user?.role === Role.CHIEF;
    
    const fetchApparatus = useCallback(() => {
        if (id) {
            setIsLoading(true);
            api.getApparatusById(id).then(data => {
                setApparatus(data);
            }).finally(() => setIsLoading(false));
        }
    }, [id]);

    useEffect(() => {
        fetchApparatus();
    }, [fetchApparatus]);
    
    const handleUpdate = (updatedApparatus: Apparatus) => {
        setApparatus(updatedApparatus);
    };

    if (isLoading) {
        return <div className="text-center text-dark-text-secondary">Loading apparatus details...</div>;
    }

    if (!apparatus) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-dark-text">Apparatus Not Found</h2>
                <p className="mt-2 text-dark-text-secondary">The requested apparatus could not be found.</p>
                <Link to="/app/apparatus" className="mt-4 inline-block">
                    <Button>Back to Fleet</Button>
                </Link>
            </div>
        );
    }
    
    const statusColorClass = apparatus.status === ApparatusStatus.IN_SERVICE ? 'bg-green-500/20 text-green-400' :
                             apparatus.status === ApparatusStatus.OUT_OF_SERVICE ? 'bg-red-500/20 text-red-400' :
                             'bg-yellow-500/20 text-yellow-400';
                             
    const TABS = [
        { label: 'Details', content: <ApparatusDetailsTab apparatus={apparatus} onUpdate={handleUpdate} canEdit={canEdit} /> },
        { label: 'Compartments', content: <CompartmentManager apparatus={apparatus} onUpdate={handleUpdate} /> },
        { label: 'History', content: <HistoryTab apparatusId={apparatus.id} /> },
        { label: 'Asset Log', content: <AssetLogTab apparatusId={apparatus.id} /> },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <div className="p-4 rounded-full mr-6 mb-4 md:mb-0 bg-dark-bg border-2 border-brand-primary">
                        <TruckIcon className="h-10 w-10 text-brand-primary" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-dark-text">{apparatus.unitId}</h2>
                        <p className="text-lg text-dark-text-secondary">{apparatus.type}</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mt-4 md:mt-0">
                         <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusColorClass}`}>
                          {apparatus.status}
                        </span>
                        <Button variant="secondary" onClick={() => navigate(`/app/apparatus/${apparatus.id}/checklist`)}>
                            Perform Daily Check
                        </Button>
                    </div>
                </div>
            </Card>

            <Card>
                 <Tabs tabs={TABS} />
            </Card>
        </div>
    );
};

export default ApparatusDetail;
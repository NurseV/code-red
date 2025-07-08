
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import * as api from '../services/api';
import { Apparatus, ApparatusChecklistItem, ChecklistItemStatus, Asset } from '../types';
import { useInternalAuth } from '../hooks/useInternalAuth';
import CameraScanner from '../components/ui/CameraScanner';

const ApparatusChecklist: React.FC = () => {
    const { id: apparatusId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useInternalAuth();
    const [apparatus, setApparatus] = useState<Apparatus | null>(null);
    const [checklist, setChecklist] = useState<ApparatusChecklistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [vitals, setVitals] = useState({ mileage: '', engineHours: '' });
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [verifyingAsset, setVerifyingAsset] = useState<Asset | null>(null);
    const [verifiedAssets, setVerifiedAssets] = useState<string[]>([]);
    const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const fetchChecklistData = async () => {
            if (!apparatusId) return;
            try {
                const app = await api.getApparatusById(apparatusId);
                setApparatus(app);
                if (app) {
                    setVitals({ mileage: String(app.mileage), engineHours: String(app.engineHours) });
                    const template = await api.getChecklistTemplateById(app.checklistTemplateId);
                    const initialChecklist = template ? template.items.map((item) => ({
                        ...item,
                        status: ChecklistItemStatus.PENDING,
                    })) : [];
                    setChecklist(initialChecklist);

                    const allAssets = await api.getAssets();
                    const assetsOnTruck = allAssets.filter(asset => app.compartments.some(c => c.subCompartments.some(sc => sc.assignedAssetIds.includes(asset.id))));
                    setAssignedAssets(assetsOnTruck);
                }
            } catch (e) {
                console.error("Failed to load checklist data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChecklistData();
    }, [apparatusId]);

    const handleStatusChange = (itemId: string, status: ChecklistItemStatus) => {
        setChecklist(prev => prev.map(item => item.id === itemId ? { ...item, status } : item));
    };

    const handleCreateTicket = async (item: ApparatusChecklistItem) => {
        if (!apparatus || !user) return;
    
        const ticketData = {
            itemDescription: item.text,
            apparatusId: apparatus.id,
            apparatusUnitId: apparatus.unitId,
        };
    
        if (navigator.onLine) {
            try {
                await api.createRepairTicket(user, ticketData);
                alert(`Repair ticket created for "${item.text}" on ${apparatus.unitId}.`);
            } catch (e) {
                alert('Failed to create repair ticket.');
            }
        } else {
            const pendingTickets = JSON.parse(localStorage.getItem('pendingTickets') || '[]');
            pendingTickets.push({ ...ticketData, id: `pending-${Date.now()}` });
            localStorage.setItem('pendingTickets', JSON.stringify(pendingTickets));
            alert(`You are offline. Ticket for "${item.text}" has been saved and will be created when you reconnect.`);
        }
    };
    
    const handleVitalsUpdate = async () => {
        if (!apparatusId || !user) return;
        try {
            await api.updateApparatus(apparatusId, { 
                mileage: Number(vitals.mileage), 
                engineHours: Number(vitals.engineHours) 
            }, user);
            alert('Vitals updated!');
        } catch (e) {
            alert('Failed to update vitals.');
        }
    };
    
    const openScanner = (asset: Asset) => {
        setVerifyingAsset(asset);
        setIsScannerOpen(true);
    };

    const handleScan = (scanResult: string) => {
        if (verifyingAsset && scanResult === verifyingAsset.id) {
            setVerifiedAssets(prev => [...prev, verifyingAsset.id]);
            alert(`${verifyingAsset.name} verified successfully!`);
        } else {
            alert("Scanned asset does not match the expected item.");
        }
        setIsScannerOpen(false);
        setVerifyingAsset(null);
    };

    if (isLoading || !apparatus) {
        return <Card title="Loading..."><p>Loading checklist data...</p></Card>;
    }
    
    const allItemsComplete = checklist.every(item => item.status !== ChecklistItemStatus.PENDING);
    const allAssetsVerified = assignedAssets.every(asset => verifiedAssets.includes(asset.id));
    const isChecklistComplete = allItemsComplete && allAssetsVerified;

    return (
        <>
            <Card title={`Daily Checklist: ${apparatus.unitId}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-dark-text mb-3">Vehicle Checklist</h3>
                        <ul className="divide-y divide-dark-border">
                            {checklist.map(item => (
                                <li key={item.id} className="py-3 flex items-center justify-between">
                                    <span className="text-dark-text">{item.text}</span>
                                    <div className="flex items-center space-x-2">
                                        {item.status === ChecklistItemStatus.FAIL && <Button onClick={() => handleCreateTicket(item)} variant="secondary" className="py-1 px-2 text-xs">Create Ticket</Button>}
                                        <Button onClick={() => handleStatusChange(item.id, ChecklistItemStatus.PASS)} className={`py-1 px-3 text-xs ${item.status === ChecklistItemStatus.PASS ? 'bg-green-600' : 'bg-gray-600'}`}>Pass</Button>
                                        <Button onClick={() => handleStatusChange(item.id, ChecklistItemStatus.FAIL)} className={`py-1 px-3 text-xs ${item.status === ChecklistItemStatus.FAIL ? 'bg-red-700' : 'bg-gray-600'}`}>Fail</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-3">Update Vitals</h3>
                         <div className="space-y-4 p-4 bg-dark-bg rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Current Mileage</label>
                                <input type="number" value={vitals.mileage} onChange={e => setVitals({...vitals, mileage: e.target.value})} className="w-full bg-dark-card border border-dark-border rounded-md py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Current Engine Hours</label>
                                <input type="number" step="0.1" value={vitals.engineHours} onChange={e => setVitals({...vitals, engineHours: e.target.value})} className="w-full bg-dark-card border border-dark-border rounded-md py-2 px-3"/>
                            </div>
                            <Button onClick={handleVitalsUpdate} className="w-full">Log Vitals</Button>
                         </div>
                         <h3 className="text-lg font-semibold text-dark-text mt-6 mb-3">Asset Verification</h3>
                         <ul className="divide-y divide-dark-border">
                            {assignedAssets.map(asset => (
                                <li key={asset.id} className="py-3 flex items-center justify-between">
                                    <span>{asset.name}</span>
                                    {verifiedAssets.includes(asset.id) ? 
                                        <span className="text-green-400 font-bold">Verified</span> : 
                                        <Button onClick={() => openScanner(asset)}>Scan to Verify</Button>
                                    }
                                </li>
                            ))}
                         </ul>
                    </div>
                </div>

                {isChecklistComplete && (
                    <div className="mt-6 pt-4 border-t border-dark-border text-center">
                        <p className="text-xl text-green-400 font-bold mb-4">Checklist Complete!</p>
                        <Button onClick={() => navigate(`/app/apparatus/${apparatusId}`)}>Finish and Return</Button>
                    </div>
                )}
            </Card>

            <Modal title={`Scan Asset: ${verifyingAsset?.name}`} isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)}>
                <CameraScanner onScan={handleScan} onCancel={() => setIsScannerOpen(false)} />
            </Modal>
        </>
    );
};

export default ApparatusChecklist;


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import * as api from '../services/api';
import * as gemini from '../services/geminiService';
import { Asset, MaintenanceLog, PreventativeMaintenanceSchedule, AssetPhoto, AssetDocument, Personnel, SavedAssetView, Consumable } from '../types';
import CameraScanner from '../components/ui/CameraScanner';
import { PlusIcon, SearchIcon, XIcon, EditIcon, ArrowLeftIcon, PrinterIcon, ImageIcon, FileTextIcon, Trash2Icon, UserIcon, LayoutDashboardIcon, ListChecksIcon, SaveIcon, FilterIcon, WandSparklesIcon } from '../components/icons/Icons';
import { useInternalAuth } from '../hooks/useInternalAuth';
import Accordion from '../components/ui/Accordion';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


// --- Detail View Components ---

const DetailStatCard: React.FC<{ title: string; value: string | number; color?: string }> = ({ title, value, color = 'text-dark-text' }) => (
    <div className="bg-dark-bg p-3 rounded-md border border-dark-border">
        <p className="text-xs text-dark-text-secondary font-medium uppercase tracking-wider">{title}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
);

const OverviewTab: React.FC<{asset: Asset}> = ({ asset }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DetailStatCard title="Purchase Price" value={`$${asset.purchasePrice.toLocaleString()}`} />
        <DetailStatCard title="Current Value" value={`$${asset.currentValue?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A'}`} color="text-green-400" />
        <DetailStatCard title="Total Cost of Ownership" value={`$${asset.totalCostOfOwnership?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A'}`} color="text-yellow-400" />
        <DetailStatCard title="Warranty Expires" value={asset.warrantyExpirationDate ? new Date(asset.warrantyExpirationDate).toLocaleDateString() : 'N/A'} />
        
        <div className="md:col-span-2 lg:col-span-4 bg-dark-bg p-3 rounded-md border border-dark-border">
            <h4 className="text-sm text-dark-text-secondary font-medium">Insurance Information</h4>
            {asset.insuranceInfo ? (
                <div className="flex justify-between items-center mt-1">
                    <p className="text-dark-text">{asset.insuranceInfo.provider} - Policy #{asset.insuranceInfo.policyNumber}</p>
                    <p className="text-dark-text-secondary">Expires: {new Date(asset.insuranceInfo.expirationDate).toLocaleDateString()}</p>
                </div>
            ) : <p className="text-dark-text-secondary text-sm mt-1">No insurance information on file.</p>}
        </div>
    </div>
);

const MaintenanceTab: React.FC<{asset: Asset; onUpdate: () => void}> = ({ asset, onUpdate }) => {
    const { user } = useInternalAuth();
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isPmModalOpen, setIsPmModalOpen] = useState(false);
    const [newLog, setNewLog] = useState({ description: '', cost: '', type: 'Preventative' as 'Preventative' | 'Repair' });
    const [newPm, setNewPm] = useState({ taskDescription: '', frequencyType: 'time' as 'time' | 'usage', frequencyInterval: '', frequencyUnit: 'months' as 'months' | 'years' | 'hours' });
    
    const logColumns = [
        { header: 'Date', accessor: (item: MaintenanceLog) => new Date(item.date).toLocaleDateString()},
        { header: 'Type', accessor: (item: MaintenanceLog) => item.type },
        { header: 'Description', accessor: (item: MaintenanceLog) => item.description, className: 'whitespace-normal max-w-md'},
        { header: 'Cost', accessor: (item: MaintenanceLog) => `$${item.cost.toLocaleString()}`},
        { header: 'Performed By', accessor: (item: MaintenanceLog) => item.performedBy},
    ];

    const pmColumns = [
        { header: 'Task', accessor: (item: PreventativeMaintenanceSchedule) => item.taskDescription },
        { header: 'Frequency', accessor: (item: PreventativeMaintenanceSchedule) => `${item.frequencyInterval} ${item.frequencyUnit}` },
        { header: 'Next Due', accessor: (item: PreventativeMaintenanceSchedule) => new Date(item.nextDueDate).toLocaleDateString()},
        { header: 'Last Performed', accessor: (item: PreventativeMaintenanceSchedule) => item.lastPerformedDate ? new Date(item.lastPerformedDate).toLocaleDateString() : 'N/A' },
    ];
    
    const handleAddLog = async () => {
        if (!newLog.description || !newLog.cost || !user) return;
        const logData = { ...newLog, cost: Number(newLog.cost), assetId: asset.id, date: new Date().toISOString(), performedBy: user.name };
        await api.createMaintenanceLog(logData);
        onUpdate();
        setIsLogModalOpen(false);
    };

    const handleAddPm = async () => {
        if (!newPm.taskDescription || !newPm.frequencyInterval) return;
        const nextDueDate = new Date();
        if (newPm.frequencyUnit === 'months') nextDueDate.setMonth(nextDueDate.getMonth() + Number(newPm.frequencyInterval));
        if (newPm.frequencyUnit === 'years') nextDueDate.setFullYear(nextDueDate.getFullYear() + Number(newPm.frequencyInterval));
        
        const pmData = { ...newPm, frequencyInterval: Number(newPm.frequencyInterval), assetId: asset.id, nextDueDate: nextDueDate.toISOString() };
        await api.createPMSchedule(pmData);
        onUpdate();
        setIsPmModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <Accordion title="Maintenance History" defaultOpen>
                <div className="flex justify-end mb-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsLogModalOpen(true)} icon={<PlusIcon className="h-4 w-4 mr-1"/>}>Log Maintenance</Button>
                </div>
                <Table columns={logColumns} data={asset.maintenanceHistory || []} />
            </Accordion>
             <Accordion title="Preventative Maintenance Schedule" defaultOpen>
                <div className="flex justify-end mb-2">
                     <Button variant="secondary" size="sm" onClick={() => setIsPmModalOpen(true)} icon={<PlusIcon className="h-4 w-4 mr-1"/>}>New PM Schedule</Button>
                </div>
                 <Table columns={pmColumns} data={asset.pmSchedules || []} />
            </Accordion>
            
             <Modal title="Log New Maintenance" isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)}>
                <div className="space-y-4">
                    <select value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value as any})} className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text">
                        <option value="Preventative">Preventative</option>
                        <option value="Repair">Repair</option>
                    </select>
                    <textarea value={newLog.description} onChange={e => setNewLog({...newLog, description: e.target.value})} placeholder="Description of work performed..." rows={4} className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text" />
                    <input type="number" value={newLog.cost} onChange={e => setNewLog({...newLog, cost: e.target.value})} placeholder="Total Cost ($)" className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text" />
                    <div className="flex justify-end space-x-2"><Button variant="ghost" onClick={() => setIsLogModalOpen(false)}>Cancel</Button><Button onClick={handleAddLog}>Save Log</Button></div>
                </div>
            </Modal>
             <Modal title="New PM Schedule" isOpen={isPmModalOpen} onClose={() => setIsPmModalOpen(false)}>
                <div className="space-y-4">
                    <input type="text" value={newPm.taskDescription} onChange={e => setNewPm({...newPm, taskDescription: e.target.value})} placeholder="Task Description (e.g., Annual Flow Test)" className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text" />
                    <div className="flex space-x-2">
                        <input type="number" value={newPm.frequencyInterval} onChange={e => setNewPm({...newPm, frequencyInterval: e.target.value})} placeholder="Interval" className="w-1/2 bg-dark-bg border-dark-border rounded-md p-2 text-dark-text" />
                        <select value={newPm.frequencyUnit} onChange={e => setNewPm({...newPm, frequencyUnit: e.target.value as any})} className="w-1/2 bg-dark-bg border-dark-border rounded-md p-2 text-dark-text">
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                            <option value="hours">Usage Hours</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2"><Button variant="ghost" onClick={() => setIsPmModalOpen(false)}>Cancel</Button><Button onClick={handleAddPm}>Save Schedule</Button></div>
                </div>
            </Modal>
        </div>
    );
};

const SwapComponentModal: React.FC<{
    component: Asset;
    currentParent: Asset;
    isOpen: boolean;
    onClose: () => void;
    onSwapped: () => void;
}> = ({ component, currentParent, isOpen, onClose, onSwapped }) => {
    const [spareComponents, setSpareComponents] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            api.getAssets()
                .then(assets => {
                    setSpareComponents(assets.filter(a => a.assetType === component.assetType && a.id !== component.id && !a.parentId));
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, component]);

    const handleSwap = async (spareId: string) => {
        try {
            await api.swapAssetComponent(spareId, component.id, currentParent.id);
            onSwapped();
            onClose();
        } catch (error) {
            alert('Failed to swap components.');
        }
    };

    return (
        <Modal title={`Swap ${component.name}`} isOpen={isOpen} onClose={onClose}>
            <p className="text-dark-text-secondary mb-4">Select a spare component to swap with the currently assigned one.</p>
            {isLoading ? <p>Loading spares...</p> : (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {spareComponents.length > 0 ? spareComponents.map(spare => (
                        <li key={spare.id} className="flex justify-between items-center p-2 bg-dark-bg rounded-md">
                            <span>{spare.name} (S/N: {spare.serialNumber})</span>
                            <Button size="sm" className="py-1 px-2 text-xs" onClick={() => handleSwap(spare.id)}>Swap</Button>
                        </li>
                    )) : <p className="text-center text-dark-text-secondary py-4">No compatible spare components available.</p>}
                </ul>
            )}
        </Modal>
    );
};


const ComponentsTab: React.FC<{asset: Asset; onUpdate: () => void}> = ({ asset, onUpdate }) => {
    // State for physical components
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [swappingComponent, setSwappingComponent] = useState<Asset | null>(null);
    const [spareComponents, setSpareComponents] = useState<Asset[]>([]);

    // State for kit inventory
    const [allConsumables, setAllConsumables] = useState<Consumable[]>([]);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isLoadingConsumables, setIsLoadingConsumables] = useState(false);

    useEffect(() => {
        if (asset.category === 'Kit') {
            setIsLoadingConsumables(true);
            api.getConsumables().then(setAllConsumables).finally(() => setIsLoadingConsumables(false));
        } else if (isAssignModalOpen) {
            api.getUnassignedAssets().then(assets => {
                 setSpareComponents(assets.filter(a => a.assetType === 'SCBA Bottle')); // Mock filter
            });
        }
    }, [asset.category, isAssignModalOpen]);
    
    const handleOpenSwapModal = (component: Asset) => {
        setSwappingComponent(component);
        setIsSwapModalOpen(true);
    };

    const handleAssign = async (componentId: string) => {
        await api.assignComponent(componentId, asset.id);
        setIsAssignModalOpen(false);
        onUpdate();
    };

    const handleUnassign = async (componentId: string) => {
        if (window.confirm("Are you sure you want to unassign this component?")) {
            await api.unassignComponent(componentId);
            onUpdate();
        }
    };
    
    if (asset.category === 'Kit') {
        const handleQuantityChange = async (consumableId: string, change: number) => {
            const currentInventory = asset.inventory || [];
            const item = currentInventory.find(i => i.consumableId === consumableId);
            if (!item) return;

            const newQuantity = Math.max(0, item.quantity + change);
            const newInventory = currentInventory.map(i => i.consumableId === consumableId ? { ...i, quantity: newQuantity } : i);
            
            await api.updateAsset(asset.id, { inventory: newInventory });
            onUpdate();
        };
        
        const handleAddItem = async (consumableId: string) => {
            const currentInventory = asset.inventory || [];
            if (currentInventory.some(i => i.consumableId === consumableId)) {
                alert("Item is already in the kit. You can adjust the quantity from the list.");
                return;
            }
            const consumable = allConsumables.find(c => c.id === consumableId);
            if (!consumable) return;

            const newInventory = [...currentInventory, { consumableId: consumableId, quantity: consumable.reorderLevel || 10 }];
            await api.updateAsset(asset.id, { inventory: newInventory });
            onUpdate();
            setIsAddItemModalOpen(false);
        };

        const handleRemoveItem = async (consumableId: string) => {
             if (window.confirm("Are you sure you want to remove this item from the kit?")) {
                const newInventory = (asset.inventory || []).filter(i => i.consumableId !== consumableId);
                await api.updateAsset(asset.id, { inventory: newInventory });
                onUpdate();
             }
        };

        const itemsInKit = (asset.inventory || []).map(invItem => {
            const consumable = allConsumables.find(c => c.id === invItem.consumableId);
            return {
                ...invItem,
                id: invItem.consumableId, // for table key
                name: consumable?.name || 'Unknown Item',
                category: consumable?.category || 'Unknown',
            };
        });

        const kitColumns = [
            { header: 'Item Name', accessor: (item: any) => item.name },
            { header: 'Category', accessor: (item: any) => item.category },
            { header: 'Quantity', accessor: (item: any) => (
                 <div className="flex items-center space-x-1">
                    <Button onClick={() => handleQuantityChange(item.consumableId, -1)} size="sm" className="p-1 h-6 w-6 text-xs">-</Button>
                    <span className="text-center w-8">{item.quantity}</span>
                    <Button onClick={() => handleQuantityChange(item.consumableId, 1)} size="sm" className="p-1 h-6 w-6 text-xs">+</Button>
                </div>
            ) },
            { header: 'Actions', accessor: (item: any) => (
                <Button variant="danger" size="sm" className="p-1 h-6 w-6 text-xs" onClick={() => handleRemoveItem(item.consumableId)}>
                    <XIcon className="h-4 w-4"/>
                </Button>
            )},
        ];
        
        const availableToAdd = allConsumables.filter(c => !(asset.inventory || []).some(i => i.consumableId === c.id));
        
        return (
             <div className="space-y-4">
                <div className="flex justify-end">
                    <Button onClick={() => setIsAddItemModalOpen(true)} icon={<PlusIcon className="h-4 w-4 mr-1"/>}>Add Inventory Item</Button>
                </div>
                <Table columns={kitColumns} data={itemsInKit} />
                <Modal title="Add Item to Kit" isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)}>
                    {isLoadingConsumables ? <p>Loading...</p> : 
                    <ul className="space-y-2 max-h-80 overflow-y-auto">
                        {availableToAdd.map(item => (
                             <li key={item.id} className="flex justify-between items-center p-2 bg-dark-bg rounded-md">
                                <span>{item.name}</span>
                                <Button size="sm" className="py-1 px-2 text-xs" onClick={() => handleAddItem(item.id)}>Add</Button>
                            </li>
                        ))}
                         {availableToAdd.length === 0 && <p className="text-center text-dark-text-secondary">All consumable items are already in this kit.</p>}
                    </ul>
                    }
                </Modal>
            </div>
        );
    }
    
    const columns = [
        { header: 'Component Name', accessor: (item: Asset) => item.name },
        { header: 'S/N', accessor: (item: Asset) => item.serialNumber },
        { header: 'Hydro Test Date', accessor: (item: Asset) => item.hydrostaticTestDate ? new Date(item.hydrostaticTestDate).toLocaleDateString() : 'N/A' },
        { header: 'Actions', accessor: (item: Asset) => (
            <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="py-1 px-2 text-xs" onClick={() => handleOpenSwapModal(item)}>Swap</Button>
                <Button variant="danger" size="sm" className="py-1 px-2 text-xs" onClick={() => handleUnassign(item.id)}>Unassign</Button>
            </div>
        )}
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setIsAssignModalOpen(true)} icon={<PlusIcon className="h-4 w-4 mr-1"/>}>Assign Spare Component</Button>
            </div>
            <Table columns={columns} data={asset.components || []} />
            <Modal title="Assign Spare Component" isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {spareComponents.length > 0 ? spareComponents.map(spare => (
                        <li key={spare.id} className="flex justify-between items-center p-2 bg-dark-bg rounded-md">
                            <span>{spare.name} (S/N: {spare.serialNumber})</span>
                            <Button size="sm" className="py-1 px-2 text-xs" onClick={() => handleAssign(spare.id)}>Assign</Button>
                        </li>
                    )) : <p className="text-center text-dark-text-secondary py-4">No spare components of a compatible type are available.</p>}
                </ul>
            </Modal>
            {swappingComponent && <SwapComponentModal component={swappingComponent} currentParent={asset} isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} onSwapped={onUpdate} />}
        </div>
    );
};

const MediaAndDocsTab: React.FC<{asset: Asset; onUpdate: () => void}> = ({ asset, onUpdate }) => {
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [summarizingDocId, setSummarizingDocId] = useState<string | null>(null);

    const handleSummarize = async (doc: AssetDocument) => {
        if (!doc.mockContent) {
            alert("No content available to summarize for this document.");
            return;
        }
        setSummarizingDocId(doc.id);
        try {
            const summary = await gemini.summarizeDocument(doc.mockContent);
            await api.updateAssetDocumentSummary(asset.id, doc.id, summary);
            onUpdate();
        } catch (e) {
            alert("Failed to get summary.");
        } finally {
            setSummarizingDocId(null);
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploadingPhoto(true);
            try {
                await api.uploadAssetPhoto(asset.id, e.target.files[0]);
                onUpdate();
            } catch (error) {
                alert("Failed to upload photo.");
            } finally {
                setIsUploadingPhoto(false);
            }
        }
    };
    
    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploadingDoc(true);
            try {
                await api.uploadAssetDocument(asset.id, e.target.files[0]);
                onUpdate();
            } catch (error) {
                alert("Failed to upload document.");
            } finally {
                setIsUploadingDoc(false);
            }
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (window.confirm("Are you sure you want to delete this photo?")) {
            await api.deleteAssetPhoto(asset.id, photoId);
            onUpdate();
        }
    }
    
    const handleDeleteDoc = async (docId: string) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            await api.deleteAssetDocument(asset.id, docId);
            onUpdate();
        }
    }

    return (
        <div className="space-y-6">
            <Accordion title="Photos" defaultOpen>
                <div className="flex justify-end mb-2">
                    <Button variant="secondary" size="sm" onClick={() => document.getElementById('photo-upload-input')?.click()} isLoading={isUploadingPhoto} icon={<ImageIcon className="h-4 w-4 mr-1"/>}>Upload Photo</Button>
                    <input type="file" id="photo-upload-input" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(asset.photos || []).map(photo => (
                        <div key={photo.id} className="group relative border border-dark-border rounded-lg overflow-hidden">
                            <img src={photo.url} alt={photo.caption} className="aspect-square w-full object-cover"/>
                            <div className="absolute bottom-0 left-0 w-full p-2 bg-black/60">
                                <p className="text-white text-xs truncate">{photo.caption}</p>
                            </div>
                            <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2Icon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
                {!(asset.photos && asset.photos.length) && <p className="text-center text-dark-text-secondary py-4">No photos uploaded for this asset.</p>}
            </Accordion>
            <Accordion title="Documents" defaultOpen>
                 <div className="flex justify-end mb-2">
                    <Button variant="secondary" size="sm" onClick={() => document.getElementById('doc-upload-input')?.click()} isLoading={isUploadingDoc} icon={<FileTextIcon className="h-4 w-4 mr-1"/>}>Upload Document</Button>
                     <input type="file" id="doc-upload-input" className="hidden" accept=".pdf,.doc,.docx" onChange={handleDocUpload} />
                </div>
                <div className="divide-y divide-dark-border">
                    {(asset.documents || []).map(doc => (
                        <div key={doc.id} className="py-3">
                            <div className="flex items-center justify-between group">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-dark-text hover:underline flex items-center"><FileTextIcon className="h-5 w-5 mr-2"/>{doc.name}</a>
                                <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="sm" className="py-1 px-2" onClick={() => handleSummarize(doc)} isLoading={summarizingDocId === doc.id} icon={<WandSparklesIcon className="h-4 w-4 mr-1"/>}>Summarize</Button>
                                    <button onClick={() => handleDeleteDoc(doc.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400"><Trash2Icon className="h-4 w-4"/></button>
                                </div>
                            </div>
                            {doc.summary && (
                                <div className="mt-2 ml-7 p-2 bg-dark-bg border border-dark-border rounded-md text-sm text-dark-text-secondary">
                                    <h5 className="font-semibold mb-1 text-dark-text">AI Summary:</h5>
                                    <p className="whitespace-pre-wrap">{doc.summary}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                 {!(asset.documents && asset.documents.length) && <p className="text-center text-dark-text-secondary py-4">No documents uploaded for this asset.</p>}
            </Accordion>
        </div>
    );
};

// --- View Components ---

const DashboardView: React.FC<{ onNavigate: (view: any) => void }> = ({ onNavigate }) => {
    const [dashboardData, setDashboardData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        api.getAssetDashboardData().then(setDashboardData).finally(() => setIsLoading(false));
    }, []);

    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

    if (isLoading || !dashboardData) return <div className="text-center text-dark-text-secondary p-8">Loading Dashboard...</div>

    return (
        <Card title="Asset Dashboard" actions={<Button onClick={() => onNavigate({type: 'list'})} icon={<ListChecksIcon className="h-4 w-4 mr-2"/>}>View Full List</Button>}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-3">Asset Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                             <Pie data={dashboardData.statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                 {dashboardData.statusCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-3">Assets by Category</h3>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dashboardData.categoryCounts} layout="vertical">
                            <XAxis type="number" stroke="#9CA3AF" />
                            <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={80} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} cursor={{fill: 'rgba(255,255,255,0.1)'}} />
                            <Bar dataKey="count" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2">
                     <h3 className="text-lg font-semibold text-dark-text mb-3">Upcoming Maintenance (Next 90 Days)</h3>
                    <ul className="space-y-2">
                        {dashboardData.upcomingPms.length > 0 ? dashboardData.upcomingPms.map(pm => (
                             <li key={pm.id} className="flex justify-between p-2 bg-dark-bg rounded-md">
                                <div>
                                    <p className="text-dark-text font-medium">{pm.Task}</p>
                                    <p className="text-sm text-dark-text-secondary">{pm["Asset Name"]} (S/N: {pm["Asset S/N"]})</p>
                                </div>
                                <p className="text-sm text-yellow-400">Due: {pm["Due Date"]}</p>
                            </li>
                        )) : <p className="text-center text-dark-text-secondary py-4">No preventative maintenance due soon.</p>}
                    </ul>
                </div>
            </div>
        </Card>
    );
};

const AssetListView: React.FC<{ onNavigate: (view: any) => void }> = ({ onNavigate }) => {
    // Component states
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isNewViewModalOpen, setIsNewViewModalOpen] = useState(false);
    const [savedViews, setSavedViews] = useState<SavedAssetView[]>([]);
    const [newViewName, setNewViewName] = useState('');
    
    // Filtering and sorting states
    const [filters, setFilters] = useState({
        searchTerm: '',
        purchaseDateStart: '',
        purchaseDateEnd: '',
        warrantyExpireStart: '',
        warrantyExpireEnd: '',
        hasUpcomingPM: false,
    });
    const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

    // Initial data fetch
    useEffect(() => {
        api.getAssetViews().then(setSavedViews);
    }, []);
    
    useEffect(() => {
        setIsLoading(true);
        const appliedFilters = { ...filters, searchTerm: debouncedSearchTerm };
        api.getAssets(appliedFilters).then(setAssets).finally(() => setIsLoading(false));
    }, [debouncedSearchTerm, filters.purchaseDateStart, filters.purchaseDateEnd, filters.warrantyExpireStart, filters.warrantyExpireEnd, filters.hasUpcomingPM]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveView = async () => {
        const viewToSave = { name: newViewName, filters };
        const newView = await api.saveAssetView(viewToSave);
        setSavedViews(prev => [...prev, newView]);
        setIsNewViewModalOpen(false);
        setNewViewName('');
    };
    
    const handleApplyView = (view: SavedAssetView) => {
        const defaultFilters = {
            searchTerm: '',
            purchaseDateStart: '',
            purchaseDateEnd: '',
            warrantyExpireStart: '',
            warrantyExpireEnd: '',
            hasUpcomingPM: false,
        };
        setFilters({
            ...defaultFilters,
            ...view.filters,
        });
    };

    // Barcode scanner logic
    const barcodeScannerRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const handleScan = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            if (e.key === 'Enter' && barcodeScannerRef.current) {
                const term = barcodeScannerRef.current.value;
                if(term) setFilters(prev => ({ ...prev, searchTerm: term }));
                barcodeScannerRef.current.value = '';
            }
        };
        window.addEventListener('keydown', handleScan);
        return () => window.removeEventListener('keydown', handleScan);
    }, []);
    
    const onScan = async (scanResult: string) => {
        setIsScannerOpen(false);
        const results = await api.getAssets({ searchTerm: scanResult });
        if (results.length === 1) {
            onNavigate({ type: 'detail', id: results[0].id });
        } else if (results.length > 1) {
            alert("Multiple assets found. Please use the list view.");
            setFilters(prev => ({...prev, searchTerm: scanResult}));
        } else {
            if(window.confirm(`Asset with ID "${scanResult}" not found. Would you like to create it?`)) {
                // Open add modal and pre-fill serial number
            }
        }
    };

    // Table columns
    const columns = [
        { header: 'Name', accessor: (item: Asset) => item.name, className: 'font-semibold' },
        { header: 'S/N', accessor: (item: Asset) => item.serialNumber },
        { header: 'Type', accessor: (item: Asset) => item.assetType },
        { header: 'Status', accessor: (item: Asset) => item.status },
        { header: 'Assigned To', accessor: (item: Asset) => item.assignedToName || 'Storage' },
    ];

    return (
        <Card title="All Assets" actions={<Button onClick={() => setIsAddModalOpen(true)} icon={<PlusIcon className="h-4 w-4 mr-2"/>}>New Asset</Button>}>
            <input ref={barcodeScannerRef} className="opacity-0 w-0 h-0 absolute" aria-hidden="true"/>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <div className="relative">
                         <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-text-secondary" />
                         <input type="text" value={filters.searchTerm} onChange={handleFilterChange} name="searchTerm" placeholder="Search..." className="w-full bg-dark-bg border border-dark-border rounded-md py-2 pl-10 pr-4 text-dark-text" />
                    </div>
                    <Button variant="ghost" onClick={() => setIsScannerOpen(true)}>Scan Barcode</Button>
                    <Button variant="ghost" onClick={() => setIsFiltersModalOpen(true)} icon={<FilterIcon className="h-4 w-4 mr-1"/>}>Advanced</Button>
                </div>
                 <select onChange={e => handleApplyView(JSON.parse(e.target.value))} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm">
                    <option>Saved Views</option>
                    {savedViews.map(view => <option key={view.id} value={JSON.stringify(view)}>{view.name}</option>)}
                </select>
            </div>
            {isLoading ? <div className="text-center text-dark-text-secondary p-8">Loading Assets...</div> :
                <Table columns={columns} data={assets} onRowClick={(item) => onNavigate({type: 'detail', id: item.id})} />
            }
            {/* Modals go here */}
             <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Scan Asset Barcode">
                <CameraScanner onScan={onScan} onCancel={() => setIsScannerOpen(false)} />
            </Modal>
             <Modal isOpen={isFiltersModalOpen} onClose={() => setIsFiltersModalOpen(false)} title="Advanced Filters">
                 <div className="space-y-4">
                     <h4 className="font-semibold text-dark-text">Purchase Date</h4>
                     <div className="grid grid-cols-2 gap-2">
                         <input type="date" name="purchaseDateStart" value={filters.purchaseDateStart} onChange={handleFilterChange} className="bg-dark-bg border-dark-border rounded-md p-2"/>
                         <input type="date" name="purchaseDateEnd" value={filters.purchaseDateEnd} onChange={handleFilterChange} className="bg-dark-bg border-dark-border rounded-md p-2"/>
                     </div>
                     <h4 className="font-semibold text-dark-text">Warranty Expiration Date</h4>
                     <div className="grid grid-cols-2 gap-2">
                         <input type="date" name="warrantyExpireStart" value={filters.warrantyExpireStart} onChange={handleFilterChange} className="bg-dark-bg border-dark-border rounded-md p-2"/>
                         <input type="date" name="warrantyExpireEnd" value={filters.warrantyExpireEnd} onChange={handleFilterChange} className="bg-dark-bg border-dark-border rounded-md p-2"/>
                     </div>
                     <label className="flex items-center"><input type="checkbox" name="hasUpcomingPM" checked={filters.hasUpcomingPM} onChange={handleFilterChange} className="mr-2"/> Has Upcoming PM</label>
                      <div className="flex justify-between items-center pt-4 border-t border-dark-border">
                         <Button variant="ghost" onClick={() => setIsNewViewModalOpen(true)}>Save as New View</Button>
                         <Button onClick={() => setIsFiltersModalOpen(false)}>Apply Filters</Button>
                      </div>
                 </div>
            </Modal>
             <Modal isOpen={isNewViewModalOpen} onClose={() => setIsNewViewModalOpen(false)} title="Save Filter View">
                 <input type="text" value={newViewName} onChange={e => setNewViewName(e.target.value)} placeholder="View Name" className="w-full bg-dark-bg border-dark-border p-2 rounded-md"/>
                 <div className="flex justify-end space-x-2 mt-4">
                     <Button variant="ghost" onClick={() => setIsNewViewModalOpen(false)}>Cancel</Button>
                     <Button onClick={handleSaveView}>Save</Button>
                 </div>
            </Modal>
        </Card>
    );
};

const AssetDetailView: React.FC<{ assetId: string; onBack: () => void }> = ({ assetId, onBack }) => {
    const [asset, setAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
    const { user } = useInternalAuth();
    
    const fetchAsset = () => {
        setIsLoading(true);
        api.getAssetById(assetId).then(setAsset).finally(() => setIsLoading(false));
    };
    
    useEffect(fetchAsset, [assetId]);
    
    useEffect(() => {
        if(isCheckoutModalOpen) {
            api.getPersonnelList().then(p => {
                setPersonnel(p);
                if (p.length > 0) setSelectedPersonnelId(p[0].id);
            });
        }
    }, [isCheckoutModalOpen]);
    
    const handleCheckout = async () => {
        if (!user) return;
        await api.checkoutAssetToPersonnel(assetId, selectedPersonnelId, user);
        fetchAsset();
        setIsCheckoutModalOpen(false);
    };

    const handleCheckin = async () => {
        if (!user) return;
        await api.checkinAsset(assetId, user);
        fetchAsset();
    };

    const handleUpdateAsset = async (updatedData: Partial<Asset>) => {
        await api.updateAsset(assetId, updatedData);
        fetchAsset();
        setIsEditModalOpen(false);
    }
    
    const handleDeleteAsset = async () => {
        if (window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
            await api.deleteAsset(assetId);
            onBack();
        }
    };

    if (isLoading || !asset) {
        return <div className="text-center text-dark-text-secondary p-8">Loading Asset Details...</div>
    }

    const isKit = asset.category === 'Kit';
    
    const TABS = [
        { label: 'Overview', content: <OverviewTab asset={asset} /> },
        { label: 'Maintenance', content: <MaintenanceTab asset={asset} onUpdate={fetchAsset} /> },
        { label: isKit ? 'Kit Inventory' : 'Components', content: <ComponentsTab asset={asset} onUpdate={fetchAsset}/> },
        { label: 'Media & Docs', content: <MediaAndDocsTab asset={asset} onUpdate={fetchAsset}/> },
    ];
    
    return (
        <div className="space-y-4">
            <Button onClick={onBack} variant="ghost" size="sm" icon={<ArrowLeftIcon className="h-4 w-4 mr-2"/>}>Back to List</Button>
            <Card>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-dark-text-secondary">{asset.assetType} / {asset.category}</p>
                        <h2 className="text-2xl font-bold text-dark-text">{asset.name}</h2>
                        <p className="text-dark-text-secondary font-mono">{asset.serialNumber}</p>
                    </div>
                    <div className="text-right">
                         <span className={`px-3 py-1 text-sm font-semibold rounded-full ${asset.status === 'In Use' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {asset.status}
                        </span>
                        <p className="text-sm text-dark-text-secondary mt-1">Assigned to: {asset.assignedToName || 'Storage'}</p>
                    </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    {asset.status === 'In Storage' && <Button onClick={() => setIsCheckoutModalOpen(true)}>Checkout</Button>}
                    {asset.status === 'In Use' && <Button onClick={handleCheckin}>Check-in to Storage</Button>}
                    <Button variant="ghost" onClick={() => setIsEditModalOpen(true)}>Edit</Button>
                </div>
            </Card>
            <Card>
                <Tabs tabs={TABS} />
            </Card>

            <Modal title="Checkout Asset" isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)}>
                <div className="space-y-4">
                    <p>Select personnel to checkout "{asset.name}" to:</p>
                    <select value={selectedPersonnelId} onChange={e => setSelectedPersonnelId(e.target.value)} className="w-full bg-dark-bg border-dark-border rounded-md p-2">
                        {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="flex justify-end space-x-2"><Button variant="ghost" onClick={() => setIsCheckoutModalOpen(false)}>Cancel</Button><Button onClick={handleCheckout}>Checkout</Button></div>
                </div>
            </Modal>
        </div>
    );
};

// Main parent component for the Assets module
const Assets: React.FC = () => {
    type ViewState = { type: 'dashboard' } | { type: 'list' } | { type: 'detail', id: string };
    const [view, setView] = useState<ViewState>({ type: 'dashboard' });

    const handleNavigate = (newView: ViewState) => {
        setView(newView);
    };

    const renderView = () => {
        switch (view.type) {
            case 'dashboard':
                return <DashboardView onNavigate={handleNavigate} />;
            case 'detail':
                return <AssetDetailView assetId={view.id} onBack={() => handleNavigate({ type: 'list' })} />;
            case 'list':
            default:
                return <AssetListView onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-2xl font-bold">Asset Management</h1>
                 <div className="flex space-x-2">
                    <Button variant={view.type === 'dashboard' ? 'primary' : 'ghost'} onClick={() => handleNavigate({type: 'dashboard'})} icon={<LayoutDashboardIcon className="h-4 w-4" />}/>
                    <Button variant={view.type === 'list' ? 'primary' : 'ghost'} onClick={() => handleNavigate({type: 'list'})} icon={<ListChecksIcon className="h-4 w-4" />}/>
                 </div>
            </div>
            {renderView()}
        </div>
    );
};

export default Assets;



import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import * as api from '../services/api';
import { Consumable, ConsumableUsageLog } from '../types';
import { PlusIcon, EditIcon, XIcon, SearchIcon, FilterIcon, PrinterIcon, BarcodeIcon, FileTextIcon, ListChecksIcon, LayoutDashboardIcon } from '../components/icons/Icons';
import { useInternalAuth } from '../hooks/useInternalAuth';

type InventoryView = 'dashboard' | 'list' | 'audit';
type ItemStatus = 'ok' | 'low' | 'expiring' | 'expired';

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


// --- Dashboard View ---
const InventoryDashboard: React.FC<{ consumables: Consumable[], onNavigate: (view: InventoryView) => void }> = ({ consumables, onNavigate }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        let needsReorder = 0;
        let expiringSoon = 0;

        const categoryCounts = consumables.reduce((acc, item) => {
            if (item.quantity <= item.reorderLevel) needsReorder++;
            if (item.expirationDate) {
                const expDate = new Date(item.expirationDate);
                if (expDate > now && expDate <= thirtyDaysFromNow) expiringSoon++;
            }
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            needsReorder,
            expiringSoon,
            categoryDistribution: Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
        };
    }, [consumables]);

    const StatCard: React.FC<{ title: string; value: number, color: string }> = ({ title, value, color }) => (
         <div className={`p-4 rounded-lg border ${color}`}>
            <p className="text-sm font-medium text-dark-text-secondary">{title}</p>
            <p className="text-3xl font-bold text-dark-text">{value}</p>
        </div>
    );
    
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Items Needing Reorder" value={stats.needsReorder} color="border-yellow-500 bg-yellow-500/10" />
                <StatCard title="Expiring Soon / Expired" value={stats.expiringSoon} color="border-red-500 bg-red-500/10" />
            </div>
             <Card title="Inventory Distribution by Category">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={stats.categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                             {stats.categoryDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

// --- Inventory List View ---
const InventoryList: React.FC<{ consumables: Consumable[], onUpdate: () => void, user: any }> = ({ consumables, onUpdate, user }) => {
    const [filters, setFilters] = useState({ searchTerm: '', category: 'All', status: 'All' as ItemStatus | 'All' });
    const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Consumable | null>(null);
    const [editData, setEditData] = useState<Partial<Consumable>>({});
    const [adjustData, setAdjustData] = useState({ quantity: 0, reason: '' });
    
    const itemStatus = (item: Consumable): ItemStatus => {
        const now = new Date();
        if (item.expirationDate && new Date(item.expirationDate) < now) return 'expired';
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (item.expirationDate && new Date(item.expirationDate) <= thirtyDaysFromNow) return 'expiring';
        if (item.quantity <= item.reorderLevel) return 'low';
        return 'ok';
    };
    
    const filteredConsumables = useMemo(() => {
        return consumables
            .map(c => ({ ...c, status: itemStatus(c) }))
            .filter(item => {
                const termMatch = debouncedSearchTerm ? item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) : true;
                const categoryMatch = filters.category === 'All' || item.category === filters.category;
                const statusMatch = filters.status === 'All' || item.status === filters.status;
                return termMatch && categoryMatch && statusMatch;
            });
    }, [consumables, debouncedSearchTerm, filters]);

    const categories = useMemo(() => ['All', ...new Set(consumables.map(c => c.category))], [consumables]);

    const handleOpenEditModal = (item: Consumable | null) => {
        setSelectedItem(item);
        setEditData(item ? { id: item.id, name: item.name, category: item.category, reorderLevel: item.reorderLevel, expirationDate: item.expirationDate } : { name: '', category: 'Medical', reorderLevel: 10, quantity: 0 });
        setIsEditModalOpen(true);
    };
    
    const handleSaveItem = async () => {
        try {
            if (selectedItem) {
                await api.updateConsumable(selectedItem.id, editData);
            } else {
                await api.createConsumable(editData as any);
            }
            onUpdate();
            setIsEditModalOpen(false);
        } catch(e) { alert('Failed to save item.'); }
    };
    
    const handleDeleteItem = async (id: string) => {
        if(window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            await api.deleteConsumable(id);
            onUpdate();
        }
    };
    
    const handleOpenAdjustModal = (item: Consumable) => {
        setSelectedItem(item);
        setAdjustData({ quantity: item.quantity, reason: '' });
        setIsAdjustModalOpen(true);
    };

    const handleAdjustStock = async () => {
        if(!selectedItem || !adjustData.reason) {
            alert('A reason for the adjustment is required.');
            return;
        }
        const change = adjustData.quantity - selectedItem.quantity;
        if(change === 0) {
            setIsAdjustModalOpen(false);
            return;
        }
        await api.logConsumableUsage(selectedItem.id, change, adjustData.reason, user.id);
        onUpdate();
        setIsAdjustModalOpen(false);
    };

    const handleOpenHistoryModal = (item: Consumable) => {
        setSelectedItem(item);
        setIsHistoryModalOpen(true);
    };
    
    const statusPill = (status: ItemStatus) => {
        const styles: Record<ItemStatus, string> = {
            ok: 'bg-green-500/20 text-green-400',
            low: 'bg-yellow-500/20 text-yellow-400',
            expiring: 'bg-orange-500/20 text-orange-400',
            expired: 'bg-red-500/20 text-red-400',
        };
        return <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    }

    const columns = [
        { header: 'Item Name', accessor: (item) => item.name },
        { header: 'Category', accessor: (item) => item.category },
        { header: 'Quantity', accessor: (item) => (
            <button onClick={() => handleOpenAdjustModal(item)} className="hover:underline">{item.quantity}</button>
        )},
        { header: 'Reorder At', accessor: (item) => item.reorderLevel },
        { header: 'Expires', accessor: (item) => item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A' },
        { header: 'Status', accessor: (item) => statusPill(item.status) },
        { header: 'Actions', accessor: (item) => (
            <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(item)}><EditIcon className="h-4 w-4"/></Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenHistoryModal(item)}><FileTextIcon className="h-4 w-4"/></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}><XIcon className="h-4 w-4 text-red-500"/></Button>
            </div>
        )},
    ];
    
    const reorderItems = consumables.filter(c => c.quantity <= c.reorderLevel);

    return (
      <div className="space-y-4">
          <div className="p-4 bg-dark-card rounded-lg flex items-center space-x-4">
            <div className="relative flex-grow">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-text-secondary" />
                <input type="text" placeholder="Search items..." value={filters.searchTerm} onChange={e => setFilters({...filters, searchTerm: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-md py-2 pl-10 pr-4 text-dark-text" />
            </div>
             <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text">
                {categories.map(c => <option key={c}>{c}</option>)}
            </select>
             <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text">
                <option>All</option>
                <option value="ok">OK</option>
                <option value="low">Low Stock</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
            </select>
            <Button onClick={() => handleOpenEditModal(null)} icon={<PlusIcon className="h-4 w-4 mr-1"/>}>New Item</Button>
            <Button onClick={() => setIsReorderModalOpen(true)} variant="secondary" icon={<PrinterIcon className="h-4 w-4 mr-1"/>}>Reorder Report</Button>
        </div>
        <Table columns={columns} data={filteredConsumables} />

        {/* Edit/Add Modal */}
        <Modal title={selectedItem ? 'Edit Item' : 'Add New Item'} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <div className="space-y-4">
                <input type="text" placeholder="Item Name" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-dark-bg border-dark-border rounded p-2"/>
                <select value={editData.category || 'Medical'} onChange={e => setEditData({...editData, category: e.target.value as any})} className="w-full bg-dark-bg border-dark-border rounded p-2">
                    <option>Medical</option><option>Station Supplies</option><option>Rescue</option>
                </select>
                <input type="number" placeholder="Reorder Level" value={editData.reorderLevel || ''} onChange={e => setEditData({...editData, reorderLevel: Number(e.target.value)})} className="w-full bg-dark-bg border-dark-border rounded p-2"/>
                {!selectedItem && <input type="number" placeholder="Initial Quantity" value={editData.quantity || ''} onChange={e => setEditData({...editData, quantity: Number(e.target.value)})} className="w-full bg-dark-bg border-dark-border rounded p-2"/>}
                <div>
                    <label className="text-sm text-dark-text-secondary">Expiration Date (optional)</label>
                    <input type="date" value={editData.expirationDate?.split('T')[0] || ''} onChange={e => setEditData({...editData, expirationDate: e.target.value})} className="w-full bg-dark-bg border-dark-border rounded p-2"/>
                </div>
                 <div className="flex justify-end space-x-2"><Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button onClick={handleSaveItem}>Save</Button></div>
            </div>
        </Modal>

        {/* Adjust Stock Modal */}
        <Modal title={`Adjust Stock: ${selectedItem?.name}`} isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)}>
            <div className="space-y-4">
                <input type="number" placeholder="New Quantity" value={adjustData.quantity} onChange={e => setAdjustData({...adjustData, quantity: Number(e.target.value)})} className="w-full bg-dark-bg border-dark-border rounded p-2"/>
                <input type="text" placeholder="Reason for change (e.g., Restock, Used on call)" value={adjustData.reason} onChange={e => setAdjustData({...adjustData, reason: e.target.value})} className="w-full bg-dark-bg border-dark-border rounded p-2"/>
                <div className="flex justify-end space-x-2"><Button variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button><Button onClick={handleAdjustStock}>Adjust Stock</Button></div>
            </div>
        </Modal>

        {/* History Modal */}
        <Modal title={`History for ${selectedItem?.name}`} isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)}>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {selectedItem?.usageHistory?.length ? selectedItem.usageHistory.map(log => (
                    <li key={log.id} className="p-2 bg-dark-bg rounded text-sm">
                        <p><span className="font-bold">{new Date(log.date).toLocaleString()}:</span> <span className={log.change > 0 ? 'text-green-400' : 'text-red-400'}>{log.change > 0 ? `+${log.change}`: log.change}</span></p>
                        <p className="text-dark-text-secondary pl-2"> - {log.reason} (by {log.userName})</p>
                    </li>
                )) : <p className="text-dark-text-secondary text-center">No history for this item.</p>}
            </ul>
        </Modal>
        
        {/* Reorder Report Modal */}
        <Modal title="Reorder Report" isOpen={isReorderModalOpen} onClose={() => setIsReorderModalOpen(false)}>
            <div className="printable-content">
                <h3 className="text-xl font-bold text-dark-text mb-4">Items to Reorder</h3>
                <table className="w-full text-left">
                    <thead className="border-b-2 border-dark-border"><tr className="text-dark-text-secondary"><th>Item</th><th>Current Qty</th><th>Reorder At</th><th>Suggested Order</th></tr></thead>
                    <tbody className="divide-y divide-dark-border">
                        {reorderItems.map(item => (
                            <tr key={item.id} className="text-dark-text">
                                <td className="py-2">{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{item.reorderLevel}</td>
                                <td>{Math.max(1, (item.reorderLevel * 2) - item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end mt-4"><Button onClick={() => window.print()}>Print</Button></div>
        </Modal>
      </div>
    );
};

// --- Cycle Count / Audit View ---
const InventoryAudit: React.FC<{ consumables: Consumable[], onUpdate: () => void, user: any }> = ({ consumables, onUpdate, user }) => {
    const [scannedItems, setScannedItems] = useState<Record<string, number>>({});
    const [discrepancyReport, setDiscrepancyReport] = useState<any[] | null>(null);
    const scannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scannerInputRef.current?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && scannerInputRef.current && scannerInputRef.current.value) {
                const scannedId = scannerInputRef.current.value.trim();
                setScannedItems(prev => ({ ...prev, [scannedId]: (prev[scannedId] || 0) + 1 }));
                scannerInputRef.current.value = '';
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleCompare = () => {
        const report: any[] = [];
        const allItemIds = new Set([...consumables.map(c => c.id), ...Object.keys(scannedItems)]);
        
        allItemIds.forEach(id => {
            const systemItem = consumables.find(c => c.id === id);
            const scannedQty = scannedItems[id] || 0;
            const systemQty = systemItem?.quantity || 0;
            
            if (scannedQty !== systemQty) {
                report.push({
                    id,
                    name: systemItem?.name || `Unknown Item (ID: ${id})`,
                    system: systemQty,
                    scanned: scannedQty,
                    delta: scannedQty - systemQty,
                });
            }
        });
        setDiscrepancyReport(report);
    };
    
    const handleReconcile = async () => {
        if (!discrepancyReport) return;
        for (const item of discrepancyReport) {
            await api.logConsumableUsage(item.id, item.delta, 'Cycle Count Audit', user.id);
        }
        onUpdate();
        setDiscrepancyReport(null);
        setScannedItems({});
        alert('Inventory reconciled successfully!');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input ref={scannerInputRef} className="opacity-0 w-0 h-0 absolute" />
            <Card title="Scanned Items">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.keys(scannedItems).map(id => {
                        const item = consumables.find(c => c.id === id);
                        return <div key={id} className="flex justify-between p-2 bg-dark-bg rounded"><span>{item?.name || `Unknown (${id})`}</span><span className="font-bold">{scannedItems[id]}</span></div>
                    })}
                    {Object.keys(scannedItems).length === 0 && <p className="text-center text-dark-text-secondary py-4">Scan items to begin...</p>}
                </div>
                <div className="flex justify-between mt-4">
                    <Button variant="ghost" onClick={() => setScannedItems({})}>Clear Scans</Button>
                    <Button onClick={handleCompare}>Compare with System</Button>
                </div>
            </Card>
            <Card title="Discrepancy Report">
                 {discrepancyReport ? (
                    <>
                        <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {discrepancyReport.map(item => (
                             <li key={item.id} className="p-2 bg-dark-bg rounded">
                                <p className="font-bold">{item.name}</p>
                                <p className="text-sm text-dark-text-secondary">System: {item.system}, Scanned: {item.scanned} <span className={item.delta > 0 ? 'text-green-400' : 'text-red-400'}>({item.delta > 0 ? '+':''}{item.delta})</span></p>
                             </li>
                        ))}
                        {discrepancyReport.length === 0 && <p className="text-center text-dark-text-secondary py-4">No discrepancies found!</p>}
                        </ul>
                         {discrepancyReport.length > 0 && <Button onClick={handleReconcile} className="w-full mt-4">Reconcile Inventory</Button>}
                    </>
                 ) : (
                    <p className="text-center text-dark-text-secondary py-8">Click "Compare with System" to generate a report.</p>
                 )}
            </Card>
        </div>
    );
};


// --- Main Inventory Component ---
const Inventory: React.FC = () => {
    const [consumables, setConsumables] = useState<Consumable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<InventoryView>('dashboard');
    const { user } = useInternalAuth();

    const fetchData = () => {
        setIsLoading(true);
        api.getConsumables().then(setConsumables).finally(() => setIsLoading(false));
    };

    useEffect(fetchData, []);

    if (isLoading || !user) return <div className="text-center p-8 text-dark-text-secondary">Loading consumables...</div>;

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <InventoryDashboard consumables={consumables} onNavigate={setView} />;
            case 'list':
                return <InventoryList consumables={consumables} onUpdate={fetchData} user={user} />;
            case 'audit':
                return <InventoryAudit consumables={consumables} onUpdate={fetchData} user={user} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h1 className="text-2xl font-bold">Inventory Management</h1>
                 <div className="flex space-x-2">
                    <Button variant={view === 'dashboard' ? 'primary' : 'ghost'} onClick={() => setView('dashboard')} icon={<LayoutDashboardIcon className="h-4 w-4" />}/>
                    <Button variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')} icon={<ListChecksIcon className="h-4 w-4" />}/>
                    <Button variant={view === 'audit' ? 'primary' : 'ghost'} onClick={() => setView('audit')} icon={<BarcodeIcon className="h-4 w-4" />}/>
                 </div>
            </div>
            {renderView()}
        </div>
    );
};

export default Inventory;


import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import * as api from '../services/api';
import { Budget, LineItem } from '../types';
import { PlusIcon, EditIcon, XIcon } from '../components/icons/Icons';

const StatCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className }) => (
    <div className={`bg-dark-bg p-4 rounded-lg border border-dark-border ${className}`}>
        <p className="text-sm font-medium text-dark-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-dark-text">{value}</p>
    </div>
);

const BudgetBar: React.FC<{ budget: number, spent: number}> = ({ budget, spent }) => {
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = percentage > 100;
    
    return (
        <div className="w-full bg-dark-bg rounded-full h-6 border border-dark-border">
            <div 
                className={`h-6 rounded-full ${isOverBudget ? 'bg-red-600' : 'bg-green-600'}`}
                style={{ width: `${Math.min(percentage, 100)}%`}}
            ></div>
            {isOverBudget && (
                 <div 
                    className="absolute h-6 top-0 bg-yellow-500 rounded-full"
                    style={{ width: `${percentage - 100}%`, left: '100%'}}
                ></div>
            )}
        </div>
    )
}

const Budgeting: React.FC = () => {
    const [budget, setBudget] = useState<Budget | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LineItem | null>(null);
    const [modalData, setModalData] = useState({ category: '', budgetedAmount: '' });

    const fetchBudget = () => {
        setIsLoading(true);
        api.getBudgetData()
            .then(setBudget)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchBudget();
    }, []);
    
    const openAddModal = () => {
        setEditingItem(null);
        setModalData({ category: '', budgetedAmount: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (item: LineItem) => {
        setEditingItem(item);
        setModalData({ category: item.category, budgetedAmount: String(item.budgetedAmount) });
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const itemData = {
            category: modalData.category,
            budgetedAmount: parseFloat(modalData.budgetedAmount) || 0,
        };
        try {
            if (editingItem) {
                await api.updateLineItem(editingItem.id, itemData);
            } else {
                await api.addLineItemToBudget(itemData);
            }
            setIsModalOpen(false);
            fetchBudget();
        } catch (error) {
            alert(`Failed to ${editingItem ? 'update' : 'add'} line item.`);
        }
    };
    
    const handleDeleteItem = async (itemId: string) => {
        if (window.confirm("Are you sure you want to delete this line item?")) {
            try {
                await api.deleteLineItem(itemId);
                fetchBudget();
            } catch (error) {
                alert("Failed to delete line item.");
            }
        }
    };

    const getVarianceColor = (variance: number) => {
        if (variance > 0) return 'text-green-400';
        if (variance < 0) return 'text-red-400';
        return 'text-dark-text-secondary';
    };

    const columns = [
        { header: 'Category', accessor: (item: LineItem) => item.category },
        { header: 'Budgeted', accessor: (item: LineItem) => `$${item.budgetedAmount.toLocaleString()}` },
        { header: 'Spent', accessor: (item: LineItem) => `$${item.actualAmount.toLocaleString()}` },
        {
            header: 'Variance',
            accessor: (item: LineItem) => {
                const variance = item.budgetedAmount - item.actualAmount;
                return (
                    <span className={getVarianceColor(variance)}>
                        {variance < 0 ? `-$${Math.abs(variance).toLocaleString()}` : `$${variance.toLocaleString()}`}
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            accessor: (item: LineItem) => (
                <div className="flex space-x-2">
                    <Button onClick={() => openEditModal(item)} variant="ghost" className="p-1 h-7 w-7"><EditIcon className="h-4 w-4" /></Button>
                    <Button onClick={() => handleDeleteItem(item.id)} variant="ghost" className="p-1 h-7 w-7"><XIcon className="h-4 w-4 text-red-500" /></Button>
                </div>
            )
        }
    ];
    
    if (isLoading || !budget) {
        return <div className="text-center p-8 text-dark-text-secondary">Loading budget data...</div>
    }

    return (
        <>
            <div className="space-y-6">
                <Card title={`Fiscal Year ${budget.fiscalYear} Budget Overview`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard title="Total Budget" value={`$${budget.totalBudget.toLocaleString()}`} />
                        <StatCard title="Total Spent" value={`$${budget.totalSpent.toLocaleString()}`} />
                        <StatCard 
                            title="Remaining" 
                            value={`$${(budget.totalBudget - budget.totalSpent).toLocaleString()}`}
                            className={budget.totalSpent > budget.totalBudget ? 'bg-red-500/10 border-red-500' : 'bg-green-500/10 border-green-500'}
                        />
                    </div>
                    <div className="relative">
                        <BudgetBar budget={budget.totalBudget} spent={budget.totalSpent} />
                    </div>
                </Card>
                
                <Card 
                    title="Budget Line Items"
                    actions={<Button onClick={openAddModal} icon={<PlusIcon className="h-4 w-4 mr-2"/>}>Add Line Item</Button>}
                >
                    <Table columns={columns} data={budget.lineItems} />
                </Card>
            </div>

            <Modal title={editingItem ? "Edit Line Item" : "Add New Line Item"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleModalSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-dark-text-secondary mb-1">Category Name</label>
                        <input id="category" type="text" value={modalData.category} onChange={(e) => setModalData({...modalData, category: e.target.value})} required className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="budgetedAmount" className="block text-sm font-medium text-dark-text-secondary mb-1">Budgeted Amount</label>
                        <input id="budgetedAmount" type="number" value={modalData.budgetedAmount} onChange={(e) => setModalData({...modalData, budgetedAmount: e.target.value})} required className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., 50000" />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Item</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Budgeting;
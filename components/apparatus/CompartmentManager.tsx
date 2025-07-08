

import React, { useState, useEffect } from 'react';
import { MOCK_ASSETS } from '../../constants';
import { Apparatus, Asset, Compartment, SubCompartment } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { EditIcon, PlusIcon, SaveIcon, XIcon, ArchiveIcon } from '../icons/Icons';
import * as api from '../../services/api';

type Side = 'driver' | 'passenger' | 'rear';

interface CompartmentManagerProps {
    apparatus: Apparatus;
    onUpdate: (updatedApparatus: Apparatus) => void;
}

const ApparatusSchematic: React.FC<{ side: Side, children: React.ReactNode }> = ({ side, children }) => (
    <div className="bg-gray-800/30 p-4 rounded-lg border border-dark-border select-none">
        <div className="flex flex-col">
            {/* Top structure */}
            <div className="h-4 bg-gray-600 rounded-t-md w-full mx-auto" style={{ backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%, transparent 75%, #374151 75%, #374151), linear-gradient(45deg, #374151 25%, transparent 25%, transparent 75%, #374151 75%, #374151)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
            {/* Main body */}
            <div className={`bg-gray-700 border-x-2 border-b-2 border-gray-600 p-2 flex items-stretch space-x-2 ${side === 'rear' ? 'rounded-b-lg' : ''}`}>
                {side === 'driver' && <div className="w-1/6 bg-gray-600 rounded-bl-md p-2 flex flex-col justify-between"><div className="w-full h-1/2 bg-gray-500/30 rounded-md border border-gray-500"></div><div className="w-full h-1/4 bg-gray-500/20 rounded-md"></div></div>}
                <div className="flex-1 flex flex-col space-y-2">{children}</div>
                {side === 'passenger' && <div className="w-1/6 bg-gray-600 rounded-br-md p-2 flex flex-col justify-between"><div className="w-full h-1/2 bg-gray-500/30 rounded-md border border-gray-500"></div><div className="w-full h-1/4 bg-gray-500/20 rounded-md"></div></div>}
            </div>
             {/* Chassis and Wheels */}
            {side !== 'rear' && (
                 <div className="relative h-12 bg-gray-600 rounded-b-md">
                     <div className="absolute -bottom-1 left-[18%] w-16 h-8 bg-gray-800 rounded-b-full border-x-4 border-b-4 border-gray-900 z-10"></div>
                     <div className="absolute -bottom-1 right-[15%] w-16 h-8 bg-gray-800 rounded-b-full border-x-4 border-b-4 border-gray-900 z-10"></div>
                </div>
            )}
        </div>
    </div>
);

const AddCompartmentButton: React.FC<{onClick: () => void}> = ({ onClick }) => (
    <div className="flex-shrink-0 flex items-center justify-center p-2">
        <button onClick={onClick} className="h-full w-16 bg-dark-bg/50 border-2 border-dashed border-dark-border rounded-lg flex items-center justify-center hover:bg-dark-border transition-colors">
            <PlusIcon className="h-8 w-8 text-dark-text-secondary"/>
        </button>
    </div>
);

export const CompartmentManager: React.FC<CompartmentManagerProps> = ({ apparatus, onUpdate }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [compartments, setCompartments] = useState<Compartment[]>(apparatus.compartments);
    const [currentSide, setCurrentSide] = useState<Side>('driver');
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [selectedSubCompartment, setSelectedSubCompartment] = useState<SubCompartment | null>(null);
    const [unassignedAssets, setUnassignedAssets] = useState<Asset[]>([]);

    useEffect(() => {
        setCompartments(apparatus.compartments);
    }, [apparatus]);
    
    useEffect(() => {
        if (isAssetModalOpen) {
            api.getUnassignedAssets().then(setUnassignedAssets);
        }
    }, [isAssetModalOpen]);

    const handleSaveLayout = async () => {
        try {
            const updatedApparatus = await api.updateApparatusCompartments(apparatus.id, compartments);
            onUpdate(updatedApparatus);
            setIsEditMode(false);
        } catch (e) {
            alert("Failed to save compartment layout.");
        }
    };
    
    const handleCancelEdit = () => {
        setCompartments(apparatus.compartments);
        setIsEditMode(false);
    };

    const handleOpenAssetModal = (subCompartment: SubCompartment) => {
        setSelectedSubCompartment(subCompartment);
        setIsAssetModalOpen(true);
    };
    
    const handleAssignAsset = async (assetId: string) => {
        if (!selectedSubCompartment) return;
        try {
            await api.assignAssetToCompartment(assetId, apparatus.id, selectedSubCompartment.id);
            const updatedApparatus = await api.getApparatusById(apparatus.id);
            if (updatedApparatus) onUpdate(updatedApparatus);
            setIsAssetModalOpen(false);
        } catch(e) {
            alert('Failed to assign asset.');
        }
    };

    const handleUnassignAsset = async (assetId: string) => {
        if (!window.confirm("Are you sure you want to unassign this asset and return it to storage?")) return;
        try {
            await api.unassignAsset(assetId, apparatus.id);
            const updatedApparatus = await api.getApparatusById(apparatus.id);
            if (updatedApparatus) onUpdate(updatedApparatus);
        } catch(e) {
            alert('Failed to unassign asset.');
        }
    };

    const handleAddCompartment = (level: 'top' | 'bottom') => {
        const newCompartment: Compartment = {
            id: `comp-new-${Date.now()}`,
            name: 'New Compartment',
            side: currentSide,
            level: level,
            size: 2,
            layout: { rows: 1, cols: 1 },
            subCompartments: []
        };
        setCompartments([...compartments, newCompartment]);
    };

    const handleCompartmentChange = (compId: string, field: 'name' | 'size', value: any) => {
        setCompartments(compartments.map(c => c.id === compId ? { ...c, [field]: field === 'size' ? Number(value) : value } : c));
    };

    const handleDeleteCompartment = (compId: string) => {
        if (window.confirm("Are you sure you want to delete this entire compartment and its contents?")) {
            setCompartments(compartments.filter(c => c.id !== compId));
        }
    };
    
    const handleAddSubCompartment = (compId: string) => {
        const newSub: SubCompartment = {
            id: `sub-new-${Date.now()}`, name: 'New Shelf', location: { row: 1, col: 1 }, assignedAssetIds: []
        };
        setCompartments(compartments.map(c => 
            c.id === compId ? { ...c, subCompartments: [...c.subCompartments, newSub] } : c
        ));
    };

    const renderCompartmentRow = (level: 'top' | 'bottom') => {
        const filteredCompartments = compartments.filter(c => c.side === currentSide && c.level === level);
        if (filteredCompartments.length === 0 && !isEditMode) return null;

        return (
            <div className="flex space-x-2">
                {filteredCompartments.map(comp => (
                    <div key={comp.id} className="bg-dark-bg/50 p-2 rounded-lg border border-dark-border flex flex-col" style={{ flexGrow: comp.size, flexBasis: 0 }}>
                        <div className="flex justify-between items-center mb-2">
                             {isEditMode ? (
                                <input type="text" value={comp.name} onChange={e => handleCompartmentChange(comp.id, 'name', e.target.value)} className="font-semibold text-dark-text bg-dark-card border border-dark-border p-1 rounded-md w-full" />
                            ) : (
                                <h4 className="font-semibold text-dark-text">{comp.name}</h4>
                            )}
                            {isEditMode && <Button variant="ghost" className="p-1 h-7 w-7 ml-2 flex-shrink-0" onClick={() => handleDeleteCompartment(comp.id)}><XIcon className="h-4 w-4 text-red-500"/></Button>}
                        </div>
                        {isEditMode && (
                             <div className="my-1">
                                <label className="text-xs text-dark-text-secondary">Size</label>
                                <input type="range" min="1" max="5" value={comp.size} onChange={e => handleCompartmentChange(comp.id, 'size', e.target.value)} className="w-full h-2 rounded-lg appearance-none cursor-pointer compartment-slider" />
                            </div>
                        )}
                        <div className="grid gap-1 flex-grow" style={{ gridTemplateColumns: `repeat(${comp.layout.cols}, 1fr)`, gridTemplateRows: `repeat(${comp.layout.rows}, 1fr)` }}>
                            {comp.subCompartments.map(sub => (
                                <div key={sub.id} className="bg-dark-card border border-dark-border rounded-md p-2 relative flex flex-col" style={{ gridRow: `span ${sub.location.rowSpan || 1}`, gridColumn: `span ${sub.location.colSpan || 1}` }}>
                                    <h5 className="font-semibold text-dark-text-secondary text-sm flex-shrink-0">{sub.name}</h5>
                                    <ul className="mt-1 space-y-0.5 overflow-y-auto flex-grow">
                                        {sub.assignedAssetIds.map(assetId => {
                                            const asset = MOCK_ASSETS.find(a => a.id === assetId);
                                            return asset ? (
                                                <li key={asset.id} className="flex items-center justify-between text-xs bg-dark-bg p-1 rounded group">
                                                    <span className="flex items-center truncate"><ArchiveIcon className="h-3 w-3 mr-1.5 flex-shrink-0"/> <span className="truncate">{asset.name}</span></span>
                                                    {!isEditMode && <button onClick={() => handleUnassignAsset(asset.id)} className="opacity-0 group-hover:opacity-100 p-0.5 flex-shrink-0"><XIcon className="h-3 w-3 text-red-400"/></button>}
                                                </li>
                                            ) : null
                                        })}
                                    </ul>
                                    {!isEditMode && <button onClick={() => handleOpenAssetModal(sub)} className="absolute bottom-1 right-1 text-dark-text-secondary hover:text-white"><PlusIcon className="h-5 w-5"/></button>}
                                </div>
                            ))}
                        </div>
                         {isEditMode && <Button onClick={() => handleAddSubCompartment(comp.id)} variant="ghost" className="mt-2 text-xs w-full">Add Shelf/Tray</Button>}
                    </div>
                ))}
                {isEditMode && <AddCompartmentButton onClick={() => handleAddCompartment(level)} />}
            </div>
        );
    }
    
    const SideButton:React.FC<{side: Side, label: string}> = ({side, label}) => (
        <button onClick={() => setCurrentSide(side)} className={`px-4 py-2 text-sm font-medium rounded-md ${currentSide === side ? 'bg-brand-primary text-white' : 'bg-dark-card text-dark-text-secondary hover:bg-dark-border'}`}>
            {label}
        </button>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex space-x-2 p-1 bg-dark-card rounded-lg border border-dark-border">
                   <SideButton side="driver" label="Driver Side" />
                   <SideButton side="passenger" label="Passenger Side" />
                   <SideButton side="rear" label="Rear" />
                </div>
                <div className="flex space-x-2">
                    {isEditMode && <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>}
                    <Button onClick={() => isEditMode ? handleSaveLayout() : setIsEditMode(true)} icon={isEditMode ? <SaveIcon className="h-4 w-4 mr-2" /> : <EditIcon className="h-4 w-4 mr-2" />}>
                        {isEditMode ? 'Save Layout' : 'Edit Layout'}
                    </Button>
                </div>
            </div>

            <ApparatusSchematic side={currentSide}>
                {renderCompartmentRow('top')}
                {renderCompartmentRow('bottom')}
            </ApparatusSchematic>
            
            {isAssetModalOpen && selectedSubCompartment && (
                <Modal title={`Assign Asset to ${selectedSubCompartment.name}`} isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)}>
                     <div className="space-y-2 max-h-80 overflow-y-auto">
                        {unassignedAssets.length > 0 ? unassignedAssets.map(asset => (
                            <li key={asset.id} className="flex justify-between items-center p-2 bg-dark-bg rounded-md">
                                <span>{asset.name} ({asset.serialNumber})</span>
                                <Button onClick={() => handleAssignAsset(asset.id)} className="py-1 px-2 text-xs">Assign</Button>
                            </li>
                        )) : <p className="text-center text-dark-text-secondary py-4">No unassigned assets available.</p>}
                    </ul>
                </Modal>
            )}
        </div>
    );
};
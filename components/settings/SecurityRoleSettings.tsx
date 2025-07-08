

import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../services/api';
import { SecurityRole } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { KeyIcon, PlusIcon } from '../icons/Icons';

const PERMISSIONS = [
    'View Personnel', 'Edit Personnel', 'View Apparatus', 'Edit Apparatus', 'Create Incident', 'Lock Incident', 'Delete Incident', 'Access Settings', 'Manage Users'
];

// Helper to get all permissions for a role, including inherited ones
const getRolePermissions = (roleId: string, allRoles: SecurityRole[]): { own: string[], inherited: string[] } => {
    const roleMap = new Map(allRoles.map(r => [r.id, r]));
    
    const collectPermissions = (currentId: string | null | undefined, collected: Set<string>): Set<string> => {
        if (!currentId) return collected;
        const currentRole = roleMap.get(currentId);
        if (!currentRole) return collected;

        currentRole.permissions.forEach(p => collected.add(p));
        return collectPermissions(currentRole.parentId, collected);
    };

    const role = roleMap.get(roleId);
    if (!role) return { own: [], inherited: [] };

    const ownPermissions = role.permissions;
    const inheritedPermissions = Array.from(collectPermissions(role.parentId, new Set()));

    return { own: ownPermissions, inherited: inheritedPermissions };
};


const SecurityRoleSettings: React.FC = () => {
    const [roles, setRoles] = useState<SecurityRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<SecurityRole | null>(null);

    const fetchRoles = () => {
        api.getSecurityRoles().then(setRoles).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleOpenModal = (role: SecurityRole | null) => {
        setSelectedRole(role || { id: '', name: '', permissions: [], parentId: null });
        setIsModalOpen(true);
    };

    const handlePermissionChange = (permission: string) => {
        if (!selectedRole) return;
        const newPermissions = selectedRole.permissions.includes(permission)
            ? selectedRole.permissions.filter(p => p !== permission)
            : [...selectedRole.permissions, permission];
        setSelectedRole({ ...selectedRole, permissions: newPermissions });
    };
    
    const handleParentChange = (parentId: string | null) => {
        if (!selectedRole) return;
        setSelectedRole({ ...selectedRole, parentId: parentId === 'none' ? null : parentId });
    };

    const handleSaveRole = async () => {
        if (!selectedRole || !selectedRole.name) {
            alert("Role Name is required.");
            return;
        }
        try {
            await api.updateSecurityRole(selectedRole);
            fetchRoles();
            setIsModalOpen(false);
        } catch (error) {
            alert('Failed to save security role.');
        }
    };

    const memoizedRolePermissions = useMemo(() => {
        if (!selectedRole) return { own: [], inherited: [] };
        // Create a temporary role list for calculation if the role is new
        const tempRoles = selectedRole.id ? roles : [...roles, selectedRole];
        return getRolePermissions(selectedRole.id, tempRoles);
    }, [selectedRole, roles]);


    if (isLoading) {
        return <div className="text-center p-8 text-dark-text-secondary">Loading security roles...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <p className="text-sm text-dark-text-secondary">Define custom security roles and their permissions across the system.</p>
                <Button onClick={() => handleOpenModal(null)} icon={<PlusIcon className="h-4 w-4 mr-2" />}>New Role</Button>
            </div>
            <div className="space-y-3">
                {roles.map(role => {
                    const { inherited } = getRolePermissions(role.id, roles);
                    const totalPermissions = new Set([...role.permissions, ...inherited]).size;
                    return (
                        <div key={role.id} className="bg-dark-bg p-4 rounded-lg border border-dark-border flex justify-between items-center">
                            <div className="flex items-center">
                                <KeyIcon className="h-6 w-6 mr-3 text-yellow-400" />
                                <div>
                                    <h4 className="font-bold text-dark-text">{role.name}</h4>
                                    <p className="text-xs text-dark-text-secondary">{totalPermissions} total permissions</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => handleOpenModal(role)}>Edit</Button>
                        </div>
                    );
                })}
            </div>

            {selectedRole && (
                <Modal title={selectedRole.id ? `Edit Role: ${selectedRole.name}` : 'Create New Role'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Role Name</label>
                            <input
                                type="text"
                                value={selectedRole.name}
                                onChange={e => setSelectedRole({...selectedRole, name: e.target.value})}
                                className="w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Parent Role (Inherits Permissions From)</label>
                            <select
                                value={selectedRole.parentId || 'none'}
                                onChange={(e) => handleParentChange(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text"
                            >
                                <option value="none">None</option>
                                {roles.filter(r => r.id !== selectedRole.id).map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Permissions</label>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-dark-bg border border-dark-border rounded-md max-h-60 overflow-y-auto">
                                {PERMISSIONS.map(permission => {
                                    const isInherited = memoizedRolePermissions.inherited.includes(permission);
                                    const isChecked = selectedRole.permissions.includes(permission) || isInherited;

                                    return (
                                        <label key={permission} className={`flex items-center space-x-2 ${isInherited ? 'opacity-60' : 'cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handlePermissionChange(permission)}
                                                disabled={isInherited}
                                                className="h-4 w-4 rounded border-gray-500 text-brand-primary focus:ring-transparent disabled:opacity-50"
                                            />
                                            <span className="text-dark-text-secondary text-sm">{permission} {isInherited && '(Inherited)'}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 space-x-2">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveRole}>Save Role</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SecurityRoleSettings;

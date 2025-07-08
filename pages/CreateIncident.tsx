

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { NfirsIncident, NfirsFireModule, NfirsStructureFireModule, NfirsEmsModule, NfirsHazmatModule, NfirsWildlandFireModule, NfirsArsonModule, NfirsCivilianCasualty, NfirsFireServiceCasualty, Role, Attachment, OptionalFieldConfig, Personnel } from '../types';
import { useInternalAuth } from '../hooks/useInternalAuth';
import NfirsBasicModule from '../components/incident/NfirsBasicModule';
import { BookOpenIcon, FlameIcon, HeartPulseIcon, ShieldIcon, BuildingIcon, BiohazardIcon, TreePineIcon, CaseSensitiveIcon, TruckIcon, UsersIcon, ShieldCheckIcon, UploadIcon, LockIcon, UnlockIcon, ArchiveIcon, ShieldAlertIcon } from '../components/icons/Icons';
import Button from '../components/ui/Button';
import ValidationErrors from '../components/incident/ValidationErrors';
import { validateNfirsIncident, ValidationError } from '../services/validationService';

// Import new module components
import NfirsFireModuleComponent from '../components/incident/modules/NfirsFireModule';
import NfirsStructureFireModuleComponent from '../components/incident/modules/NfirsStructureFireModule';
import NfirsEmsModuleComponent from '../components/incident/modules/NfirsEmsModule';
import NfirsCivilianCasualtyModule from '../components/incident/modules/NfirsCivilianCasualtyModule';
import NfirsFireServiceCasualtyModule from '../components/incident/modules/NfirsFireServiceCasualtyModule';
import NfirsHazmatModuleComponent from '../components/incident/modules/NfirsHazmatModule';
import NfirsWildlandFireModuleComponent from '../components/incident/modules/NfirsWildlandFireModule';
import NfirsArsonModuleComponent from '../components/incident/modules/NfirsArsonModule';
import NfirsAttachmentsModule from '../components/incident/modules/NfirsAttachmentsModule';
import NfirsApparatusModule from '../components/incident/modules/NfirsApparatusModule';
import NfirsPersonnelModule from '../components/incident/modules/NfirsPersonnelModule';
import NfirsSuppliesModule from '../components/incident/modules/NfirsSuppliesModule';


const CreateIncident: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useInternalAuth();

    const [incident, setIncident] = useState<NfirsIncident | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeModule, setActiveModule] = useState<string>('basic');
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [optionalFieldsConfig, setOptionalFieldsConfig] = useState<OptionalFieldConfig>({});
    const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);

    useEffect(() => {
        if (!id) {
            navigate('/app/incidents');
            return;
        }
        setIsLoading(true);
        Promise.all([
            api.getIncidentById(id),
            api.getConfiguration().then(c => c.optionalFields),
            api.getPersonnelList()
        ]).then(([incidentData, configData, personnelData]) => {
            if (incidentData) {
                setIncident(incidentData);
                setOptionalFieldsConfig(configData);
                setAllPersonnel(personnelData);
                setValidationErrors(validateNfirsIncident(incidentData, configData));
            } else {
                alert("Incident not found.");
                navigate('/app/incidents');
            }
        }).finally(() => setIsLoading(false));

    }, [id, navigate]);
    
    // This effect runs when the incident type changes to add/remove modules
    useEffect(() => {
        if (!incident) return;

        const type = incident.basicModule.incidentType;
        if (!type) return;
        
        const typePrefix = type.substring(0, 1);
        const wildlandCodes = ['140', '141', '142', '143', '160', '170', '171', '172', '173', '561', '631', '632'];

        setIncident(prev => {
            if (!prev) return null;
            const newIncident = api.createEmptyNfirsShellFrom(prev);

            // Conditionally add modules back
            if (wildlandCodes.includes(type)) {
                newIncident.wildlandFireModule = prev.wildlandFireModule || api.createEmptyModule('Wildland') as NfirsWildlandFireModule;
            } else if (typePrefix === '1') {
                newIncident.fireModule = prev.fireModule || api.createEmptyModule('Fire') as NfirsFireModule;
                if (['111', '112', '113', '114', '115', '116', '117', '118', '121', '122', '123'].includes(type)) {
                    newIncident.structureFireModule = prev.structureFireModule || api.createEmptyModule('Structure') as NfirsStructureFireModule;
                }
            }

            if (typePrefix === '3') {
                newIncident.emsModule = prev.emsModule || api.createEmptyModule('EMS') as NfirsEmsModule;
            }
            if (typePrefix === '4') {
                newIncident.hazmatModule = prev.hazmatModule || api.createEmptyModule('Hazmat') as NfirsHazmatModule;
            }
            if (typePrefix === '1') {
                 newIncident.arsonModule = prev.arsonModule || api.createEmptyModule('Arson') as NfirsArsonModule;
            }

            return newIncident;
        });

    }, [incident?.basicModule.incidentType]);

    const handleIncidentUpdate = (updatedData: Partial<NfirsIncident>) => {
        setIncident(prev => {
            if (!prev) return null;
            
            let newIncident = { ...prev, ...updatedData };

            // Auto-calculate casualties if the corresponding arrays are part of the update
            if (updatedData.civilianCasualties !== undefined) {
                newIncident.basicModule.sectionH = {
                    ...newIncident.basicModule.sectionH,
                    casualtiesCivilian: updatedData.civilianCasualties.length,
                };
            }
            if (updatedData.fireServiceCasualties !== undefined) {
                 newIncident.basicModule.sectionH = {
                    ...newIncident.basicModule.sectionH,
                    casualtiesFire: updatedData.fireServiceCasualties.length,
                };
            }

            // Auto-calculate resource counts
            if (updatedData.respondingApparatusIds !== undefined) {
                 newIncident.basicModule.sectionG = {
                    ...newIncident.basicModule.sectionG,
                    apparatusCount: updatedData.respondingApparatusIds.length,
                };
            }
             if (updatedData.respondingPersonnelIds !== undefined) {
                 const respondingPersonnel = allPersonnel.filter(p => updatedData.respondingPersonnelIds?.includes(p.id));
                 newIncident.basicModule.sectionG = {
                    ...newIncident.basicModule.sectionG,
                    // This is a simplified calculation. A real system might be more nuanced.
                    personnelSuppression: respondingPersonnel.length,
                    personnelEms: 0, 
                    personnelOther: 0,
                };
            }

            setValidationErrors(validateNfirsIncident(newIncident, optionalFieldsConfig));
            return newIncident;
        });
    };

    const handleSave = async () => {
        if (!incident) return;
        setIsSaving(true);
        try {
            await api.updateIncident(incident.id, incident, user);
            alert("Progress saved.");
        } catch (error) {
            alert("Failed to save progress.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleLock = async () => {
        if (!incident || !user) return;
        const errors = validateNfirsIncident(incident, optionalFieldsConfig);
        setValidationErrors(errors);
        if (errors.length > 0) {
            alert("Cannot lock report. Please resolve all validation issues first.");
            return;
        }

        if(window.confirm("Are you sure you want to lock this report? It can only be unlocked by an administrator.")) {
            setIsSaving(true);
            const updatedIncident: NfirsIncident = {
                ...incident,
                status: 'Locked',
                lockedBy: user.id,
                lockedAt: new Date().toISOString(),
            };
            try {
                await api.updateIncident(incident.id, updatedIncident, user);
                setIncident(updatedIncident);
                alert("Report locked.");
            } catch (error) {
                alert("Failed to lock report.");
            } finally {
                setIsSaving(false);
            }
        }
    }

    const handleUnlock = async () => {
        if (!incident || !user) return;
        setIsSaving(true);
        const updatedIncident: NfirsIncident = {
            ...incident,
            status: 'In Progress',
            lockedBy: undefined,
            lockedAt: undefined,
        };
        try {
            await api.updateIncident(incident.id, updatedIncident, user);
            setIncident(updatedIncident);
            alert("Report unlocked.");
        } catch (error) {
            alert("Failed to unlock report.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleNavigateToError = (moduleId: string, fieldId: string) => {
        setActiveModule(moduleId);
        // This is a simple implementation. A real one might scroll to the element.
        setTimeout(() => {
            const el = document.querySelector(`[name="${fieldId}"]`);
            if (el instanceof HTMLElement) {
                el.focus();
            }
        }, 100);
    }

    const availableModules = useMemo(() => {
        if (!incident) return [];
        const typePrefix = incident.basicModule.incidentType?.substring(0, 1);

        return [
            { id: 'basic', label: 'Basic', icon: BookOpenIcon, enabled: true },
            { id: 'apparatus', label: 'Apparatus', icon: TruckIcon, enabled: true },
            { id: 'personnel', label: 'Personnel', icon: UsersIcon, enabled: true },
            { id: 'supplies', label: 'Supplies Used', icon: ArchiveIcon, enabled: true },
            { id: 'fire', label: 'Fire', icon: FlameIcon, enabled: !!incident.fireModule },
            { id: 'structureFire', label: 'Structure Fire', icon: BuildingIcon, enabled: !!incident.structureFireModule },
            { id: 'wildland', label: 'Wildland', icon: TreePineIcon, enabled: !!incident.wildlandFireModule },
            { id: 'ems', label: 'EMS', icon: HeartPulseIcon, enabled: !!incident.emsModule },
            { id: 'hazmat', label: 'HazMat', icon: BiohazardIcon, enabled: !!incident.hazmatModule },
            { id: 'civilianCasualty', label: 'Civilian Casualty', icon: ShieldIcon, enabled: typePrefix && ['1', '2', '3', '4', '5'].includes(typePrefix) },
            { id: 'fireServiceCasualty', label: 'Fire Serv. Casualty', icon: ShieldCheckIcon, enabled: typePrefix && ['1', '2', '3', '4', '5'].includes(typePrefix) },
            { id: 'arson', label: 'Arson', icon: CaseSensitiveIcon, enabled: !!incident.arsonModule },
            { id: 'attachments', label: 'Attachments', icon: UploadIcon, enabled: true },
        ];
    }, [incident]);

    const isLocked = incident?.status === 'Locked';
    const canUnlock = user && (user.role === Role.CHIEF || user.role === Role.ADMINISTRATOR);

    const moduleErrors = useMemo(() => {
        return validationErrors.reduce((acc, err) => {
            if (err.moduleId === activeModule) {
                acc[err.fieldId] = err.message;
            }
            return acc;
        }, {} as Record<string, string>);
    }, [validationErrors, activeModule]);

    if (isLoading || !incident) {
        return <div className="text-center p-8 text-dark-text-secondary">Loading Incident Report...</div>;
    }

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-dark-card rounded-lg p-4 sticky top-24">
                    <h3 className="font-bold text-dark-text mb-1">Incident Report</h3>
                    <p className="text-xs text-dark-text-secondary mb-4">{incident.basicModule.sectionA.incidentNumber}</p>
                    <nav className="space-y-1">
                        {availableModules.map(module => (
                             <button
                                key={module.id}
                                onClick={() => setActiveModule(module.id)}
                                disabled={!module.enabled}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeModule === module.id
                                        ? 'bg-brand-primary text-white'
                                        : module.enabled 
                                            ? 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'
                                            : 'text-gray-600 cursor-not-allowed'
                                }`}
                            >
                                <module.icon className="h-5 w-5 mr-3" />
                                <span>{module.label}</span>
                            </button>
                        ))}
                    </nav>
                     <div className="mt-6 pt-4 border-t border-dark-border space-y-2">
                         <Button 
                            onClick={() => navigate(`/app/incidents/${id}/log-exposure`)} 
                            variant="ghost" 
                            className="w-full text-yellow-400 border-yellow-400 hover:bg-yellow-400/20"
                            icon={<ShieldAlertIcon className="h-4 w-4 mr-2" />}
                        >
                            Log Exposure
                        </Button>
                         {!isLocked && <Button onClick={handleSave} isLoading={isSaving} className="w-full">Save Progress</Button>}
                         {isLocked && canUnlock && <Button onClick={handleUnlock} variant="secondary" className="w-full" icon={<UnlockIcon className="h-4 w-4 mr-2" />}>Unlock Report</Button>}
                         {!isLocked && <Button onClick={handleLock} variant="secondary" className="w-full" disabled={validationErrors.length > 0} icon={<LockIcon className="h-4 w-4 mr-2" />}>Validate & Lock</Button>}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                 <ValidationErrors errors={validationErrors} onNavigate={handleNavigateToError} />
                 {isLocked && (
                    <div className="p-4 mb-4 text-yellow-100 bg-yellow-600/50 border border-yellow-500 rounded-md flex items-center space-x-3">
                        <LockIcon className="h-5 w-5" />
                        <p>This report is locked and cannot be edited. An administrator must unlock it to make changes.</p>
                    </div>
                 )}
                {activeModule === 'basic' && <NfirsBasicModule incidentData={incident.basicModule} onUpdate={(d) => handleIncidentUpdate({ basicModule: d })} isLocked={isLocked} errors={moduleErrors} />}
                {activeModule === 'fire' && incident.fireModule && <NfirsFireModuleComponent moduleData={incident.fireModule} onUpdate={(d) => handleIncidentUpdate({ fireModule: d })} isLocked={isLocked} errors={moduleErrors} basicInfo={incident.basicModule.sectionA} />}
                {activeModule === 'structureFire' && incident.structureFireModule && <NfirsStructureFireModuleComponent moduleData={incident.structureFireModule} onUpdate={(d) => handleIncidentUpdate({ structureFireModule: d })} isLocked={isLocked} errors={moduleErrors} basicInfo={incident.basicModule.sectionA} />}
                {activeModule === 'ems' && incident.emsModule && <NfirsEmsModuleComponent moduleData={incident.emsModule} onUpdate={(d) => handleIncidentUpdate({ emsModule: d })} isLocked={isLocked} errors={moduleErrors} basicInfo={incident.basicModule.sectionA} />}
                {activeModule === 'civilianCasualty' && <NfirsCivilianCasualtyModule basicInfo={incident.basicModule.sectionA} casualties={incident.civilianCasualties || []} onUpdate={(d: NfirsCivilianCasualty[]) => handleIncidentUpdate({ civilianCasualties: d })} isLocked={isLocked} />}
                {activeModule === 'fireServiceCasualty' && <NfirsFireServiceCasualtyModule basicInfo={incident.basicModule.sectionA} casualties={incident.fireServiceCasualties || []} onUpdate={(d: NfirsFireServiceCasualty[]) => handleIncidentUpdate({ fireServiceCasualties: d })} isLocked={isLocked} />}
                {activeModule === 'hazmat' && incident.hazmatModule && <NfirsHazmatModuleComponent moduleData={incident.hazmatModule} onUpdate={(d) => handleIncidentUpdate({ hazmatModule: d })} isLocked={isLocked} errors={moduleErrors} basicInfo={incident.basicModule.sectionA} />}
                {activeModule === 'wildland' && incident.wildlandFireModule && <NfirsWildlandFireModuleComponent moduleData={incident.wildlandFireModule} onUpdate={(d) => handleIncidentUpdate({ wildlandFireModule: d })} isLocked={isLocked} errors={moduleErrors} basicInfo={incident.basicModule.sectionA} />}
                {activeModule === 'arson' && incident.arsonModule && <NfirsArsonModuleComponent moduleData={incident.arsonModule} onUpdate={(d) => handleIncidentUpdate({ arsonModule: d })} isLocked={isLocked} errors={moduleErrors} basicInfo={incident.basicModule.sectionA} />}
                {activeModule === 'attachments' && <NfirsAttachmentsModule incidentId={incident.id} attachments={incident.attachments || []} onUpdate={(d: Attachment[]) => handleIncidentUpdate({ attachments: d })} isLocked={isLocked} />}
                {activeModule === 'apparatus' && <NfirsApparatusModule respondingApparatusIds={incident.respondingApparatusIds || []} />}
                {activeModule === 'personnel' && <NfirsPersonnelModule respondingPersonnelIds={incident.respondingPersonnelIds || []} />}
                {activeModule === 'supplies' && <NfirsSuppliesModule suppliesUsed={incident.suppliesUsed || []} onUpdate={(d) => handleIncidentUpdate({ suppliesUsed: d })} isLocked={isLocked} />}
            </div>
        </div>
    );
};

export default CreateIncident;

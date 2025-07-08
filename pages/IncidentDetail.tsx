
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { NfirsIncident, NfirsSectionKPerson } from '../types';
import { NFIRS_INCIDENT_TYPES } from '../constants/nfirs-codes';
import { EditIcon, PrinterIcon, ShieldAlertIcon } from '../components/icons/Icons';

const Redacted: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="bg-gray-400 text-gray-400 select-none rounded">{children}</span>

const DetailRow: React.FC<{ label: string; value?: React.ReactNode; className?: string; isRedacted?: boolean }> = ({ label, value, className = '', isRedacted = false }) => (
    <div className={`py-2 ${className}`}>
        <dt className="text-sm font-medium text-dark-text-secondary">{label}</dt>
        <dd className="mt-1 text-base text-dark-text">{isRedacted ? <Redacted>{value || '---'}</Redacted> : (value || '---')}</dd>
    </div>
);

const DetailSection: React.FC<{ title: string, children: React.ReactNode, columns?: number}> = ({ title, children, columns = 4 }) => (
    <div className="border-t border-dark-border mt-4 pt-4">
        <h3 className="text-lg font-semibold text-brand-secondary mb-2">{title}</h3>
        <dl className={`grid grid-cols-2 md:grid-cols-${columns} gap-x-4 gap-y-2`}>
            {children}
        </dl>
    </div>
);

const PersonDetailBlock: React.FC<{ person: NfirsSectionKPerson, isRedacted?: boolean }> = ({ person, isRedacted }) => (
    <>
        <DetailRow label="Name" value={person.name || person.businessName} isRedacted={isRedacted} />
        <DetailRow label="Phone" value={person.phone} isRedacted={isRedacted} />
        <DetailRow label="Address" value={`${person.address || ''}, ${person.city || ''}`} className="col-span-2" isRedacted={isRedacted} />
    </>
);


const IncidentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [incident, setIncident] = useState<NfirsIncident | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedacted, setIsRedacted] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        setIsLoading(true);
        api.getIncidentById(id)
            .then(data => {
                if (data) {
                    setIncident(data);
                } else {
                    alert("Incident not found.");
                    navigate('/app/incidents');
                }
            })
            .finally(() => setIsLoading(false));
    }, [id, navigate]);
    
    const handlePrint = () => {
        window.print();
    }
    
    if (isLoading) {
        return <div className="text-center text-dark-text-secondary">Loading incident details...</div>;
    }

    if (!incident) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-dark-text">Incident Not Found</h2>
                <Link to="/app/incidents" className="mt-4 inline-block">
                    <Button>Back to Incident Log</Button>
                </Link>
            </div>
        );
    }
    
    const statusColorClass = incident.status === 'Locked' ? 'bg-green-500/20 text-green-400' :
                           incident.status === 'Review Needed' ? 'bg-yellow-500/20 text-yellow-400' :
                           'bg-blue-500/20 text-blue-400';
                           
    const incidentTypeDescription = NFIRS_INCIDENT_TYPES.find(t => t.code === incident.basicModule.incidentType)?.description;
    
    const { basicModule, fireModule, structureFireModule, emsModule, wildlandFireModule, hazmatModule, arsonModule, civilianCasualties, fireServiceCasualties } = incident;

    return (
        <div>
             <div className="flex justify-between items-center mb-4 no-print">
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate(`/app/incidents/${id}/edit`)} icon={<EditIcon className="h-4 w-4 mr-2"/>}>
                        Edit Report
                    </Button>
                    <Button variant="ghost" onClick={handlePrint} icon={<PrinterIcon className="h-4 w-4 mr-2"/>}>
                        Print / Export PDF
                    </Button>
                </div>
                <div className="flex items-center">
                    <label htmlFor="redacted-mode" className="mr-3 text-sm font-medium text-dark-text-secondary flex items-center">
                        <ShieldAlertIcon className="h-5 w-5 mr-2 text-yellow-400"/>
                        Redacted Mode
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input
                            type="checkbox"
                            name="redacted-mode"
                            id="redacted-mode"
                            checked={isRedacted}
                            onChange={() => setIsRedacted(!isRedacted)}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                         <label htmlFor="redacted-mode" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-500 cursor-pointer"></label>
                    </div>
                     <style>{`.toggle-checkbox:checked { right: 0; border-color: #DC2626; } .toggle-checkbox:checked + .toggle-label { background-color: #DC2626; }`}</style>
                </div>
            </div>

            <Card className="printable-content">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-dark-text">{basicModule.sectionA.incidentNumber}</h2>
                        <p className="text-lg text-dark-text-secondary">{incidentTypeDescription || 'Unknown Incident Type'}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusColorClass}`}>
                          {incident.status}
                        </span>
                    </div>
                </div>

                <DetailSection title="Basic: Identification & Location">
                    <DetailRow label="FDID" value={basicModule.sectionA.fdid} />
                    <DetailRow label="Incident Date" value={new Date(basicModule.sectionA.incidentDate).toLocaleDateString()} />
                    <DetailRow label="Station" value={basicModule.sectionA.station} />
                    <DetailRow label="Exposure" value={basicModule.sectionA.exposureNumber} />
                    <DetailRow label="Address" value={`${basicModule.sectionB.streetOrHighwayName}, ${basicModule.sectionB.city}, ${basicModule.sectionB.state} ${basicModule.sectionB.zipCode}`} className="col-span-2"/>
                    <DetailRow label="Location Type" value={basicModule.sectionB.locationType} />
                    <DetailRow label="Property Use" value={basicModule.propertyUse} />
                </DetailSection>
                
                 <DetailSection title="Basic: Times">
                    <DetailRow label="Alarm" value={basicModule.sectionE.alarmDateTime ? new Date(basicModule.sectionE.alarmDateTime).toLocaleString() : '---'} />
                    <DetailRow label="Arrival" value={basicModule.sectionE.arrivalDateTime ? new Date(basicModule.sectionE.arrivalDateTime).toLocaleString() : '---'} />
                    <DetailRow label="Controlled" value={basicModule.sectionE.controlledDateTime ? new Date(basicModule.sectionE.controlledDateTime).toLocaleString() : '---'} />
                    <DetailRow label="Last Unit Cleared" value={basicModule.sectionE.lastUnitClearedDateTime ? new Date(basicModule.sectionE.lastUnitClearedDateTime).toLocaleString() : '---'} />
                </DetailSection>

                {fireModule && (
                     <DetailSection title="Fire Module">
                        <DetailRow label="Area of Origin" value={fireModule.ignition.areaOfOrigin} />
                        <DetailRow label="Heat Source" value={fireModule.ignition.heatSource} />
                        <DetailRow label="Item First Ignited" value={fireModule.ignition.itemFirstIgnited} />
                        <DetailRow label="Cause of Ignition" value={fireModule.causeOfIgnition.cause} />
                     </DetailSection>
                )}

                {structureFireModule && (
                     <DetailSection title="Structure Fire Module">
                        <DetailRow label="Structure Type" value={structureFireModule.structureType} />
                        <DetailRow label="Building Status" value={structureFireModule.buildingStatus} />
                        <DetailRow label="Detector Presence" value={structureFireModule.detectors.presence} />
                        <DetailRow label="Extinguishing System" value={structureFireModule.extinguishingSystem.presence} />
                     </DetailSection>
                )}

                {wildlandFireModule && (
                    <DetailSection title="Wildland Fire Module">
                        <DetailRow label="Area Type" value={wildlandFireModule.areaType} />
                        <DetailRow label="Cause" value={wildlandFireModule.wildlandFireCause} />
                        <DetailRow label="Acres Burned" value={wildlandFireModule.totalAcresBurned} />
                    </DetailSection>
                )}

                {emsModule && (
                    <DetailSection title="EMS Module">
                        <DetailRow label="Patients" value={emsModule.patientCount} />
                        <DetailRow label="Provider Impression" value={emsModule.providerImpression} />
                        <DetailRow label="Patient Disposition" value={emsModule.emsDisposition} />
                    </DetailSection>
                )}
                
                {hazmatModule && (
                    <DetailSection title="HazMat Module">
                        <DetailRow label="UN/NA ID" value={hazmatModule.hazmatId?.unNumber} />
                        <DetailRow label="Chemical Name" value={hazmatModule.hazmatId?.chemicalName} />
                        <DetailRow label="Amount Released" value={`${hazmatModule.release?.amount || ''} ${hazmatModule.release?.units || ''}`} />
                    </DetailSection>
                )}

                {civilianCasualties && civilianCasualties.length > 0 && (
                     <DetailSection title={`Civilian Casualties (${civilianCasualties.length})`} columns={1}>
                        {civilianCasualties.map((casualty, index) => (
                            <div key={casualty.id} className="p-2 bg-dark-bg rounded-md mb-2">
                                 <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                                    <DetailRow label={`Name`} value={casualty.name} isRedacted={isRedacted} />
                                    <DetailRow label="Severity" value={casualty.severity} />
                                    <DetailRow label="Age" value={casualty.age} />
                                    <DetailRow label="Gender" value={casualty.gender} />
                                 </dl>
                            </div>
                        ))}
                     </DetailSection>
                )}

                {fireServiceCasualties && fireServiceCasualties.length > 0 && (
                     <DetailSection title={`Fire Service Casualties (${fireServiceCasualties.length})`} columns={1}>
                        {fireServiceCasualties.map((casualty, index) => (
                            <div key={casualty.id} className="p-2 bg-dark-bg rounded-md mb-2">
                                 <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                                    <DetailRow label={`Personnel ID`} value={casualty.personnelId} isRedacted={isRedacted} />
                                    <DetailRow label="Severity" value={casualty.severity} />
                                    <DetailRow label="Cause" value={casualty.causeOfInjury} />
                                 </dl>
                            </div>
                        ))}
                     </DetailSection>
                )}

                {arsonModule && (
                    <DetailSection title="Arson Module">
                        <DetailRow label="Case Status" value={arsonModule.caseStatus} />
                        <DetailRow label="Motivation Factors" value={arsonModule.motivationFactors?.join(', ')} />
                    </DetailSection>
                )}

                {(basicModule.sectionK_personEntity.name || basicModule.sectionK_personEntity.businessName) && (
                    <DetailSection title="Person/Entity Involved">
                        <PersonDetailBlock person={basicModule.sectionK_personEntity} isRedacted={isRedacted} />
                    </DetailSection>
                )}
                
                {(basicModule.sectionK_owner.name || basicModule.sectionK_owner.businessName) && (
                    <DetailSection title="Property Owner">
                         <PersonDetailBlock person={basicModule.sectionK_owner} isRedacted={isRedacted} />
                    </DetailSection>
                )}


                <DetailSection title="Basic: Remarks">
                    {isRedacted ? <Redacted>{basicModule.remarks || 'No remarks provided.'}</Redacted> : 
                    <p className="text-dark-text-secondary whitespace-pre-wrap col-span-full">{basicModule.remarks || 'No remarks provided.'}</p>
                    }
                </DetailSection>
            </Card>
        </div>
    );
};

export default IncidentDetail;

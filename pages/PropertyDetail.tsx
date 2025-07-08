
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { Property, Owner, PreIncidentPlan } from '../types';
import { BuildingIcon, UsersIcon, FileTextIcon } from '../components/icons/Icons';

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-dark-text-secondary">{label}</dt>
        <dd className="mt-1 text-sm text-dark-text">{value}</dd>
    </div>
);

const PropertyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [pip, setPip] = useState<PreIncidentPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const propData = await api.getPropertyById(id);
            if (propData) {
                setProperty(propData);
                const ownerData = await Promise.all(propData.ownerIds.map(oid => api.getOwners().then(allOwners => allOwners.find(o => o.id === oid))));
                setOwners(ownerData.filter(Boolean) as Owner[]);
                
                if (propData.pipId) {
                    const pipData = await api.getPIPByPropertyId(propData.id);
                    setPip(pipData);
                } else {
                    setPip(null);
                }
            }
        } catch (e) {
            console.error("Failed to load property details", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleCreatePip = async () => {
        if (!property) return;

        try {
            const newPip = await api.createPIPForProperty(property.id);
            if (newPip) {
                navigate(`/app/properties/${property.id}/pip/${newPip.id}`);
            }
        } catch (error) {
            alert("Failed to create Pre-Incident Plan.");
            console.error(error);
        }
    };

    if (isLoading) {
        return <div className="text-center p-8 text-dark-text-secondary">Loading property details...</div>;
    }

    if (!property) {
        return (
            <Card title="Not Found">
                <p className="text-center text-dark-text-secondary">Property not found.</p>
                <div className="text-center mt-4">
                    <Link to="/app/properties"><Button>Back to Properties</Button></Link>
                </div>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center">
                    <BuildingIcon className="h-10 w-10 text-brand-primary mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-dark-text">{property.address}</h2>
                        <p className="text-lg text-dark-text-secondary">Parcel ID: {property.parcelId}</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Owners">
                    {owners.length > 0 ? (
                        <ul className="space-y-3">
                            {owners.map(owner => (
                                <li key={owner.id} className="flex items-center">
                                    <UsersIcon className="h-5 w-5 mr-3 text-dark-text-secondary" />
                                    <div>
                                        <p className="font-medium text-dark-text">{owner.name}</p>
                                        <p className="text-sm text-dark-text-secondary">{owner.mailingAddress}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-dark-text-secondary">No owners linked.</p>
                    )}
                </Card>

                <Card title="Pre-Incident Plan (PIP)">
                     <div className="flex items-center justify-between">
                        <FileTextIcon className="h-16 w-16 text-blue-400" />
                        <div className="text-right">
                        {pip ? (
                            <>
                            <p className="text-dark-text">PIP on file.</p>
                            <Button className="mt-2" onClick={() => navigate(`/app/properties/${property.id}/pip/${pip.id}`)}>
                                View/Edit PIP
                            </Button>
                            </>
                        ) : (
                             <>
                            <p className="text-dark-text-secondary">No PIP on file for this property.</p>
                             <Button className="mt-2" onClick={handleCreatePip}>
                                Create PIP
                            </Button>
                            </>
                        )}
                        </div>
                     </div>
                </Card>
            </div>
        </div>
    );
};

export default PropertyDetail;

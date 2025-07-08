
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { PreIncidentPlan as PIPType, Property } from '../types';

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label: string}> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-dark-text-secondary mb-1">{label}</label>
        <textarea
            {...props}
            rows={4}
            className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        />
    </div>
);

const PreIncidentPlan: React.FC = () => {
    const { propertyId, pipId } = useParams<{ propertyId: string, pipId: string }>();
    const navigate = useNavigate();
    
    const [property, setProperty] = useState<Property | null>(null);
    const [pip, setPip] = useState<PIPType | null>(null);
    const [formData, setFormData] = useState<Partial<PIPType>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!propertyId || !pipId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [propData, pipData] = await Promise.all([
                    api.getPropertyById(propertyId),
                    api.getPIPByPropertyId(propertyId)
                ]);
                setProperty(propData);
                setPip(pipData);
                if (pipData) {
                    setFormData(pipData);
                }
            } catch (e) {
                console.error("Failed to load PIP data", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [propertyId, pipId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pipId) return;

        setIsSubmitting(true);
        try {
            await api.updatePIP(pipId, formData);
            alert("Pre-Incident Plan updated successfully.");
            navigate(`/app/properties/${propertyId}`);
        } catch (error) {
            alert("Failed to update PIP.");
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <Card title="Loading PIP..."><div className="text-center p-8">Loading...</div></Card>
    }

    if (!property || !pip) {
        return <Card title="Error"><p className="text-center">Could not load Pre-Incident Plan.</p></Card>
    }

    return (
        <Card title={`Pre-Incident Plan: ${property.address}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Textarea id="buildingInfo" name="buildingInfo" label="Building Information" value={formData.buildingInfo || ''} onChange={handleInputChange} placeholder="e.g., Two-story wood frame residential..." />
                <Textarea id="accessPoints" name="accessPoints" label="Access Points" value={formData.accessPoints || ''} onChange={handleInputChange} placeholder="e.g., Front door (Alpha), side door (Bravo)..." />
                <Textarea id="hazards" name="hazards" label="Known Hazards" value={formData.hazards || ''} onChange={handleInputChange} placeholder="e.g., None known, has basement..." />
                <Textarea id="utilityShutoffs" name="utilityShutoffs" label="Utility Shutoffs" value={formData.utilityShutoffs || ''} onChange={handleInputChange} placeholder="e.g., Gas meter on Delta side, electrical panel in garage..." />
                <Textarea id="contacts" name="contacts" label="Emergency Contacts" value={formData.contacts || ''} onChange={handleInputChange} placeholder="e.g., Owner: John Doe (555-1234)..." />

                <div className="pt-5">
                    <div className="flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => navigate(`/app/properties/${propertyId}`)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting}>
                            Save Plan
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
};

export default PreIncidentPlan;

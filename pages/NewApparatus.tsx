
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { Apparatus, ApparatusStatus } from '../types';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-dark-text-secondary mb-1">{label}</label>
        <input {...props} className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
    </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-dark-text-secondary mb-1">{label}</label>
        <select {...props} className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
            {children}
        </select>
    </div>
);

const NewApparatus: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<Apparatus>>({
        unitId: '',
        type: 'Engine',
        status: ApparatusStatus.IN_SERVICE,
        vin: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        purchaseDate: new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.createApparatus(formData as any);
            alert("Apparatus created successfully!");
            navigate('/app/apparatus');
        } catch (error) {
            alert('Failed to create apparatus.');
            setIsSubmitting(false);
        }
    };

    return (
        <Card title="Add New Apparatus">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input label="Unit ID" id="unitId" name="unitId" value={formData.unitId} onChange={handleChange} required />
                    <Select label="Type" id="type" name="type" value={formData.type} onChange={handleChange}>
                        <option>Engine</option>
                        <option>Ladder</option>
                        <option>Rescue</option>
                        <option>Tanker</option>
                        <option>Brush Truck</option>
                    </Select>
                     <Select label="Initial Status" id="status" name="status" value={formData.status} onChange={handleChange}>
                        {Object.values(ApparatusStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Input label="Make" id="make" name="make" value={formData.make} onChange={handleChange} />
                    <Input label="Model" id="model" name="model" value={formData.model} onChange={handleChange} />
                    <Input label="Year" id="year" name="year" type="number" value={formData.year as number} onChange={handleChange} />
                    <Input label="VIN" id="vin" name="vin" value={formData.vin} onChange={handleChange} />
                    <Input label="Purchase Date" id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} />
                </div>
                 <div className="pt-5 flex justify-end space-x-3">
                    <Button type="button" variant="ghost" onClick={() => navigate('/app/apparatus')}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        Add Apparatus
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default NewApparatus;

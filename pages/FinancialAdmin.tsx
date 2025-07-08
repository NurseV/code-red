
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { Incident, Invoice } from '../types';

// Tab 3: Invoicing
const InvoicingTab: React.FC = () => {
    const [billableIncidents, setBillableIncidents] = useState<Incident[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = () => {
        setIsLoading(true);
        Promise.all([
            api.getBillableIncidents(),
            api.getInvoices()
        ]).then(([incidents, invs]) => {
            setBillableIncidents(incidents);
            setInvoices(invs);
        }).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerateInvoice = async (incidentId: string) => {
        if(window.confirm("Generate a draft invoice for this incident?")) {
            await api.generateInvoiceForIncident(incidentId);
            fetchData(); // Refresh both lists
        }
    };
    
    const billableColumns = [
        { header: "Incident #", accessor: (item: Incident) => item.incidentNumber },
        { header: "Type", accessor: (item: Incident) => item.type },
        { header: "Address", accessor: (item: Incident) => item.address },
        { header: "Actions", accessor: (item: Incident) => <Button onClick={() => handleGenerateInvoice(item.id)}>Generate Invoice</Button> }
    ];

    const invoiceColumns = [
        { header: "Invoice #", accessor: (item: Invoice) => item.id },
        { header: "Incident #", accessor: (item: Invoice) => item.incidentNumber },
        { header: "Address", accessor: (item: Invoice) => item.propertyAddress },
        { header: "Total", accessor: (item: Invoice) => `$${item.totalAmount.toFixed(2)}` },
        { header: "Status", accessor: (item: Invoice) => item.status },
    ];


    if (isLoading) return <div className="text-center p-8 text-dark-text-secondary">Loading invoicing data...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium text-dark-text mb-2">Billable Incidents (Pending Invoice)</h3>
                <Table columns={billableColumns} data={billableIncidents} />
            </div>
            <div>
                <h3 className="text-lg font-medium text-dark-text mb-2">Generated Invoices</h3>
                 <Table columns={invoiceColumns} data={invoices} />
            </div>
        </div>
    );
};


const FinancialAdmin: React.FC = () => {
    return (
        <Card title="Hazard Mitigation Invoicing">
            <InvoicingTab />
        </Card>
    );
};

export default FinancialAdmin;

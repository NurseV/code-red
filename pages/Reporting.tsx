

import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import * as api from '../services/api';
import { PrebuiltReport, CustomReportConfig, DataSource, ReportFilter, FilterCondition } from '../types';
import { FileSpreadsheetIcon, PieChartIcon, PlusIcon, XIcon } from '../components/icons/Icons';

const DATA_SOURCES: { id: DataSource; name: string }[] = [
    { id: 'incidents', name: 'Incidents' },
    { id: 'personnel', name: 'Personnel' },
    { id: 'apparatus', name: 'Apparatus' },
    { id: 'assets', name: 'Assets' },
];

const AVAILABLE_FIELDS: Record<DataSource, string[]> = {
    incidents: ['incidentNumber', 'type', 'address', 'date', 'status'],
    personnel: ['name', 'rank', 'status', 'badgeNumber', 'employeeId'],
    apparatus: ['unitId', 'type', 'status', 'mileage', 'engineHours'],
    assets: ['name', 'assetType', 'category', 'status', 'manufacturer', 'purchaseDate'],
};

const CONDITIONS: {id: FilterCondition, name: string}[] = [
    {id: 'is', name: 'Is'},
    {id: 'is_not', name: 'Is Not'},
    {id: 'contains', name: 'Contains'},
    {id: 'does_not_contain', name: 'Does Not Contain'},
    {id: 'is_greater_than', name: 'Is Greater Than'},
    {id: 'is_less_than', name: 'Is Less Than'},
];

const CustomReportBuilderUI: React.FC<{ onGenerate: (config: CustomReportConfig) => void; }> = ({ onGenerate }) => {
    const [dataSource, setDataSource] = useState<DataSource>('incidents');
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [filters, setFilters] = useState<ReportFilter[]>([]);

    const fieldsForSource = AVAILABLE_FIELDS[dataSource];

    useEffect(() => {
        // Reset fields and filters when data source changes
        setSelectedFields([]);
        setFilters([]);
    }, [dataSource]);

    const handleFieldToggle = (field: string) => {
        setSelectedFields(prev =>
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    };

    const handleAddFilter = () => {
        setFilters(prev => [...prev, { id: Date.now(), field: fieldsForSource[0], condition: 'is', value: '' }]);
    };
    
    const handleRemoveFilter = (id: number) => {
        setFilters(prev => prev.filter(f => f.id !== id));
    };

    const handleFilterChange = (id: number, part: 'field' | 'condition' | 'value', value: string) => {
        setFilters(prev => prev.map(f => f.id === id ? { ...f, [part]: value } : f));
    };

    const handleGenerateClick = () => {
        onGenerate({
            dataSource,
            fields: selectedFields,
            filters: filters.filter(f => f.value), // Only include filters with a value
        });
    };

    return (
        <div className="bg-dark-bg p-4 rounded-lg border border-dark-border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Data Source */}
                <div className="md:col-span-1">
                    <h4 className="font-semibold text-dark-text mb-2">1. Data Source</h4>
                    <select
                        value={dataSource}
                        onChange={(e) => setDataSource(e.target.value as DataSource)}
                        className="w-full bg-dark-card border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    >
                        {DATA_SOURCES.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                    </select>
                </div>
                {/* Fields */}
                <div className="md:col-span-1">
                    <h4 className="font-semibold text-dark-text mb-2">2. Fields</h4>
                    <div className="space-y-2 text-sm max-h-40 overflow-y-auto p-2 border border-dark-border rounded-md">
                        {fieldsForSource.map(field => (
                            <label key={field} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedFields.includes(field)}
                                    onChange={() => handleFieldToggle(field)}
                                    className="h-4 w-4 rounded mr-2 text-brand-primary focus:ring-transparent"
                                />
                                {field}
                            </label>
                        ))}
                    </div>
                </div>
                {/* Filters */}
                <div className="md:col-span-2">
                    <h4 className="font-semibold text-dark-text mb-2">3. Filters</h4>
                    <div className="space-y-2 p-2 border border-dark-border rounded-md">
                        {filters.map(filter => (
                            <div key={filter.id} className="flex items-center space-x-2">
                                <select value={filter.field} onChange={e => handleFilterChange(filter.id, 'field', e.target.value)} className="flex-grow bg-dark-card border border-dark-border rounded-md py-1 px-2 text-xs">
                                    {fieldsForSource.map(field => <option key={field} value={field}>{field}</option>)}
                                </select>
                                <select value={filter.condition} onChange={e => handleFilterChange(filter.id, 'condition', e.target.value)} className="flex-grow bg-dark-card border border-dark-border rounded-md py-1 px-2 text-xs">
                                    {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <input type="text" value={filter.value} onChange={e => handleFilterChange(filter.id, 'value', e.target.value)} className="flex-grow bg-dark-card border border-dark-border rounded-md py-1 px-2 text-xs" />
                                <button onClick={() => handleRemoveFilter(filter.id)}><XIcon className="h-4 w-4 text-red-500"/></button>
                            </div>
                        ))}
                        <Button variant="ghost" className="text-xs px-2 py-1" onClick={handleAddFilter} icon={<PlusIcon className="h-3 w-3 mr-1" />}>Add Filter</Button>
                    </div>
                </div>
            </div>
            <div className="pt-4 border-t border-dark-border flex justify-end">
                <Button variant="primary" onClick={handleGenerateClick} disabled={selectedFields.length === 0}>Generate Report</Button>
            </div>
        </div>
    );
};


const Reporting: React.FC = () => {
    const [reports, setReports] = useState<PrebuiltReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportColumns, setReportColumns] = useState<any[]>([]);
    const [reportTitle, setReportTitle] = useState('');
    const [isReportLoading, setIsReportLoading] = useState(false);

    useEffect(() => {
        api.getPrebuiltReports()
            .then(setReports)
            .finally(() => setIsLoading(false));
    }, []);

    const handleRunPrebuiltReport = async (reportId: string, title: string) => {
        setReportTitle(title);
        setIsReportModalOpen(true);
        setIsReportLoading(true);
        try {
            const { data, columns } = await api.getReportData(reportId);
            setReportData(data);
            setReportColumns(columns);
        } catch (e) {
            alert('Failed to load report data');
        } finally {
            setIsReportLoading(false);
        }
    };
    
    const handleGenerateCustomReport = async (config: CustomReportConfig) => {
        setReportTitle(`Custom Report: ${config.dataSource}`);
        setIsReportModalOpen(true);
        setIsReportLoading(true);
        try {
            const { data, columns } = await api.generateCustomReport(config);
            setReportData(data);
            setReportColumns(columns);
        } catch (e) {
            alert('Failed to generate custom report');
            setReportData([]);
            setReportColumns([]);
        } finally {
            setIsReportLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsReportModalOpen(false);
        setReportData([]);
        setReportColumns([]);
        setReportTitle('');
    };

    const handleExportCsv = () => {
        if (!reportData.length || !reportColumns.length) return;

        const headers = reportColumns.map(c => c.header).join(',');
        
        // Custom logic to get keys from columns if possible, otherwise from data
        const keys = reportColumns.map(col => {
            const dataKey = Object.keys(reportData[0]).find(k => {
                const headerFromKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return headerFromKey === col.header;
            });
            return dataKey || col.header.toLowerCase().replace(/ /g, '');
        }).filter(Boolean);
        
        const rows = reportData.map(row => {
            return keys.map(key => {
                const value = row[key] === null || row[key] === undefined ? '' : String(row[key]);
                return `"${value.replace(/"/g, '""')}"`; // Escape double quotes
            }).join(',');
        }).join('\n');

        const csvString = `${headers}\n${rows}`;
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    return (
        <>
        <div className="space-y-6">
            <Card title="Pre-built Reports">
                {isLoading ? (
                    <div className="text-center p-8 text-dark-text-secondary">Loading reports...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reports.map(report => (
                            <div key={report.id} className="bg-dark-bg border border-dark-border p-4 rounded-lg flex items-start">
                                <PieChartIcon className="h-8 w-8 text-brand-secondary mr-4 mt-1" />
                                <div className="flex-grow">
                                    <h3 className="font-bold text-dark-text">{report.title}</h3>
                                    <p className="text-sm text-dark-text-secondary mb-3">{report.description}</p>
                                    <Button variant="secondary" onClick={() => handleRunPrebuiltReport(report.id, report.title)}>
                                        Run Report
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card title="Custom Report Builder">
                <CustomReportBuilderUI onGenerate={handleGenerateCustomReport} />
            </Card>
        </div>
        
        <Modal title={reportTitle} isOpen={isReportModalOpen} onClose={handleCloseModal}>
            <div className="flex justify-end mb-4">
                <Button variant="ghost" icon={<FileSpreadsheetIcon className="h-4 w-4 mr-2" />} onClick={handleExportCsv}>Export CSV</Button>
            </div>
            {isReportLoading ? (
                 <div className="text-center p-8 text-dark-text-secondary">Generating report...</div>
            ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table columns={reportColumns} data={reportData} />
                </div>
            )}
            <div className="mt-6 flex justify-end">
                <Button onClick={handleCloseModal}>Close</Button>
            </div>
        </Modal>
        </>
    );
};

export default Reporting;


import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { Incident as IncidentType } from '../types';
import { PlusIcon, RefreshCwIcon, SearchIcon } from '../components/icons/Icons';
import { useInternalAuth } from '../hooks/useInternalAuth';


const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const Incidents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useInternalAuth();
  const [incidents, setIncidents] = useState<IncidentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    type: 'All',
    status: 'All' as 'All' | IncidentType['status'],
  });
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const fetchIncidents = () => {
    setIsLoading(true);
    const params = {
        searchTerm: debouncedSearchTerm,
        type: filters.type === 'All' ? undefined : filters.type,
        status: filters.status === 'All' ? undefined : filters.status,
    }
    api.getIncidentsList(params)
      .then(setIncidents)
      .finally(() => setIsLoading(false));
  };
  
  useEffect(() => {
    fetchIncidents();
  }, [debouncedSearchTerm, filters.type, filters.status]);

  const handleSync = async () => {
      setIsSyncing(true);
      try {
          await api.syncWithActive911();
          fetchIncidents(); // Refresh the list
      } catch (error) {
          alert("Failed to sync with Active911.");
      } finally {
          setIsSyncing(false);
      }
  };

  const handleCreateNewIncident = async () => {
      if (!user) return;
      try {
          const newIncidentData = {
              type: 'New Incident',
              address: 'TBD',
              date: new Date().toISOString(),
              status: 'Open' as 'Open',
              respondingPersonnelIds: [],
              respondingApparatusIds: [],
          };
          const newIncident = await api.createIncident(user, newIncidentData);
          navigate(`/app/incidents/${newIncident.id}/edit`);
      } catch (error) {
          alert('Failed to create new incident shell.');
      }
  }
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilters(prev => ({...prev, [name]: value as any }));
  };

  const incidentTypes = ['All', 'Structure Fire', 'MVA', 'Medical Emergency', 'Brush Fire'];

  const columns = [
    {
      header: 'Incident #',
      accessor: (item: IncidentType) => (
        <Link to={`/app/incidents/${item.id}`} className="font-medium text-dark-text hover:text-brand-primary hover:underline">
          {item.incidentNumber}
        </Link>
      ),
    },
    {
      header: 'Type',
      accessor: (item: IncidentType) => item.type,
    },
    {
      header: 'Address',
      accessor: (item: IncidentType) => item.address,
    },
    {
      header: 'Date',
      accessor: (item: IncidentType) => new Date(item.date).toLocaleString(),
    },
    {
      header: 'Status',
      accessor: (item: IncidentType) => (
         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
            item.status === 'Closed' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
        header: 'Actions',
        accessor: (item: IncidentType) => (
            <Button variant="secondary" className="py-1 px-2 text-xs" onClick={() => navigate(`/app/incidents/${item.id}/edit`)}>
                Edit
            </Button>
        )
    }
  ];

  return (
    <Card 
        title="Incident Log"
        actions={
            <div className="flex space-x-2">
                <Button onClick={handleSync} variant="secondary" isLoading={isSyncing} icon={<RefreshCwIcon className="h-5 w-5 mr-2" />}>
                    Sync with Active911
                </Button>
                <Button onClick={handleCreateNewIncident} icon={<PlusIcon className="h-5 w-5 mr-2" />}>
                    New Incident
                </Button>
            </div>
        }
    >
      <div className="p-4 bg-dark-card mb-4 rounded-lg flex items-center space-x-4">
          <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-text-secondary" />
              <input 
                  type="text"
                  name="searchTerm"
                  placeholder="Search by address, number..."
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  className="w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 pl-10 pr-4 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              />
          </div>
          <div>
              <label htmlFor="type" className="sr-only">Type</label>
              <select name="type" onChange={handleFilterChange} value={filters.type} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm">
                  {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          </div>
          <div>
              <label htmlFor="status" className="sr-only">Status</label>
              <select name="status" onChange={handleFilterChange} value={filters.status} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm">
                  <option>All</option>
                  <option>Open</option>
                  <option>Closed</option>
                  <option>Pending Review</option>
              </select>
          </div>
      </div>
      {isLoading ? (
        <div className="text-center p-8 text-dark-text-secondary">Loading incidents...</div>
      ) : (
        <Table columns={columns} data={incidents} />
      )}
    </Card>
  );
};

export default Incidents;

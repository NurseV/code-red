

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { Apparatus as ApparatusType, ApparatusStatus, Role } from '../types';
import { useInternalAuth } from '../hooks/useInternalAuth';
import { ListChecksIcon, SearchIcon, PlusIcon } from '../components/icons/Icons';

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


const Apparatus: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useInternalAuth();
  const [apparatus, setApparatus] = useState<ApparatusType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
      searchTerm: '',
      type: 'All' as 'All' | ApparatusType['type'],
      status: 'All' as 'All' | ApparatusStatus,
  });
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
  
  useEffect(() => {
    setIsLoading(true);
    const fetchApparatus = async () => {
        const params = {
            searchTerm: debouncedSearchTerm,
            type: filters.type === 'All' ? undefined : filters.type,
            status: filters.status === 'All' ? undefined : filters.status,
        }
        const data = await api.getApparatusList(params);
        setApparatus(data);
        setIsLoading(false);
    }
    fetchApparatus();
  }, [debouncedSearchTerm, filters.type, filters.status]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilters(prev => ({...prev, [name]: value as any }));
  };
  
  const columns = [
    {
      header: 'Unit ID',
      accessor: (item: ApparatusType) => (
        <Link to={`/app/apparatus/${item.id}`} className="font-medium text-dark-text hover:text-brand-primary hover:underline">
          {item.unitId}
        </Link>
      ),
    },
    {
      header: 'Type',
      accessor: (item: ApparatusType) => item.type,
    },
    {
      header: 'Status',
      accessor: (item: ApparatusType) => (
         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.status === ApparatusStatus.IN_SERVICE ? 'bg-green-100 text-green-800' :
            item.status === ApparatusStatus.OUT_OF_SERVICE ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      header: 'Mileage',
      accessor: (item: ApparatusType) => item.mileage.toLocaleString(),
    },
    {
      header: 'Engine Hours',
      accessor: (item: ApparatusType) => item.engineHours.toFixed(1),
    },
     {
      header: 'Last Check',
      accessor: (item: ApparatusType) => new Date(item.lastCheck).toLocaleDateString(),
    },
  ];

  const canAdd = user && [Role.ADMINISTRATOR, Role.CHIEF].includes(user.role);

  return (
    <Card 
      title="Apparatus Fleet"
      actions={
        canAdd && (
          <Button onClick={() => navigate('/app/apparatus/new')} icon={<PlusIcon className="mr-2 h-5 w-5"/>}>
            New Apparatus
          </Button>
        )
      }
    >
      <div className="p-4 bg-dark-card mb-4 rounded-lg flex items-center space-x-4">
          <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-text-secondary" />
              <input 
                  type="text"
                  name="searchTerm"
                  placeholder="Search by Unit ID..."
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  className="w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 pl-10 pr-4 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              />
          </div>
          <div>
              <label htmlFor="type" className="sr-only">Type</label>
              <select name="type" onChange={handleFilterChange} value={filters.type} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm">
                  <option>All</option>
                  <option>Engine</option>
                  <option>Ladder</option>
                  <option>Rescue</option>
                  <option>Tanker</option>
                  <option>Brush Truck</option>
              </select>
          </div>
          <div>
              <label htmlFor="status" className="sr-only">Status</label>
              <select name="status" onChange={handleFilterChange} value={filters.status} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm">
                  <option>All</option>
                  <option>{ApparatusStatus.IN_SERVICE}</option>
                  <option>{ApparatusStatus.OUT_OF_SERVICE}</option>
                  <option>{ApparatusStatus.MAINTENANCE}</option>
              </select>
          </div>
      </div>
      {isLoading ? (
        <div className="text-center p-8 text-dark-text-secondary">Loading apparatus fleet...</div>
      ) : (
        <Table columns={columns} data={apparatus} />
      )}
    </Card>
  );
};

export default Apparatus;

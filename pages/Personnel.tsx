
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import * as api from '../services/api';
import { Personnel as PersonnelType, Role, Applicant, ApplicantStatus } from '../types';
import { useInternalAuth } from '../hooks/useInternalAuth';
import { UserPlusIcon, UsersIcon, ShieldAlertIcon, SearchIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/Icons';

// --- Applicant Tracking Sub-components ---
const statusStyles: Record<ApplicantStatus, string> = {
    [ApplicantStatus.APPLIED]: 'bg-blue-500',
    [ApplicantStatus.INTERVIEW]: 'bg-purple-500',
    [ApplicantStatus.OFFER]: 'bg-yellow-500',
    [ApplicantStatus.HIRED]: 'bg-green-500',
    [ApplicantStatus.REJECTED]: 'bg-red-600',
};

const ApplicantCard: React.FC<{ applicant: Applicant; onDragStart: (e: React.DragEvent, id: string) => void }> = ({ applicant, onDragStart }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, applicant.id)}
        className="bg-dark-bg border border-dark-border p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
    >
        <p className="font-bold text-dark-text">{applicant.name}</p>
        <p className="text-sm text-dark-text-secondary">{applicant.email}</p>
        <p className="text-xs text-dark-text-secondary mt-1">Applied: {new Date(applicant.appliedDate).toLocaleDateString()}</p>
    </div>
);

const KanbanColumn: React.FC<{ 
    status: ApplicantStatus; 
    applicants: Applicant[]; 
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDrop: (e: React.DragEvent, status: ApplicantStatus) => void;
}> = ({ status, applicants, onDragStart, onDrop }) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    
    return (
        <div 
            className="bg-dark-bg/80 rounded-lg w-full md:w-1/5 p-2 flex-shrink-0"
            onDragOver={handleDragOver}
            onDrop={(e) => onDrop(e, status)}
        >
            <div className={`text-sm font-semibold text-white px-3 py-1 rounded-t-md ${statusStyles[status]}`}>
                {status} ({applicants.length})
            </div>
            <div className="p-2 space-y-3 h-full min-h-[200px] bg-dark-card/50 rounded-b-md">
                {applicants.map(app => (
                    <ApplicantCard key={app.id} applicant={app} onDragStart={onDragStart} />
                ))}
            </div>
        </div>
    );
};

const ApplicantTrackingView: React.FC = () => {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [applicantToPromote, setApplicantToPromote] = useState<Applicant | null>(null);

    const fetchApplicants = () => {
        setIsLoading(true);
        api.getApplicants().then(setApplicants).finally(() => setIsLoading(false));
    };
    
    useEffect(() => {
        fetchApplicants();
    }, []);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("applicantId", id);
    };

    const handleDrop = (e: React.DragEvent, newStatus: ApplicantStatus) => {
        e.preventDefault();
        const applicantId = e.dataTransfer.getData("applicantId");
        const movedApplicant = applicants.find(app => app.id === applicantId);
        
        if (movedApplicant && movedApplicant.status !== newStatus) {
             if (newStatus === ApplicantStatus.HIRED) {
                setApplicantToPromote(movedApplicant);
                setIsModalOpen(true);
            } else {
                setApplicants(prev => prev.map(app => 
                    app.id === applicantId ? { ...app, status: newStatus } : app
                ));
                api.updateApplicantStatus(applicantId, newStatus).catch(err => {
                    alert("Failed to update applicant status.");
                    fetchApplicants();
                });
            }
        }
    };

    const handleConfirmPromotion = async () => {
        if (!applicantToPromote) return;
        
        try {
            await api.promoteApplicantToPersonnel(applicantToPromote.id);
            alert(`${applicantToPromote.name} has been promoted to Personnel.`);
            fetchApplicants(); 
        } catch (error) {
            alert("Failed to promote applicant.");
        } finally {
            setIsModalOpen(false);
            setApplicantToPromote(null);
        }
    };
    
    const columns: ApplicantStatus[] = [
        ApplicantStatus.APPLIED,
        ApplicantStatus.INTERVIEW,
        ApplicantStatus.OFFER,
        ApplicantStatus.HIRED,
        ApplicantStatus.REJECTED,
    ];

    return (
        <>
            {isLoading ? <div className="text-center p-8 text-dark-text-secondary">Loading applicants...</div> : (
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 overflow-x-auto pb-4">
                    {columns.map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            applicants={applicants.filter(a => a.status === status)}
                            onDragStart={handleDragStart}
                            onDrop={handleDrop}
                        />
                    ))}
                </div>
            )}
            {applicantToPromote && (
                <Modal title="Confirm Promotion" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <p className="text-dark-text">
                        Are you sure you want to promote <span className="font-bold">{applicantToPromote.name}</span> to a probationary firefighter?
                    </p>
                    <p className="text-sm text-dark-text-secondary mt-2">
                        This will create a new record in the Personnel module and remove them from this applicant board.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleConfirmPromotion}>Confirm Promotion</Button>
                    </div>
                </Modal>
            )}
        </>
    );
};


// --- Personnel Roster Sub-components ---
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

const PersonnelSummaryCard: React.FC<{person: PersonnelType}> = ({ person }) => {
    const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">{label}</p>
            <p className="text-sm text-dark-text mt-1">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="bg-dark-bg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
             <DetailItem label="NFIRS ID" value={person.nfirsId} />
             <DetailItem label="Active 911 Code" value={person.active911Code} />
             <DetailItem label="Positions" value={person.positions?.join(', ')} />
             <DetailItem label="Primary Contact" value={person.phoneNumbers.find(p => p.type === "Work")?.number || 'N/A'} />
             <div className="col-span-2 md:col-span-4">
                 <p className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Emergency Contacts</p>
                 <ul className="mt-1 space-y-1">
                 {person.emergencyContacts.length > 0 ? person.emergencyContacts.map(c => (
                     <li key={c.id} className="text-sm text-dark-text">{c.name} ({c.relationship}): {c.phone}</li>
                 )) : <li className="text-sm text-dark-text">N/A</li>}
                 </ul>
             </div>
        </div>
    );
};

const RosterView: React.FC = () => {
  const { user } = useInternalAuth();
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<PersonnelType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({ name: '', email: '', rank: 'Probation', status: 'Probation' as PersonnelType['status']});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof PersonnelType, direction: 'ascending' | 'descending' } | null>({ key: 'rank', direction: 'ascending' });

  const [filters, setFilters] = useState({
      searchTerm: '',
      rank: 'All',
      status: 'All' as 'All' | PersonnelType['status'],
  });
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
  
  const RANK_ORDER = ['Chief', 'Captain', 'Lieutenant', 'Engineer', 'Firefighter', 'Paramedic', 'Probation', 'Administrator'];

  const sortedPersonnel = useMemo(() => {
    let sortableItems = [...personnel];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            let comparison = 0;
            if (sortConfig.key === 'rank') {
                comparison = (RANK_ORDER.indexOf(aVal as string) ?? 99) - (RANK_ORDER.indexOf(bVal as string) ?? 99);
            } else {
                 if (aVal < bVal) {
                    comparison = -1;
                }
                if (aVal > bVal) {
                    comparison = 1;
                }
            }
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }
    return sortableItems;
  }, [personnel, sortConfig]);
  
  const requestSort = (key: keyof PersonnelType) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  useEffect(() => {
    setIsLoading(true);
    const fetchPersonnel = async () => {
        const params = {
            searchTerm: debouncedSearchTerm,
            rank: filters.rank === 'All' ? undefined : filters.rank,
            status: filters.status === 'All' ? undefined : filters.status,
        }
        const data = await api.getPersonnelList(params);
        setPersonnel(data);
        setIsLoading(false);
    }
    fetchPersonnel();
  }, [debouncedSearchTerm, filters.rank, filters.status]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilters(prev => ({...prev, [name]: value as any }));
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
        const newPersonnel = await api.createPersonnelDirectly(newEmployeeData, user);
        setIsAddModalOpen(false);
        navigate(`/app/personnel/${newPersonnel.id}`);
    } catch(err) {
        alert("Failed to create new employee.");
    }
  }

  const ranks = useMemo(() => ['All', 'Chief', 'Captain', 'Lieutenant', 'Engineer', 'Firefighter', 'Paramedic', 'Probation', 'Administrator'], []);

  const columns = [
    {
      header: 'Name',
      sortKey: 'name' as const,
      accessor: (item: PersonnelType) => (
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full" src={item.avatarUrl} alt="" />
          <div className="ml-4">
            <div className="flex items-center">
              <Link to={`/app/personnel/${item.id}`} className="text-sm font-medium text-dark-text hover:text-brand-primary hover:underline">
                {item.name}
              </Link>
              {item.hasExpiringCerts && 
                <div className="ml-2 group relative">
                    <ShieldAlertIcon className="h-5 w-5 text-yellow-400"/>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max hidden group-hover:block bg-dark-bg text-white text-xs rounded py-1 px-2 border border-dark-border shadow-lg z-10">
                        Has expiring certifications
                    </div>
                </div>
              }
            </div>
            <div className="text-sm text-dark-text-secondary">{item.emails?.[0]?.address}</div>
          </div>
        </div>
      ),
    },
    { header: 'Rank', sortKey: 'rank' as const, accessor: (item: PersonnelType) => item.rank },
    {
      header: 'Status',
      accessor: (item: PersonnelType) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.status === 'Active' ? 'bg-green-100 text-green-800' : 
            item.status === 'Probation' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    { header: 'Badge #', accessor: (item: PersonnelType) => item.badgeNumber, },
    { header: 'Phone', accessor: (item: PersonnelType) => item.phoneNumbers?.[0]?.number || 'N/A' },
  ];

  return (
    <>
        <div className="p-4 bg-dark-card mb-4 rounded-lg flex items-center space-x-4">
            <div className="relative flex-grow">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-text-secondary" />
                <input 
                    type="text"
                    name="searchTerm"
                    placeholder="Search by name, badge..."
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                    className="w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 pl-10 pr-4 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="rank" className="sr-only">Rank</label>
                <select name="rank" onChange={handleFilterChange} value={filters.rank} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm">
                    {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="status" className="sr-only">Status</label>
                <select name="status" onChange={handleFilterChange} value={filters.status} className="bg-dark-bg border border-dark-border rounded-md py-2 px-3 text-dark-text sm:text-sm">
                    <option>All</option>
                    <option>Active</option>
                    <option>Probation</option>
                    <option>Inactive</option>
                </select>
            </div>
             <Button onClick={() => setIsAddModalOpen(true)} icon={<PlusIcon className="h-5 w-5 mr-2"/>}>Add Employee</Button>
        </div>
        {isLoading ? (
          <div className="text-center p-8 text-dark-text-secondary">Loading personnel...</div>
        ) : (
          <Table 
            columns={columns} 
            data={sortedPersonnel}
            sortConfig={sortConfig}
            requestSort={requestSort}
            onRowClick={(item) => setExpandedRowId(expandedRowId === item.id ? null : item.id)}
            expandedRowId={expandedRowId}
            renderExpandedRow={(item) => <PersonnelSummaryCard person={item} />}
          />
        )}
        <Modal title="Add New Employee (Direct)" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
            <form onSubmit={handleAddEmployee} className="space-y-4">
                <p className="text-sm text-dark-text-secondary">Use this form to add existing personnel for system migration purposes.</p>
                <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Full Name</label>
                    <input type="text" value={newEmployeeData.name} onChange={e => setNewEmployeeData({...newEmployeeData, name: e.target.value})} required className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Email Address</label>
                    <input type="email" value={newEmployeeData.email} onChange={e => setNewEmployeeData({...newEmployeeData, email: e.target.value})} required className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Initial Rank</label>
                    <input type="text" value={newEmployeeData.rank} onChange={e => setNewEmployeeData({...newEmployeeData, rank: e.target.value})} required className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text" />
                </div>
                <div>
                     <label className="block text-sm font-medium text-dark-text-secondary mb-1">Status</label>
                     <select value={newEmployeeData.status} onChange={e => setNewEmployeeData({...newEmployeeData, status: e.target.value as any})} className="w-full bg-dark-bg border-dark-border rounded-md p-2 text-dark-text">
                        <option>Probation</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Employee</Button>
                </div>
            </form>
        </Modal>
    </>
  );
}

// --- Main Personnel Page Component ---
const Personnel: React.FC = () => {
  const { user } = useInternalAuth();
  const [view, setView] = useState<'roster' | 'applicants'>('roster');

  return (
    <Card 
      title={view === 'roster' ? "Personnel Roster" : "Applicant Tracking"}
      actions={
        <div className="flex space-x-2">
            {view === 'roster' && user && [Role.CHIEF, Role.ADMINISTRATOR].includes(user.role) && (
              <Button onClick={() => setView('applicants')} icon={<UserPlusIcon className="h-5 w-5 mr-2" />}>
                Applicant Tracking
              </Button>
            )}
            {view === 'applicants' && (
               <Button onClick={() => setView('roster')} icon={<UsersIcon className="h-5 w-5 mr-2" />}>
                Personnel Roster
              </Button>
            )}
        </div>
      }
    >
        {view === 'roster' ? <RosterView /> : <ApplicantTrackingView />}
    </Card>
  );
};

export default Personnel;

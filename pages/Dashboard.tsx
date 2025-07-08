import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import * as api from '../services/api';
import { Apparatus, Incident, ApparatusStatus, ExpiringCertification } from '../types';
import { UsersIcon, TruckIcon, AlertTriangleIcon, ShieldAlertIcon } from '../components/icons/Icons';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string; }> = ({ icon, title, value, color }) => {
    return (
        <Card className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-dark-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-dark-text">{value}</p>
            </div>
        </Card>
    );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activePersonnel: 0,
    apparatusInService: 0,
    openIncidents: 0,
    recentIncidents: [] as Incident[],
    apparatusStatus: [] as Apparatus[],
    expiringCerts: [] as ExpiringCertification[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      const fetchStats = async () => {
          try {
              setIsLoading(true);
              const data = await api.getDashboardStats();
              setStats(data);
          } catch (e) {
              setError("Failed to load dashboard data.");
              console.error(e);
          } finally {
              setIsLoading(false);
          }
      };
      fetchStats();
  }, []);

  if (isLoading) {
    return <div className="text-center text-dark-text-secondary">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
            icon={<UsersIcon className="h-6 w-6 text-white"/>}
            title="Active Personnel"
            value={stats.activePersonnel}
            color="bg-blue-500"
        />
        <StatCard 
            icon={<TruckIcon className="h-6 w-6 text-white"/>}
            title="Apparatus In Service"
            value={stats.apparatusInService}
            color="bg-green-500"
        />
        <StatCard 
            icon={<AlertTriangleIcon className="h-6 w-6 text-white"/>}
            title="Open Incidents"
            value={stats.openIncidents}
            color="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Recent Incidents" className="lg:col-span-1">
            <ul className="space-y-3">
                {stats.recentIncidents.map(incident => (
                    <li key={incident.id} className="flex justify-between items-center p-3 bg-dark-bg rounded-md">
                        <div>
                            <p className="font-semibold text-dark-text">{incident.type}</p>
                            <p className="text-sm text-dark-text-secondary">{incident.address}</p>
                        </div>
                        <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                            incident.status === 'Open' ? 'bg-yellow-500/20 text-yellow-400' :
                            incident.status === 'Closed' ? 'bg-green-500/20 text-green-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>{incident.status}</span>
                    </li>
                ))}
            </ul>
        </Card>
        <Card title="Apparatus Status" className="lg:col-span-1">
           <ul className="space-y-3">
                {stats.apparatusStatus.map(unit => (
                    <li key={unit.id} className="flex justify-between items-center p-3 bg-dark-bg rounded-md">
                        <div>
                            <p className="font-semibold text-dark-text">{unit.unitId}</p>
                            <p className="text-sm text-dark-text-secondary">{unit.type}</p>
                        </div>
                        <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                            unit.status === ApparatusStatus.IN_SERVICE ? 'bg-green-500/20 text-green-400' :
                            unit.status === ApparatusStatus.OUT_OF_SERVICE ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}>{unit.status}</span>
                    </li>
                ))}
            </ul>
        </Card>
         <Card title="Certification Expirations" className="lg:col-span-1">
            <ul className="space-y-3">
                {stats.expiringCerts.length > 0 ? stats.expiringCerts.map(cert => (
                    <li key={`${cert.personnelId}-${cert.certificationName}`} className="flex items-center p-3 bg-dark-bg rounded-md">
                        <ShieldAlertIcon className="h-6 w-6 text-yellow-400 mr-3 flex-shrink-0" />
                        <div>
                             <Link to={`/app/personnel/${cert.personnelId}`} className="font-semibold text-dark-text hover:underline">{cert.personnelName}</Link>
                            <p className="text-sm text-dark-text-secondary">{cert.certificationName} expires on {new Date(cert.expires).toLocaleDateString()}</p>
                        </div>
                    </li>
                )) : (
                    <p className="text-center text-dark-text-secondary py-4">No certifications expiring in the next 90 days.</p>
                )}
            </ul>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

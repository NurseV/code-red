
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useInternalAuth } from '../../hooks/useInternalAuth';
import { Role } from '../../types';
import { 
    HomeIcon, UsersIcon, TruckIcon, AlertTriangleIcon, FireExtinguisherIcon, DollarSignIcon, 
    ArchiveIcon, ShieldCheckIcon, ClipboardListIcon, GraduationCapIcon, FolderIcon, 
    MapIcon, CalendarIcon, PieChartIcon, BanknoteIcon, HeartPulseIcon, 
    DropletIcon, BuildingIcon, LandmarkIcon, WrenchIcon, CalendarDaysIcon,
    TrendingUpIcon, MessageSquareIcon, SettingsIcon, MailIcon, ListChecksIcon
} from '../icons/Icons';

const NAV_LINKS = [
    { href: '/app/dashboard', label: 'Dashboard', icon: HomeIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/personnel', label: 'Personnel', icon: UsersIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/apparatus', label: 'Apparatus', icon: TruckIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/incidents', label: 'Incidents', icon: AlertTriangleIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/assets', label: 'Assets', icon: ArchiveIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/inventory', label: 'Inventory', icon: ListChecksIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/internal-comms', label: 'Comms', icon: MessageSquareIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/mass-communication', label: 'Mass Comm', icon: MailIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
];

const INFRASTRUCTURE_LINKS = [
    { href: '/app/hydrants', label: 'Hydrants', icon: DropletIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
];

const ANALYTICS_LINKS = [
    { href: '/app/gis', label: 'GIS Dashboard', icon: MapIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/calendar', label: 'Calendar', icon: CalendarIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/scheduling', label: 'Scheduling', icon: CalendarDaysIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/reporting', label: 'Reporting', icon: PieChartIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/analytics', label: 'Analytics', icon: TrendingUpIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
];

const FINANCIALS_LINKS = [
    { href: '/app/fire-dues', label: 'Fire Dues', icon: DollarSignIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/budgeting', label: 'Budgeting', icon: BanknoteIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/financial-admin', label: 'Financial Admin', icon: LandmarkIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
];

const PUBLIC_LINKS = [
    { href: '/app/public-portal', label: 'Public Portal', icon: ShieldCheckIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
];

const MANAGEMENT_LINKS = [
    { href: '/app/admin', label: 'Admin', icon: ClipboardListIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/settings', label: 'Settings', icon: SettingsIcon, roles: [Role.ADMINISTRATOR] },
    { href: '/app/properties', label: 'Properties', icon: BuildingIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/maintenance', label: 'Maintenance', icon: WrenchIcon, roles: [Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/training', label: 'Training', icon: GraduationCapIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/documents', label: 'Documents', icon: FolderIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
    { href: '/app/health-safety', label: 'Health & Safety', icon: HeartPulseIcon, roles: [Role.FIREFIGHTER, Role.CHIEF, Role.ADMINISTRATOR] },
];

const Sidebar: React.FC = () => {
  const { user } = useInternalAuth();
  const location = useLocation();

  if (!user) return null;

  const renderNavSection = (title: string, links: typeof NAV_LINKS) => {
    const accessibleLinks = links.filter(link => link.roles.includes(user.role));
    if (accessibleLinks.length === 0) return null;
    
    return (
        <>
            <h3 className="px-4 mt-6 mb-2 text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">{title}</h3>
            {accessibleLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.href) && (link.href !== '/app/personnel' || location.pathname === '/app/personnel');
                return (
                  <NavLink
                    key={link.label}
                    to={link.href}
                    end={link.href.includes('dashboard')} // Ensure exact match for dashboard
                    className={`flex items-center px-4 py-3 my-1 text-base rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-brand-primary text-white font-semibold'
                        : 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'
                    }`}
                  >
                    <link.icon className="h-6 w-6 mr-3" />
                    <span>{link.label}</span>
                  </NavLink>
                );
            })}
        </>
    );
  };


  return (
    <div className="hidden md:flex flex-col w-64 bg-dark-card border-r border-dark-border no-print">
      <div className="flex items-center justify-center h-20 border-b border-dark-border">
        <FireExtinguisherIcon className="h-8 w-8 text-brand-primary" />
        <h1 className="text-xl font-bold ml-3 text-white">Fire OMS</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4">
          {renderNavSection("Core", NAV_LINKS)}
          {renderNavSection("Infrastructure", INFRASTRUCTURE_LINKS)}
          {renderNavSection("Analytics", ANALYTICS_LINKS)}
          {renderNavSection("Financials", FINANCIALS_LINKS)}
          {renderNavSection("Public Facing", PUBLIC_LINKS)}
          {renderNavSection("Management", MANAGEMENT_LINKS)}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;


import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { InternalAuthProvider, useInternalAuth } from './hooks/useInternalAuth';
import { CitizenAuthProvider, useCitizenAuth } from './hooks/useCitizenAuth';

// Layouts
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';

// Internal Pages
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import Apparatus from './pages/Apparatus';
import Incidents from './pages/Incidents';
import CreateIncident from './pages/CreateIncident';
import InternalLogin from './pages/InternalLogin';
import NotFound from './pages/NotFound';
import PersonnelDetail from './pages/PersonnelDetail';
import ApparatusDetail from './pages/ApparatusDetail';
import NewApparatus from './pages/NewApparatus';
import IncidentDetail from './pages/IncidentDetail';
import FireDues from './pages/FireDues';
import PublicPortalAdmin from './pages/PublicPortalAdmin';
import Admin from './pages/Admin';
import ApparatusChecklist from './pages/ApparatusChecklist';
import Assets from './pages/Assets';
import Inventory from './pages/Inventory';
import Training from './pages/Training';
import Documents from './pages/Documents';
import GisDashboard from './pages/GisDashboard';
import Calendar from './pages/Calendar';
import Reporting from './pages/Reporting';
import Budgeting from './pages/Budgeting';
import HealthSafety from './pages/HealthSafety';
import LogExposure from './pages/LogExposure';
import HydrantManagement from './pages/HydrantManagement';
import PropertyManagement from './pages/PropertyManagement';
import PropertyDetail from './pages/PropertyDetail';
import PreIncidentPlan from './pages/PreIncidentPlan';
import FinancialAdmin from './pages/FinancialAdmin';
import Maintenance from './pages/Maintenance';
import Scheduling from './pages/Scheduling';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import InternalComms from './pages/InternalComms';
import Settings from './pages/Settings';
import MassCommunication from './pages/MassCommunication';


// Public Pages
import PublicHome from './pages/public/PublicHome';
import PublicAnnouncements from './pages/public/PublicAnnouncements';
import StormShelterRegistry from './pages/public/StormShelterRegistry';
import BurnPermitApplication from './pages/public/BurnPermitApplication';
import CommunityCalendar from './pages/public/CommunityCalendar';
import AboutUs from './pages/public/AboutUs';
import PhotoGallery from './pages/public/PhotoGallery';
import AlbumDetail from './pages/public/AlbumDetail';
import RecordsRequest from './pages/public/RecordsRequest';


// Citizen Portal Pages
import CitizenLogin from './pages/portal/CitizenLogin';
import CitizenRegister from './pages/portal/CitizenRegister';
import CitizenDashboard from './pages/portal/CitizenDashboard';
import AccountSettings from './pages/portal/AccountSettings';
import BillForgiveness from './pages/portal/BillForgiveness';


// A wrapper for PROTECTED INTERNAL routes that redirects to login if not authenticated.
const InternalProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useInternalAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// A wrapper for PROTECTED CITIZEN routes that redirects to login if not authenticated.
const CitizenProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useCitizenAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};


const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* --- Public Facing Portal --- */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PublicHome />} />
              <Route path="/announcements" element={<PublicAnnouncements />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/community-calendar" element={<CommunityCalendar />} />
              <Route path="/photo-gallery" element={<PhotoGallery />} />
              <Route path="/photo-gallery/:albumId" element={<AlbumDetail />} />
              <Route path="/storm-shelter-registry" element={<StormShelterRegistry />} />
              <Route path="/burn-permit-application" element={<BurnPermitApplication />} />
              <Route path="/records-request" element={<RecordsRequest />} />
              <Route path="/login" element={<CitizenLogin />} />
              <Route path="/register" element={<CitizenRegister />} />

              {/* Secure Citizen Portal */}
              <Route path="/portal/dashboard" element={<CitizenProtectedRoute><CitizenDashboard /></CitizenProtectedRoute>} />
              <Route path="/portal/settings" element={<CitizenProtectedRoute><AccountSettings /></CitizenProtectedRoute>} />
              <Route path="/portal/bill-forgiveness" element={<CitizenProtectedRoute><BillForgiveness /></CitizenProtectedRoute>} />
            </Route>
            
            {/* --- Internal Admin Portal --- */}
            <Route path="/app/login" element={<InternalLogin />} />
            
            <Route path="/app" element={
                <InternalProtectedRoute>
                    <Layout />
                </InternalProtectedRoute>
            }>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                
                {/* Core Modules */}
                <Route path="personnel" element={<Personnel />} />
                <Route path="personnel/:id" element={<PersonnelDetail />} />
                <Route path="apparatus" element={<Apparatus />} />
                <Route path="apparatus/new" element={<NewApparatus />} />
                <Route path="apparatus/:id" element={<ApparatusDetail />} />
                <Route path="apparatus/:id/checklist" element={<ApparatusChecklist />} />
                <Route path="incidents" element={<Incidents />} />
                <Route path="incidents/new" element={<CreateIncident />} />
                <Route path="incidents/:id" element={<IncidentDetail />} />
                <Route path="incidents/:id/edit" element={<CreateIncident />} />
                <Route path="incidents/:id/log-exposure" element={<LogExposure />} />
                <Route path="internal-comms" element={<InternalComms />} />
                <Route path="assets" element={<Assets />} />
                <Route path="inventory" element={<Inventory />} />

                {/* Infrastructure Modules */}
                <Route path="hydrants" element={<HydrantManagement />} />
                <Route path="properties" element={<PropertyManagement />} />
                <Route path="properties/:id" element={<PropertyDetail />} />
                <Route path="properties/:propertyId/pip/:pipId" element={<PreIncidentPlan />} />


                {/* Financial Modules */}
                <Route path="fire-dues" element={<FireDues />} />
                <Route path="budgeting" element={<Budgeting />} />
                <Route path="financial-admin" element={<FinancialAdmin />} />


                {/* Admin & Management */}
                <Route path="admin" element={<Admin />} />
                <Route path="training" element={<Training />} />
                <Route path="documents" element={<Documents />} />
                <Route path="public-portal" element={<PublicPortalAdmin />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="settings" element={<Settings />} />
                <Route path="mass-communication" element={<MassCommunication />} />

                {/* Advanced Features */}
                <Route path="gis" element={<GisDashboard />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="scheduling" element={<Scheduling />} />
                <Route path="reporting" element={<Reporting />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="health-safety" element={<HealthSafety />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <InternalAuthProvider>
      <CitizenAuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </CitizenAuthProvider>
    </InternalAuthProvider>
  );
};

export default App;

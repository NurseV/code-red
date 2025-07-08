

import {
  Personnel, Apparatus, Incident, Owner, Property, FireDue, Announcement,
  StormShelter, BurnPermit, Citizen, BillForgivenessRequest, RepairTicket,
  Applicant, ChecklistTemplate, Asset, Consumable, TrainingCourse, ScheduledTraining,
  Folder, Document, Event, Budget, ExposureLog, SdsSheet, PrebuiltReport, Hydrant,
  PreIncidentPlan, BillingRate, Invoice, Shift, AboutUsContent, PhotoAlbum, Photo,
  RecordsRequest, Notification, AuditLogEntry, SystemConfiguration, InternalMessage,
  DepartmentInfo, SecurityRole, MaintenanceLog, PreventativeMaintenanceSchedule,
  AssetInspection, SavedAssetView, Role, ApparatusStatus, FireDueStatus, BurnPermitStatus, CitizenStatus, RecordsRequestStatus
} from './types';


export const CONFIGURABLE_OPTIONAL_FIELDS = [
    { id: 'basicModule.sectionB.censusTract', label: 'Census Tract (Basic)' },
    { id: 'basicModule.sectionE.district', label: 'District (Basic)' },
    { id: 'basicModule.sectionE.specialStudies', label: 'Special Studies (Basic)' },
    { id: 'basicModule.sectionG.propertyValue', label: 'Pre-Incident Property Value (Basic)' },
    { id: 'basicModule.sectionG.contentsValue', label: 'Pre-Incident Contents Value (Basic)' },
    { id: 'fireModule.ignition.itemFirstIgnited', label: 'Item First Ignited (Fire)' },
    { id: 'fireModule.ignition.materialFirstIgnited', label: 'Material First Ignited (Fire)' },
    { id: 'structureFireModule.detectors.type', label: 'Detector Type (Structure Fire)' },
    { id: 'structureFireModule.detectors.powerSupply', label: 'Detector Power Supply (Structure Fire)' },
    { id: 'structureFireModule.detectors.operation', label: 'Detector Operation (Structure Fire)' },
    { id: 'structureFireModule.detectors.effectiveness', label: 'Detector Effectiveness (Structure Fire)' },
    { id: 'structureFireModule.detectors.failureReason', label: 'Detector Failure Reason (Structure Fire)' },
    { id: 'structureFireModule.extinguishingSystem.type', label: 'Extinguishing System Type (Structure Fire)' },
    { id: 'structureFireModule.extinguishingSystem.operation', label: 'Extinguishing System Operation (Structure Fire)' },
    { id: 'structureFireModule.extinguishingSystem.sprinklerHeads', label: 'Number of Sprinkler Heads (Structure Fire)' },
    { id: 'structureFireModule.extinguishingSystem.failureReason', label: 'Extinguishing System Failure Reason (Structure Fire)' },
    { id: 'wildlandFireModule.weatherInfo.fuelMoisture', label: 'Fuel Moisture % (Wildland)' },
    { id: 'wildlandFireModule.weatherInfo.dangerRating', label: 'Fire Danger Rating (Wildland)' },
];


// Re-populating mock data exports to fix build errors.
// In a real scenario, this would be populated with actual mock data.

export let MOCK_PERSONNEL: Personnel[] = [];
export let MOCK_APPARATUS: Apparatus[] = [];
export let MOCK_INCIDENTS: Incident[] = [];
export let MOCK_OWNERS: Owner[] = [];
export let MOCK_PROPERTIES: Property[] = [];
export let MOCK_FIRE_DUES: FireDue[] = [];
export let MOCK_ANNOUNCEMENTS: Announcement[] = [];
export let MOCK_STORM_SHELTERS: StormShelter[] = [];
export let MOCK_BURN_PERMITS: BurnPermit[] = [];
export let MOCK_CITIZENS: Citizen[] = [];
export let MOCK_BILL_FORGIVENESS_REQUESTS: BillForgivenessRequest[] = [];
export let MOCK_REPAIR_TICKETS: RepairTicket[] = [];
export let MOCK_APPLICANTS: Applicant[] = [];
export let MOCK_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [];
export let MOCK_ASSETS: Asset[] = [];
export let MOCK_CONSUMABLES: Consumable[] = [];
export let MOCK_TRAINING_COURSES: TrainingCourse[] = [];
export let MOCK_SCHEDULED_TRAININGS: ScheduledTraining[] = [];
export let MOCK_FOLDERS: Folder[] = [];
export let MOCK_DOCUMENTS: Document[] = [];
export let MOCK_EVENTS: Event[] = [];
export let MOCK_BUDGET: Budget = { id: 'budget-1', fiscalYear: new Date().getFullYear(), totalBudget: 0, totalSpent: 0, lineItems: [] };
export let MOCK_EXPOSURE_LOGS: ExposureLog[] = [];
export let MOCK_SDS_SHEETS: SdsSheet[] = [];
export let MOCK_PREBUILT_REPORTS: PrebuiltReport[] = [];
export let MOCK_GIS_HYDRANTS: Hydrant[] = [];
export let MOCK_PRE_INCIDENT_PLANS: PreIncidentPlan[] = [];
export let MOCK_BILLING_RATES: BillingRate[] = [];
export let MOCK_INVOICES: Invoice[] = [];
export let MOCK_SHIFTS: Shift[] = [];
export let MOCK_ABOUT_US_CONTENT: AboutUsContent = { mission: '', values: [], history: '', orgStructureDescription: '' };
export let MOCK_PHOTO_ALBUMS: PhotoAlbum[] = [];
export let MOCK_PHOTOS: Photo[] = [];
export let MOCK_RECORDS_REQUESTS: RecordsRequest[] = [];
export let MOCK_NOTIFICATIONS: Notification[] = [];
export let MOCK_AUDIT_LOGS: AuditLogEntry[] = [];
export let MOCK_CONFIGURATION: SystemConfiguration = { incidentTypes: [], budgetCategories: [], optionalFields: {}, assetViews: [] };
export let MOCK_INTERNAL_MESSAGES: InternalMessage[] = [];
export let MOCK_DEPARTMENT_INFO: DepartmentInfo = { name: '', fdid: '', address: { street: '', city: '', state: '', zip: '' }, phone: '', fax: '', email: '', fipsCode: '', stationCount: 0, numberOfPaidFirefighters: 0, numberOfVolunteerFirefighters: 0, numberOfVolunteerPaidPerCallFirefighters: 0, primaryContact: { name: '', role: '', phone: '', email: '' }, secondaryContact: { name: '', role: '', phone: '', email: '' }, medicalDirector: { name: '', role: '', phone: '', email: '' }, frequencyStatus: '', servicesProvided: [], emsStatus: '', annualDispatches: 0 };
export let MOCK_SECURITY_ROLES: SecurityRole[] = [];
export let MOCK_MAINTENANCE_LOGS: MaintenanceLog[] = [];
export let MOCK_PM_SCHEDULES: PreventativeMaintenanceSchedule[] = [];
export let MOCK_INSPECTION_HISTORY: AssetInspection[] = [];
export let MOCK_SAVED_ASSET_VIEWS: SavedAssetView[] = [];

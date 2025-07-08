

import { 
    MOCK_PERSONNEL, MOCK_APPARATUS, MOCK_INCIDENTS,
    MOCK_OWNERS, MOCK_PROPERTIES, MOCK_FIRE_DUES, MOCK_ANNOUNCEMENTS,
    MOCK_STORM_SHELTERS, MOCK_BURN_PERMITS, MOCK_CITIZENS, MOCK_BILL_FORGIVENESS_REQUESTS,
    MOCK_REPAIR_TICKETS, MOCK_APPLICANTS, MOCK_CHECKLIST_TEMPLATES, MOCK_ASSETS,
    MOCK_CONSUMABLES, MOCK_TRAINING_COURSES, MOCK_SCHEDULED_TRAININGS, MOCK_FOLDERS,
    MOCK_DOCUMENTS, MOCK_EVENTS, MOCK_BUDGET, MOCK_EXPOSURE_LOGS,
    MOCK_SDS_SHEETS, MOCK_PREBUILT_REPORTS, MOCK_GIS_HYDRANTS,
    MOCK_PRE_INCIDENT_PLANS, MOCK_BILLING_RATES, MOCK_INVOICES, MOCK_SHIFTS,
    MOCK_ABOUT_US_CONTENT, MOCK_PHOTO_ALBUMS, MOCK_PHOTOS, MOCK_RECORDS_REQUESTS,
    MOCK_NOTIFICATIONS, MOCK_AUDIT_LOGS, MOCK_CONFIGURATION, MOCK_INTERNAL_MESSAGES,
    MOCK_DEPARTMENT_INFO, MOCK_SECURITY_ROLES, MOCK_MAINTENANCE_LOGS, MOCK_PM_SCHEDULES, 
    MOCK_INSPECTION_HISTORY, MOCK_SAVED_ASSET_VIEWS
} from '../constants';
import { NFIRS_INCIDENT_TYPES } from '../constants/nfirs-codes';
import { 
    User, Role, Personnel, Apparatus, Incident, FireDue, FireDueStatus, Announcement,
    StormShelter, BurnPermit, BurnPermitStatus, Citizen, CitizenStatus, CitizenUser,
    BillForgivenessRequest, Applicant, ApplicantStatus, ChecklistTemplate, Asset, 
    Consumable, TrainingCourse, ScheduledTraining, Folder, Document, Hydrant, Event, EventCategory,
    ApparatusChecklistItem, RepairTicket, PrebuiltReport, Budget,
    ExposureLog, SdsSheet, HydrantInspection, PreIncidentPlan, Owner, Property,
    BillingRate, Invoice, InvoiceLineItem, EmergencyContact, ExpiringCertification, TrainingRecord,
    Shift, LineItem, CustomReportConfig, ChecklistItemTemplate, ApparatusStatus, LeadershipMember,
    PhotoAlbum, Photo, RecordsRequest, RecordsRequestStatus, NfirsIncident, Attachment,
    Notification, SystemConfiguration, AuditLogEntry, InternalMessage, DepartmentInfo, SecurityRole, 
    Compartment, NfirsModuleSectionA, MaintenanceLog, PreventativeMaintenanceSchedule, AssetInspection, 
    AssetPhoto, AssetDocument, SavedAssetView, ConsumableUsageLog, NfirsFireModule, NfirsStructureFireModule, NfirsEmsModule, NfirsWildlandFireModule, NfirsHazmatModule, NfirsArsonModule
} from '../types';

const SIMULATED_DELAY = 300;

// Helper to simulate an API call with a delay
const simulateApiCall = <T>(data: T, errorRate = 0): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        reject(new Error("A simulated network error occurred."));
      } else {
        // Return a deep copy to prevent direct mutation of the "database"
        if (typeof data === 'undefined') {
            resolve(undefined as T);
        } else {
            resolve(JSON.parse(JSON.stringify(data)));
        }
      }
    }, SIMULATED_DELAY);
  });
};

// --- In-memory stores for new features ---
let MOCK_NFIRS_INCIDENTS: NfirsIncident[] = [];
let MOCK_ATTACHMENTS: Record<string, Attachment[]> = {};


// --- AUTH ---

export const loginInternalUser = (username: string): Promise<Personnel | null> => {
    const lowerCaseUsername = username.toLowerCase();
    const user = MOCK_PERSONNEL.find(p => p.username.toLowerCase() === lowerCaseUsername) || null;
    return simulateApiCall(user);
};

export const loginCitizenUser = (email: string, password): Promise<{ user: CitizenUser | null; error: string | null }> => {
    const citizen = MOCK_CITIZENS.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (citizen && citizen.password === password) {
        if(citizen.status === CitizenStatus.PENDING_APPROVAL) return simulateApiCall({ user: null, error: "Your account is pending approval by an administrator."});
        if(citizen.status === CitizenStatus.SUSPENDED) return simulateApiCall({ user: null, error: "Your account has been suspended."});
        if (citizen.status === CitizenStatus.ACTIVE) {
            return simulateApiCall({ user: { id: citizen.id, name: citizen.name, email: citizen.email }, error: null });
        }
    }
    return simulateApiCall({ user: null, error: "Invalid email or password." });
};

export const registerCitizen = (name: string, email: string, password) => {
    const existing = MOCK_CITIZENS.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        return simulateApiCall({ success: false, error: 'An account with this email already exists.' });
    }
    const newCitizen: Citizen = {
        id: `citizen-${Date.now()}`,
        name, email, password,
        propertyIds: [],
        status: CitizenStatus.PENDING_APPROVAL,
    };
    MOCK_CITIZENS.push(newCitizen);
    return simulateApiCall({ success: true, error: null });
};

// --- AUDIT LOG ---
export const logAuditEvent = (userId: string, action: string, target: string, targetId: string, details?: any): Promise<AuditLogEntry> => {
    const user = MOCK_PERSONNEL.find(p => p.id === userId);
    const newLog: AuditLogEntry = {
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId,
        userName: user?.name || 'Unknown User',
        action,
        target,
        targetId,
        details,
    };
    MOCK_AUDIT_LOGS.unshift(newLog); // Add to beginning
    return simulateApiCall(newLog);
}

// --- INCIDENTS ---

export const getIncidentsList = (filters?: { searchTerm?: string; type?: string; status?: Incident['status']; }) => {
    let results = [...MOCK_INCIDENTS];
    if (filters) {
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            results = results.filter(i => i.address.toLowerCase().includes(term) || i.incidentNumber.toLowerCase().includes(term));
        }
        if (filters.type) {
            results = results.filter(i => i.type === filters.type);
        }
        if (filters.status) {
            results = results.filter(i => i.status === filters.status);
        }
    }
    return simulateApiCall(results);
};

export const getIncidentById = (id: string): Promise<NfirsIncident | null> => {
    const baseIncident = MOCK_INCIDENTS.find(i => i.id === id);
    if (!baseIncident) return simulateApiCall(null);

    let nfirsIncident = MOCK_NFIRS_INCIDENTS.find(i => i.id === id);
    if (nfirsIncident) {
        nfirsIncident.attachments = MOCK_ATTACHMENTS[id] || [];
        return simulateApiCall(nfirsIncident);
    }
    
    // Create a new default shell from base incident if it doesn't exist
    const newNfirsIncident: NfirsIncident = {
        ...baseIncident,
        status: 'In Progress',
        basicModule: {
             sectionA: {
                fdid: 'FD123',
                state: 'CA',
                incidentDate: baseIncident.date.split('T')[0],
                station: '01',
                incidentNumber: baseIncident.incidentNumber,
                exposureNumber: '0',
                deleteChangeNoActivity: ''
            },
            sectionB: {
                 locationType: "",
                 censusTract: '',
                 numberMilepost: baseIncident.address.split(' ')[0],
                 streetPrefix: '',
                 streetOrHighwayName: baseIncident.address,
                 streetType: '',
                 streetSuffix: '',
                 apartmentSuiteRoom: '',
                 city: 'Anytown',
                 state: 'CA',
                 zipCode: '12345',
                 crossStreetDirections: ''
            },
            incidentType: "",
            aidGivenOrReceived: 'N',
            sectionE: { alarmDateTime: '', arrivalDateTime: '', controlledDateTime: '', lastUnitClearedDateTime: '', shiftOrPlatoon: 'A', alarms: '1', district: '1', specialStudies: '' },
            actionsTaken: [],
            sectionG: { apparatusCount: 0, personnelSuppression: 0, personnelEms: 0, personnelOther: 0, propertyLoss: 0, contentsLoss: 0, propertyValue: 0, contentsValue: 0, completedModules: [] },
            sectionH: { casualtiesFire: 0, casualtiesCivilian: 0, detectorPresence: '', detectorEffectiveness: undefined, hazMatReleased: '' },
            mixedUseProperty: '',
            propertyUse: '',
            sectionK_personEntity: {},
            sectionK_owner: {},
            remarks: baseIncident.narrative || '',
            sectionM: { officerInCharge: '', memberMakingReport: '' }
        },
        attachments: [],
        civilianCasualties: [],
        fireServiceCasualties: [],
    };
    MOCK_NFIRS_INCIDENTS.push(newNfirsIncident);
    MOCK_ATTACHMENTS[id] = [];
    return simulateApiCall(newNfirsIncident);
};

export const createIncident = (user: User, incidentData: Omit<Incident, 'id' | 'incidentNumber'>): Promise<NfirsIncident> => {
    const newIncident: Incident = {
        ...incidentData,
        id: `i-${Date.now()}`,
        incidentNumber: `2024-${Math.floor(Math.random() * 900) + 100}`,
    };
    MOCK_INCIDENTS.push(newIncident);
    logAuditEvent(user.id, 'CREATE', 'Incident', newIncident.id, { number: newIncident.incidentNumber });
    return getIncidentById(newIncident.id).then(nfirs => nfirs!);
};

export const updateIncident = (id: string, incidentData: Partial<NfirsIncident>, user: User | null): Promise<NfirsIncident> => {
    const index = MOCK_NFIRS_INCIDENTS.findIndex(i => i.id === id);
    if (index === -1) {
        throw new Error("Incident not found");
    }
    const originalIncident = MOCK_NFIRS_INCIDENTS[index];

    // Process supplies used if they have changed
    if (incidentData.suppliesUsed && JSON.stringify(incidentData.suppliesUsed) !== JSON.stringify(originalIncident.suppliesUsed)) {
        // This is a simple mock logic. A real system would be more robust.
        // It "returns" all previously used supplies, then "uses" the new list.
        if (originalIncident.suppliesUsed) {
            originalIncident.suppliesUsed.forEach(supply => {
                const consumable = MOCK_CONSUMABLES.find(c => c.id === supply.consumableId);
                if (consumable) consumable.quantity += supply.quantity;
            });
        }
        
        incidentData.suppliesUsed.forEach(supply => {
            const consumable = MOCK_CONSUMABLES.find(c => c.id === supply.consumableId);
            if (consumable) {
                consumable.quantity -= supply.quantity;
                logConsumableUsage(consumable.id, -supply.quantity, `Used on Incident ${originalIncident.basicModule.sectionA.incidentNumber}`, user?.id || 'system');
            }
        });
    }

    const updatedIncident = { ...originalIncident, ...incidentData };
    MOCK_NFIRS_INCIDENTS[index] = updatedIncident;

    if (user) {
         if (originalIncident.status !== 'Locked' && updatedIncident.status === 'Locked') {
            logAuditEvent(user.id, 'LOCK', 'Incident', id);
        }
        if (originalIncident.status === 'Locked' && updatedIncident.status !== 'Locked') {
            logAuditEvent(user.id, 'UNLOCK', 'Incident', id);
        }
    }
    
    return simulateApiCall(updatedIncident);
};

// --- ATTACHMENTS ---
export const getAttachments = (incidentId: string): Promise<Attachment[]> => {
    return simulateApiCall(MOCK_ATTACHMENTS[incidentId] || []);
};

export const uploadAttachment = (incidentId: string, file: File): Promise<Attachment> => {
    const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: URL.createObjectURL(file) // temporary URL for viewing
    };

    if (!MOCK_ATTACHMENTS[incidentId]) {
        MOCK_ATTACHMENTS[incidentId] = [];
    }
    MOCK_ATTACHMENTS[incidentId].push(newAttachment);
    
    const incident = MOCK_NFIRS_INCIDENTS.find(i => i.id === incidentId);
    if(incident) {
        if(!incident.attachments) incident.attachments = [];
        incident.attachments.push(newAttachment);
    }
    return simulateApiCall(newAttachment);
};

export const deleteAttachment = (incidentId: string, attachmentId: string): Promise<void> => {
    if (MOCK_ATTACHMENTS[incidentId]) {
        MOCK_ATTACHMENTS[incidentId] = MOCK_ATTACHMENTS[incidentId].filter(a => a.id !== attachmentId);
    }
     const incident = MOCK_NFIRS_INCIDENTS.find(i => i.id === incidentId);
    if(incident && incident.attachments) {
        incident.attachments = incident.attachments.filter(a => a.id !== attachmentId);
    }
    return simulateApiCall(undefined);
};

// --- PERSONNEL ---
export const getPersonnelList = (filters?: { searchTerm?: string; rank?: string; status?: Personnel['status']; }) => {
    let results = [...MOCK_PERSONNEL];
    if (filters) {
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            results = results.filter(p => p.name.toLowerCase().includes(term) || p.badgeNumber.toLowerCase().includes(term));
        }
        if (filters.rank) {
            results = results.filter(p => p.rank === filters.rank);
        }
        if (filters.status) {
            results = results.filter(p => p.status === filters.status);
        }
    }
    return simulateApiCall(results);
};

export const getPersonnelById = (id: string) => simulateApiCall(MOCK_PERSONNEL.find(p => p.id === id) || null);

export const updatePersonnel = (id: string, data: Partial<Personnel>, user: User | null): Promise<Personnel> => {
    const index = MOCK_PERSONNEL.findIndex(p => p.id === id);
    if(index === -1) throw new Error("Personnel not found");

    const originalData = MOCK_PERSONNEL[index];
    const updatedData = { ...originalData, ...data };
    MOCK_PERSONNEL[index] = updatedData;
    
    if (user) {
        const changes: Record<string, {from: any; to: any}> = {};
        for(const key of Object.keys(data)) {
            if(JSON.stringify(originalData[key]) !== JSON.stringify(data[key])) {
                changes[key] = { from: originalData[key], to: data[key] };
            }
        }
        if (Object.keys(changes).length > 0) {
            logAuditEvent(user.id, 'UPDATE', 'Personnel', id, changes);
        }
    }

    return simulateApiCall(updatedData);
};

export const updateUserProfile = (id: string, data: Partial<Personnel>): Promise<Personnel> => {
    return updatePersonnel(id, data, null); // Pass null for user to avoid audit log loop if called from profile page itself
};

export const createPersonnelDirectly = (initialData: { name: string; email: string; rank: string; status: 'Active' | 'Probation' | 'Inactive' }, user: User): Promise<Personnel> => {
    const newPersonnel: Personnel = {
        id: `p-${Date.now()}`,
        nfirsId: `NF-${Math.floor(Math.random() * 900) + 100}`,
        badgeNumber: `B-${new Date().getFullYear() + 1}`,
        name: initialData.name,
        rank: initialData.rank,
        status: initialData.status,
        phoneNumbers: [],
        emails: [{ type: 'Work', address: initialData.email }],
        username: initialData.name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 100),
        role: Role.FIREFIGHTER, // Default role
        avatarUrl: `https://picsum.photos/seed/${initialData.name}/100/100`,
        certifications: [],
        emergencyContacts: [],
        trainingHistory: [],
    };
    MOCK_PERSONNEL.push(newPersonnel);
    logAuditEvent(user.id, 'CREATE', 'Personnel', newPersonnel.id, { method: 'Direct Add / Migration' });
    return simulateApiCall(newPersonnel);
};

export const uploadCertificationDocument = (personnelId: string, certId: string, file: File) => {
     const person = MOCK_PERSONNEL.find(p => p.id === personnelId);
    if(person) {
        const cert = person.certifications.find(c => c.id === certId);
        if (cert) {
            cert.documentUrl = `/docs/mock/${file.name}`;
        }
    }
    return simulateApiCall({ success: true, url: `/docs/mock/${file.name}` });
}

// --- APPARATUS ---

export const getApparatusList = (filters?: any) => {
    let results = [...MOCK_APPARATUS];
    if (filters) {
        if(filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            results = results.filter(a => a.unitId.toLowerCase().includes(term));
        }
        if(filters.type) {
            results = results.filter(a => a.type === filters.type);
        }
        if(filters.status) {
            results = results.filter(a => a.status === filters.status);
        }
    }
    return simulateApiCall(results);
};
export const getApparatusById = (id: string) => simulateApiCall(MOCK_APPARATUS.find(a => a.id === id) || null);
export const updateApparatus = (id: string, data: Partial<Apparatus>, user?: User | null): Promise<Apparatus> => {
    const index = MOCK_APPARATUS.findIndex(a => a.id === id);
    if(index === -1) throw new Error("Apparatus not found");

    const originalApparatus = { ...MOCK_APPARATUS[index] };
    const updatedApparatus = { ...originalApparatus, ...data };

    // If vitals are being updated, log them
    if (data.mileage || data.engineHours) {
        if (!updatedApparatus.vitalsHistory) {
            updatedApparatus.vitalsHistory = [];
        }
        updatedApparatus.vitalsHistory.unshift({
            id: `vl-${Date.now()}`,
            date: new Date().toISOString(),
            mileage: data.mileage ?? originalApparatus.mileage,
            engineHours: data.engineHours ?? originalApparatus.engineHours,
            userId: user?.id || 'system',
        });
    }

    MOCK_APPARATUS[index] = updatedApparatus;
    
    if (user) {
        // Simplified audit log for key changes
        const changes: Record<string, any> = {};
        if (data.status && data.status !== originalApparatus.status) {
            changes.status = { from: originalApparatus.status, to: data.status };
        }
         if (data.mileage && data.mileage !== originalApparatus.mileage) {
            changes.mileage = { from: originalApparatus.mileage, to: data.mileage };
        }
        if (Object.keys(changes).length > 0) {
            logAuditEvent(user.id, 'UPDATE_APPARATUS', 'Apparatus', id, changes);
        }
    }

    return simulateApiCall(updatedApparatus);
};

export const createApparatus = (apparatusData: Omit<Apparatus, 'id' | 'lastCheck' | 'mileage' | 'engineHours' | 'checklistTemplateId' | 'vitalsHistory' | 'compartments'>): Promise<Apparatus> => {
    const newApparatus: Apparatus = {
        ...apparatusData,
        id: `a-${Date.now()}`,
        lastCheck: new Date().toISOString(),
        mileage: 0,
        engineHours: 0,
        checklistTemplateId: 'ct-general', // default
        vitalsHistory: [],
        compartments: [],
        location: { lat: Math.random() * 10 + 45, lng: Math.random() * 10 + 45 }
    };
    MOCK_APPARATUS.push(newApparatus);
    return simulateApiCall(newApparatus);
};

export const updateApparatusCompartments = (apparatusId: string, compartments: Compartment[]): Promise<Apparatus> => {
    const apparatus = MOCK_APPARATUS.find(a => a.id === apparatusId);
    if (!apparatus) {
        throw new Error("Apparatus not found");
    }
    apparatus.compartments = compartments;
    return simulateApiCall(apparatus);
};

// --- PUBLIC PORTAL & SERVICES ---

export const getAnnouncements = (): Promise<Announcement[]> => {
    return simulateApiCall(MOCK_ANNOUNCEMENTS.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
};
export const createAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const newAnnouncement: Announcement = { ...data, id: `ann-${Date.now()}`, createdAt: new Date().toISOString() };
    MOCK_ANNOUNCEMENTS.push(newAnnouncement);
    return simulateApiCall(newAnnouncement);
};
export const updateAnnouncement = (id: string, data: {title: string, content: string}): Promise<Announcement> => {
    const announcement = MOCK_ANNOUNCEMENTS.find(a => a.id === id);
    if (!announcement) throw new Error("Announcement not found");
    announcement.title = data.title;
    announcement.content = data.content;
    return simulateApiCall(announcement);
};
export const deleteAnnouncement = (id: string): Promise<void> => {
    const index = MOCK_ANNOUNCEMENTS.findIndex(a => a.id === id);
    if (index > -1) {
        MOCK_ANNOUNCEMENTS.splice(index, 1);
    }
    return simulateApiCall(undefined);
};

export const getStormShelters = (): Promise<StormShelter[]> => simulateApiCall(MOCK_STORM_SHELTERS);
export const createStormShelter = (data: Omit<StormShelter, 'id' | 'registeredAt'>): Promise<StormShelter> => {
    const newShelter: StormShelter = { ...data, id: `ss-${Date.now()}`, registeredAt: new Date().toISOString() };
    MOCK_STORM_SHELTERS.push(newShelter);
    return simulateApiCall(newShelter);
};

export const getBurnPermits = (): Promise<BurnPermit[]> => simulateApiCall(MOCK_BURN_PERMITS);
export const createBurnPermit = (data: Omit<BurnPermit, 'id' | 'status'>): Promise<BurnPermit> => {
    const newPermit: BurnPermit = { ...data, id: `bp-${Date.now()}`, status: BurnPermitStatus.PENDING };
    MOCK_BURN_PERMITS.push(newPermit);
    return simulateApiCall(newPermit);
};
export const updateBurnPermitStatus = (id: string, status: BurnPermitStatus): Promise<BurnPermit> => {
    const permit = MOCK_BURN_PERMITS.find(p => p.id === id);
    if (!permit) throw new Error("Permit not found");
    permit.status = status;
    return simulateApiCall(permit);
};

// --- FINANCIAL / DUES ---

export const getFireDuesWithDetails = async (): Promise<(FireDue & { address: string; ownerName: string; })[]> => {
    const dues = await simulateApiCall(MOCK_FIRE_DUES);
    const properties = MOCK_PROPERTIES;
    const owners = MOCK_OWNERS;

    const detailedDues = dues.map(due => {
        const property = properties.find(p => p.id === due.propertyId);
        const owner = property ? owners.find(o => property.ownerIds.includes(o.id)) : null;
        return {
            ...due,
            address: property?.address || 'N/A',
            ownerName: owner?.name || 'N/A',
        };
    });
    return detailedDues;
};

export const updateFireDueStatus = (dueId: string, status: FireDueStatus): Promise<FireDue> => {
    const due = MOCK_FIRE_DUES.find(d => d.id === dueId);
    if (!due) {
        throw new Error("Fire due not found");
    }
    due.status = status;
    return simulateApiCall(due);
};

export const payFireDue = (dueId: string): Promise<FireDue> => {
    return updateFireDueStatus(dueId, FireDueStatus.PAID);
};

// --- CITIZEN PORTAL ---

export const getCitizenDashboardData = async (citizenId: string): Promise<{ properties: Property[], dues: FireDue[] }> => {
    const citizen = MOCK_CITIZENS.find(c => c.id === citizenId);
    if (!citizen) return { properties: [], dues: [] };
    
    const properties = MOCK_PROPERTIES.filter(p => citizen.propertyIds.includes(p.id));
    const propertyIds = properties.map(p => p.id);
    const dues = MOCK_FIRE_DUES.filter(d => propertyIds.includes(d.propertyId));
    
    return simulateApiCall({ properties, dues });
};

export const getOverdueDuesForCitizen = async (citizenId: string): Promise<FireDue[]> => {
    const { dues } = await getCitizenDashboardData(citizenId);
    return dues.filter(d => d.status === FireDueStatus.OVERDUE);
};

export const createBillForgivenessRequest = (citizenId: string, fireDueId: string, reason: string): Promise<BillForgivenessRequest> => {
    const newRequest: BillForgivenessRequest = {
        id: `bfr-${Date.now()}`,
        citizenId,
        fireDueId,
        reason,
        submittedAt: new Date().toISOString(),
        status: 'Pending'
    };
    MOCK_BILL_FORGIVENESS_REQUESTS.push(newRequest);
    return simulateApiCall(newRequest);
};

export const getPendingCitizens = (): Promise<Citizen[]> => {
    return simulateApiCall(MOCK_CITIZENS.filter(c => c.status === CitizenStatus.PENDING_APPROVAL));
};

export const updateCitizenStatus = (citizenId: string, status: CitizenStatus): Promise<Citizen> => {
    const citizen = MOCK_CITIZENS.find(c => c.id === citizenId);
    if (!citizen) throw new Error("Citizen not found");
    citizen.status = status;
    return simulateApiCall(citizen);
};

export const getPendingForgivenessRequests = async (): Promise<(BillForgivenessRequest & { citizenName?: string; fireDueInfo?: string; })[]> => {
    const pending = MOCK_BILL_FORGIVENESS_REQUESTS.filter(r => r.status === 'Pending');
    const detailed = pending.map(req => {
        const citizen = MOCK_CITIZENS.find(c => c.id === req.citizenId);
        const due = MOCK_FIRE_DUES.find(d => d.id === req.fireDueId);
        const property = due ? MOCK_PROPERTIES.find(p => p.id === due.propertyId) : null;
        return {
            ...req,
            citizenName: citizen?.name,
            fireDueInfo: due ? `${due.year} Bill ($${due.amount.toFixed(2)}) for ${property?.address}` : 'N/A'
        };
    });
    return simulateApiCall(detailed);
};

export const updateForgivenessRequestStatus = async (requestId: string, status: 'Approved' | 'Denied'): Promise<BillForgivenessRequest> => {
    const request = MOCK_BILL_FORGIVENESS_REQUESTS.find(r => r.id === requestId);
    if (!request) throw new Error("Request not found");
    request.status = status;
    if (status === 'Approved') {
        await updateFireDueStatus(request.fireDueId, FireDueStatus.PAID);
    }
    return simulateApiCall(request);
};

// --- CHECKLISTS & MAINTENANCE ---
export const getChecklistTemplateById = (id: string): Promise<ChecklistTemplate | null> => {
    const template = MOCK_CHECKLIST_TEMPLATES.find(t => t.id === id);
    return simulateApiCall(template || null);
};

export const createRepairTicket = (user: User, ticketData: { itemDescription: string, apparatusId: string, apparatusUnitId: string }): Promise<RepairTicket> => {
    const newTicket: RepairTicket = {
        id: `rt-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'Open',
        ...ticketData
    };
    MOCK_REPAIR_TICKETS.push(newTicket);
    logAuditEvent(user.id, 'CREATE_TICKET', 'Maintenance', newTicket.id, { description: newTicket.itemDescription });
    return simulateApiCall(newTicket);
};

export const syncPendingTickets = async (): Promise<number> => {
    const pendingTicketsJson = localStorage.getItem('pendingTickets');
    if (!pendingTicketsJson) return 0;

    const pendingTickets = JSON.parse(pendingTicketsJson);
    if (pendingTickets.length === 0) return 0;

    const user = MOCK_PERSONNEL.find(p => p.role === Role.ADMINISTRATOR); // mock user for logging
    if (!user) return 0; // Or handle error appropriately

    let successCount = 0;
    for (const ticket of pendingTickets) {
        try {
            await createRepairTicket(user, ticket);
            successCount++;
        } catch (e) {
            console.error("Failed to sync one ticket:", e);
        }
    }

    if (successCount === pendingTickets.length) {
        localStorage.removeItem('pendingTickets');
    } else {
        // Handle partial failure - e.g., only remove successful tickets
        console.error("Partial failure in syncing offline tickets.");
    }
    
    return simulateApiCall(successCount);
};

// --- Fallback/Existing API functions from prompt ---
export const getDashboardStats = () => {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    const expiringCerts: ExpiringCertification[] = MOCK_PERSONNEL.flatMap(p => 
        p.certifications
            .filter(c => {
                const expiresDate = new Date(c.expires);
                return expiresDate > now && expiresDate <= ninetyDaysFromNow;
            })
            .map(c => ({
                personnelId: p.id,
                personnelName: p.name,
                certificationName: c.name,
                expires: c.expires,
            }))
    );
    
    const depInfo = MOCK_DEPARTMENT_INFO;
    const activePersonnel = depInfo.numberOfPaidFirefighters + depInfo.numberOfVolunteerFirefighters + depInfo.numberOfVolunteerPaidPerCallFirefighters;

    const stats = {
        activePersonnel: activePersonnel,
        apparatusInService: MOCK_APPARATUS.filter(a => a.status === ApparatusStatus.IN_SERVICE).length,
        openIncidents: MOCK_INCIDENTS.filter(i => i.status === 'Open').length,
        recentIncidents: MOCK_INCIDENTS.slice(0, 3),
        apparatusStatus: MOCK_APPARATUS.slice(0, 5),
        expiringCerts: expiringCerts
    };
    return simulateApiCall(stats);
};
export const syncWithActive911 = () => simulateApiCall(null, 0.2); // 20% chance of error
export const uploadTrainingRecordDocument = (personnelId: string, courseId: string, file: File) => {
     const person = MOCK_PERSONNEL.find(p => p.id === personnelId);
    if(person) {
        const record = person.trainingHistory.find(r => r.courseId === courseId);
        if (record) {
            record.documentUrl = `/docs/mock/${file.name}`;
        }
    }
    return simulateApiCall({ success: true, url: `/docs/mock/${file.name}` });
}
export const addEmergencyContact = (id: string, contact) => simulateApiCall(null);
export const deleteEmergencyContact = (id: string, contactId: string) => simulateApiCall(null);
export const getAssets = (filters?: {
    searchTerm?: string;
    purchaseDateStart?: string;
    purchaseDateEnd?: string;
    warrantyExpireStart?: string;
    warrantyExpireEnd?: string;
    hasUpcomingPM?: boolean;
}) => {
    let results = [...MOCK_ASSETS];
    if (filters) {
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            results = results.filter(a =>
                a.name.toLowerCase().includes(term) ||
                a.serialNumber.toLowerCase().includes(term) ||
                a.id.toLowerCase() === term ||
                (a.manufacturer && a.manufacturer.toLowerCase().includes(term)) ||
                (a.model && a.model.toLowerCase().includes(term))
            );
        }
        if (filters.purchaseDateStart) {
            results = results.filter(a => new Date(a.purchaseDate) >= new Date(filters!.purchaseDateStart!));
        }
        if (filters.purchaseDateEnd) {
            results = results.filter(a => new Date(a.purchaseDate) <= new Date(filters!.purchaseDateEnd!));
        }
        if (filters.warrantyExpireStart) {
            results = results.filter(a => a.warrantyExpirationDate && new Date(a.warrantyExpirationDate) >= new Date(filters!.warrantyExpireStart!));
        }
        if (filters.warrantyExpireEnd) {
            results = results.filter(a => a.warrantyExpirationDate && new Date(a.warrantyExpirationDate) <= new Date(filters!.warrantyExpireEnd!));
        }
        if (filters.hasUpcomingPM) {
            const ninetyDaysFromNow = new Date();
            ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
            results = results.filter(a => 
                a.pmSchedules.some(pm => new Date(pm.nextDueDate) <= ninetyDaysFromNow)
            );
        }
    }
    return simulateApiCall(results.filter(a => !a.parentId)); // Only return top-level assets in the list view
};

export const getAssetById = async (id: string): Promise<Asset | null> => {
    const asset = MOCK_ASSETS.find(a => a.id === id);
    if (!asset) return simulateApiCall(null);
    
    // If it's a composite asset, find its children
    asset.components = MOCK_ASSETS.filter(a => a.parentId === id);

    // Calculate assignedToName
    if (asset.assignedToType === 'Personnel' && asset.assignedToId) {
        const person = MOCK_PERSONNEL.find(p => p.id === asset.assignedToId);
        asset.assignedToName = person ? person.name : 'Unknown Personnel';
    } else if (asset.assignedToType === 'SubCompartment' && asset.assignedToId) {
        // Find which apparatus this subcompartment belongs to
        const apparatus = MOCK_APPARATUS.find(app => app.compartments.some(c => c.subCompartments.some(sc => sc.id === asset.assignedToId)));
        if (apparatus) {
            const comp = apparatus.compartments.find(c => c.subCompartments.some(sc => sc.id === asset.assignedToId));
            const subComp = comp?.subCompartments.find(sc => sc.id === asset.assignedToId);
            asset.assignedToName = `${apparatus.unitId} > ${comp?.name} > ${subComp?.name}`;
        } else {
            asset.assignedToName = 'Unknown Compartment';
        }
    } else if (asset.assignedToId === null || asset.assignedToId === undefined) {
        asset.assignedToName = 'Storage';
    }
    
    // Calculate TCO on the fly
    const totalMaintenanceCost = asset.maintenanceHistory.reduce((sum, log) => sum + log.cost, 0);
    asset.totalCostOfOwnership = asset.purchasePrice + totalMaintenanceCost;
    
    // Calculate current value via depreciation (simple straight-line over 10 years)
    const ageInYears = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const depreciationPerYear = asset.purchasePrice / (asset.lifespanYears || 10);
    asset.currentValue = Math.max(0, asset.purchasePrice - (ageInYears * depreciationPerYear));
    
    return simulateApiCall(asset);
};


export const createAsset = (assetData: Omit<Asset, 'id' | 'maintenanceHistory' | 'pmSchedules' | 'inspectionHistory'>): Promise<Asset> => {
    const newAsset: Asset = {
        ...assetData,
        id: `as-${Date.now()}`,
        maintenanceHistory: [],
        pmSchedules: [],
        inspectionHistory: [],
    };
    MOCK_ASSETS.unshift(newAsset);
    return simulateApiCall(newAsset);
};
export const updateAsset = (id: string, assetData: Partial<Asset>): Promise<Asset> => {
    const index = MOCK_ASSETS.findIndex(a => a.id === id);
    if (index === -1) {
        throw new Error("Asset not found");
    }
    const updatedAsset = { ...MOCK_ASSETS[index], ...assetData };
    MOCK_ASSETS[index] = updatedAsset;
    return simulateApiCall(updatedAsset);
};
export const deleteAsset = (id: string): Promise<void> => {
    const index = MOCK_ASSETS.findIndex(a => a.id === id);
    if (index > -1) {
        MOCK_ASSETS.splice(index, 1);
    }
    return simulateApiCall(undefined);
};
export const logAssetTest = (id: string): Promise<Asset> => {
    const index = MOCK_ASSETS.findIndex(a => a.id === id);
    if (index === -1) {
        throw new Error("Asset not found");
    }
    const asset = MOCK_ASSETS[index];
    asset.lastTestedDate = new Date().toISOString();
    
    const newInspection: AssetInspection = {
        id: `insp-${Date.now()}`,
        assetId: id,
        date: new Date().toISOString(),
        performedBy: 'System', // This should come from the user context
        notes: 'Routine function test passed.',
    };
    if (!asset.inspectionHistory) asset.inspectionHistory = [];
    asset.inspectionHistory.push(newInspection);

    return simulateApiCall(asset);
};

export const createMaintenanceLog = (logData: Omit<MaintenanceLog, 'id'>): Promise<MaintenanceLog> => {
    const newLog = { ...logData, id: `ml-${Date.now()}` };
    const asset = MOCK_ASSETS.find(a => a.id === logData.assetId);
    if (asset) {
        if (!asset.maintenanceHistory) asset.maintenanceHistory = [];
        asset.maintenanceHistory.push(newLog);
    }
    return simulateApiCall(newLog);
};

export const createPMSchedule = (scheduleData: Omit<PreventativeMaintenanceSchedule, 'id'>): Promise<PreventativeMaintenanceSchedule> => {
    const newSchedule = { ...scheduleData, id: `pm-${Date.now()}` };
    const asset = MOCK_ASSETS.find(a => a.id === scheduleData.assetId);
    if (asset) {
        if (!asset.pmSchedules) asset.pmSchedules = [];
        asset.pmSchedules.push(newSchedule);
    }
    return simulateApiCall(newSchedule);
};

export const assignAssetToCompartment = (assetId: string, apparatusId: string, subCompartmentId: string): Promise<Asset> => {
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (!asset) throw new Error("Asset not found");

    const apparatus = MOCK_APPARATUS.find(app => app.id === apparatusId);
    if (!apparatus) throw new Error("Apparatus not found");

    let subCompFound = false;
    let assignmentName = 'Unknown Location';
    apparatus.compartments.forEach(comp => {
        const subComp = comp.subCompartments.find(sc => sc.id === subCompartmentId);
        if (subComp) {
            if (!subComp.assignedAssetIds.includes(assetId)) {
                subComp.assignedAssetIds.push(assetId);
            }
            subCompFound = true;
            assignmentName = `${apparatus.unitId} > ${comp.name} > ${subComp.name}`;
        }
    });

    if (!subCompFound) throw new Error("Sub-compartment not found");

    asset.assignedToId = subCompartmentId;
    asset.assignedToType = 'SubCompartment';
    asset.assignedToName = assignmentName;
    asset.status = 'In Use';
    
    return simulateApiCall(asset);
};

export const unassignAsset = (assetId: string, apparatusId: string): Promise<Asset> => {
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (!asset) throw new Error("Asset not found");

    const apparatus = MOCK_APPARATUS.find(app => app.id === apparatusId);
    if (apparatus) { // apparatusId could be null if unassigning from person
        apparatus.compartments.forEach(comp => {
            comp.subCompartments.forEach(sc => {
                sc.assignedAssetIds = sc.assignedAssetIds.filter(id => id !== assetId);
            });
        });
    }

    asset.assignedToId = null;
    asset.assignedToType = null;
    asset.assignedToName = undefined;
    asset.status = 'In Storage';

    return simulateApiCall(asset);
};

export const getUnassignedAssets = (): Promise<Asset[]> => {
    const assets = MOCK_ASSETS.filter(a => !a.assignedToId);
    return simulateApiCall(assets);
};

export const assignComponent = (componentId: string, parentId: string): Promise<Asset> => {
    const component = MOCK_ASSETS.find(a => a.id === componentId);
    const parent = MOCK_ASSETS.find(a => a.id === parentId);

    if (!component || !parent) {
        throw new Error("Component or parent asset not found");
    }

    component.parentId = parentId;
    component.status = 'In Use';
    
    // The component list on the parent is calculated on the fly in getAssetById, so this is sufficient.

    return simulateApiCall(component);
};

export const unassignComponent = (componentId: string): Promise<Asset> => {
    const component = MOCK_ASSETS.find(a => a.id === componentId);

    if (!component) {
        throw new Error("Component asset not found");
    }

    component.parentId = null;
    component.status = 'In Storage';

    return simulateApiCall(component);
};

// --- Consumables ---
export const getConsumables = () => simulateApiCall(MOCK_CONSUMABLES);

export const logConsumableUsage = (id: string, change: number, reason: string, userId: string): Promise<Consumable> => {
    const item = MOCK_CONSUMABLES.find(c => c.id === id);
    if (!item) throw new Error('Consumable not found');

    item.quantity += change;
    if (!item.usageHistory) item.usageHistory = [];
    
    const user = MOCK_PERSONNEL.find(p => p.id === userId);
    
    const logEntry: ConsumableUsageLog = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString(),
        change,
        reason,
        userId,
        userName: user?.name || 'System'
    };
    item.usageHistory.unshift(logEntry);
    
    return simulateApiCall(item);
};

export const createConsumable = (data: Omit<Consumable, 'id' | 'usageHistory'>): Promise<Consumable> => {
    const newConsumable: Consumable = {
        ...data,
        id: `con-${Date.now()}`,
        usageHistory: []
    };
    MOCK_CONSUMABLES.push(newConsumable);
    return simulateApiCall(newConsumable);
}

export const updateConsumable = (id: string, data: Partial<Omit<Consumable, 'id' | 'quantity'>>): Promise<Consumable> => {
    const index = MOCK_CONSUMABLES.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Consumable not found');
    MOCK_CONSUMABLES[index] = { ...MOCK_CONSUMABLES[index], ...data };
    return simulateApiCall(MOCK_CONSUMABLES[index]);
}

export const deleteConsumable = (id: string): Promise<void> => {
    const index = MOCK_CONSUMABLES.findIndex(c => c.id === id);
    if (index > -1) {
        MOCK_CONSUMABLES.splice(index, 1);
    }
    return simulateApiCall(undefined);
};

export const getIncidentRestockReport = () => {
    const usage: Record<string, number> = {};
    MOCK_INCIDENTS.forEach(inc => {
        if (inc.suppliesUsed) {
            inc.suppliesUsed.forEach(supply => {
                usage[supply.consumableId] = (usage[supply.consumableId] || 0) + supply.quantity;
            });
        }
    });

    const report = Object.entries(usage).map(([id, quantityUsed]) => {
        const consumable = MOCK_CONSUMABLES.find(c => c.id === id);
        return {
            id,
            name: consumable?.name || 'Unknown Item',
            category: consumable?.category || 'Unknown',
            quantityUsed
        };
    });

    return simulateApiCall(report);
};
export const getTrainingCourses = () => simulateApiCall(MOCK_TRAINING_COURSES);
export const createTrainingCourse = (data) => {
    const newCourse = { ...data, id: `tc-${Date.now()}` };
    MOCK_TRAINING_COURSES.push(newCourse);
    return simulateApiCall(newCourse);
};
export const updateTrainingCourse = (id, data) => {
    const index = MOCK_TRAINING_COURSES.findIndex(c => c.id === id);
    if (index !== -1) MOCK_TRAINING_COURSES[index] = { ...MOCK_TRAINING_COURSES[index], ...data };
    return simulateApiCall(MOCK_TRAINING_COURSES[index]);
};
export const deleteTrainingCourse = (id) => {
    const index = MOCK_TRAINING_COURSES.findIndex(c => c.id === id);
    if (index > -1) {
        MOCK_TRAINING_COURSES.splice(index, 1);
    }
    return simulateApiCall(null);
};
export const getScheduledTrainings = () => simulateApiCall(MOCK_SCHEDULED_TRAININGS);
export const logTrainingAttendance = (id, attendeeIds) => {
    const training = MOCK_SCHEDULED_TRAININGS.find(t => t.id === id);
    if (!training) throw new Error("Training not found");

    training.attendeeIds = attendeeIds;
    const course = MOCK_TRAINING_COURSES.find(c => c.id === training.courseId);
    
    attendeeIds.forEach(personnelId => {
        const person = MOCK_PERSONNEL.find(p => p.id === personnelId);
        if (person && course) {
            // Avoid adding duplicate records
            const existingRecord = person.trainingHistory.find(h => h.courseId === course.id && h.completedDate === training.date.split('T')[0]);
            if (!existingRecord) {
                person.trainingHistory.push({
                    courseId: course.id,
                    courseName: course.name,
                    completedDate: training.date.split('T')[0],
                });
            }
        }
    });

    return simulateApiCall(training);
};
export const getFolders = (id) => simulateApiCall(MOCK_FOLDERS.filter(f => f.parentId === id));
export const getDocuments = (id) => simulateApiCall(MOCK_DOCUMENTS.filter(d => d.folderId === id));
export const getFolderBreadcrumbs = (id) => {
    if (!id) return simulateApiCall([]);
    const breadcrumbs: Folder[] = [];
    let currentId: string | null = id;
    while(currentId) {
        const folder = MOCK_FOLDERS.find(f => f.id === currentId);
        if (folder) {
            breadcrumbs.unshift(folder);
            currentId = folder.parentId;
        } else {
            currentId = null;
        }
    }
    return simulateApiCall(breadcrumbs);
};
export const createFolder = (data) => {
    const newFolder: Folder = { ...data, id: `f-${Date.now()}` };
    MOCK_FOLDERS.push(newFolder);
    return simulateApiCall(newFolder);
};
export const createDocument = (data) => {
    const newDoc: Document = { ...data, id: `d-${Date.now()}`, version: 1, modifiedAt: new Date().toISOString() };
    MOCK_DOCUMENTS.push(newDoc);
    return simulateApiCall(newDoc);
};
export const deleteFolder = (id) => {
    const index = MOCK_FOLDERS.findIndex(f => f.id === id);
    if (index > -1) {
        MOCK_FOLDERS.splice(index, 1);
    }
    return simulateApiCall(null);
};
export const deleteDocument = (id) => {
    const index = MOCK_DOCUMENTS.findIndex(d => d.id === id);
    if (index > -1) {
        MOCK_DOCUMENTS.splice(index, 1);
    }
    return simulateApiCall(null);
};
export const getGisMapItems = () => {
    const items = [
        ...MOCK_PROPERTIES.map(p => ({ type: 'property', data: p })),
        ...MOCK_GIS_HYDRANTS.map(h => ({ type: 'hydrant', data: h })),
        ...MOCK_INCIDENTS.filter(i => i.status === 'Open').map(i => ({ type: 'incident', data: i})),
        ...MOCK_APPARATUS.map(a => ({ type: 'apparatus', data: a })),
    ].filter(item => item.data.location); // Ensure item has a location
    return simulateApiCall(items);
};
export const getEvents = () => simulateApiCall(MOCK_EVENTS);
export const createEvent = (data) => {
    const newEvent: Event = { ...data, id: `e-${Date.now()}` };
    MOCK_EVENTS.push(newEvent);
    return simulateApiCall(newEvent);
};
export const getShifts = () => simulateApiCall(MOCK_SHIFTS);
export const createShift = (data) => {
    const personnel = MOCK_PERSONNEL.find(p => p.id === data.personnelId);
    const newShift: Shift = { ...data, id: `shift-${Date.now()}`, personnelName: personnel?.name || 'Unknown' };
    MOCK_SHIFTS.push(newShift);
    return simulateApiCall(newShift);
};
export const getBudgetData = () => {
    const totalBudget = MOCK_BUDGET.lineItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const totalSpent = MOCK_BUDGET.lineItems.reduce((sum, item) => sum + item.actualAmount, 0);
    const budgetData = { ...MOCK_BUDGET, totalBudget, totalSpent };
    return simulateApiCall(budgetData);
};
export const updateLineItem = (id, data) => {
    const item = MOCK_BUDGET.lineItems.find(i => i.id === id);
    if(item) {
        item.category = data.category;
        item.budgetedAmount = data.budgetedAmount;
    }
    return simulateApiCall(item);
};
export const addLineItemToBudget = (data) => {
    const newItem: LineItem = { ...data, id: `li-${Date.now()}`, actualAmount: 0 };
    MOCK_BUDGET.lineItems.push(newItem);
    return simulateApiCall(newItem);
};
export const deleteLineItem = (id) => {
    MOCK_BUDGET.lineItems = MOCK_BUDGET.lineItems.filter(i => i.id !== id);
    return simulateApiCall(null);
};
export const getExposureLogs = async (personnelId: string, role: Role) => {
    const allLogs = await simulateApiCall(MOCK_EXPOSURE_LOGS);
    const personnel = await getPersonnelList();
    
    let filteredLogs = role === Role.FIREFIGHTER ? allLogs.filter(log => log.personnelId === personnelId) : allLogs;

    return filteredLogs.map(log => ({
        ...log,
        personnelName: personnel.find(p => p.id === log.personnelId)?.name || 'Unknown'
    }));
};
export const createExposureLog = (data) => {
    const newLog: ExposureLog = { ...data, id: `exp-${Date.now()}`};
    MOCK_EXPOSURE_LOGS.push(newLog);
    return simulateApiCall(newLog);
};
export const getSdsSheets = (term) => {
    let results = [...MOCK_SDS_SHEETS];
    if (term) {
        const lowerTerm = term.toLowerCase();
        results = results.filter(s => s.productName.toLowerCase().includes(lowerTerm) || s.manufacturer.toLowerCase().includes(lowerTerm));
    }
    return simulateApiCall(results);
};
export const createSdsSheet = (data) => {
    const newSheet: SdsSheet = { ...data, id: `sds-${Date.now()}`, uploadedAt: new Date().toISOString() };
    MOCK_SDS_SHEETS.push(newSheet);
    return simulateApiCall(newSheet);
};
export const getHydrants = () => simulateApiCall(MOCK_GIS_HYDRANTS);
export const createHydrantInspection = (data: Omit<HydrantInspection, 'id'>) => {
    const hydrant = MOCK_GIS_HYDRANTS.find(h => h.id === data.hydrantId);
    if (!hydrant) throw new Error("Hydrant not found");

    const newInspection: HydrantInspection = { ...data, id: `insp-${Date.now()}` };
    hydrant.inspections.unshift(newInspection); // Add to beginning
    hydrant.lastInspectionDate = newInspection.date;
    
    // Simple logic to update status based on notes
    if (data.notes.toLowerCase().includes('hard') || data.notes.toLowerCase().includes('leak')) {
        hydrant.status = 'Needs Maintenance';
    } else {
        hydrant.status = 'In Service';
    }
    return simulateApiCall(newInspection);
};
export const getProperties = async () => {
    const properties = await simulateApiCall(MOCK_PROPERTIES);
    const owners = await simulateApiCall(MOCK_OWNERS);
    return properties.map(prop => ({
        ...prop,
        ownerNames: prop.ownerIds.map(id => owners.find(o => o.id === id)?.name || 'Unknown').join(', ')
    }));
};
export const importProperties = (data) => {
    const newProperty: Property = {
        id: 'prop-new', parcelId: '123-456-789', address: '101 New Import Rd', ownerIds: ['o-002'], location: { lat: 55, lng: 45 }, pipId: null
    };
    MOCK_PROPERTIES.push(newProperty);
    return simulateApiCall(newProperty);
};
export const getOwners = () => simulateApiCall(MOCK_OWNERS);
export const getPropertyById = (id) => simulateApiCall(MOCK_PROPERTIES.find(p => p.id === id) || null);
export const getPIPByPropertyId = (id) => simulateApiCall(MOCK_PRE_INCIDENT_PLANS.find(p => p.propertyId === id) || null);
export const createPIPForProperty = (id) => {
    const newPip: PreIncidentPlan = {
        id: `pip-${Date.now()}`,
        propertyId: id,
        buildingInfo: '', accessPoints: '', hazards: '', utilityShutoffs: '', contacts: ''
    };
    MOCK_PRE_INCIDENT_PLANS.push(newPip);
    const prop = MOCK_PROPERTIES.find(p => p.id === id);
    if (prop) prop.pipId = newPip.id;
    return simulateApiCall(newPip);
};
export const updatePIP = (id, data) => {
    const index = MOCK_PRE_INCIDENT_PLANS.findIndex(p => p.id === id);
    if (index !== -1) MOCK_PRE_INCIDENT_PLANS[index] = { ...MOCK_PRE_INCIDENT_PLANS[index], ...data };
    return simulateApiCall(MOCK_PRE_INCIDENT_PLANS[index]);
};
export const setAnnualFireDue = (amount: number, year: number) => {
    let updatedCount = 0;
    MOCK_PROPERTIES.forEach(prop => {
        const existingDue = MOCK_FIRE_DUES.find(d => d.propertyId === prop.id && d.year === year);
        if (!existingDue) {
            const newDue: FireDue = {
                id: `fd-${Date.now()}-${prop.id}`,
                propertyId: prop.id,
                year: year,
                amount: amount,
                status: FireDueStatus.UNPAID,
                dueDate: `${year}-03-31`
            };
            MOCK_FIRE_DUES.push(newDue);
            updatedCount++;
        }
    });
    return simulateApiCall({ updatedCount });
};
export const getBillingRates = () => simulateApiCall(MOCK_BILLING_RATES);
export const updateBillingRates = (rates) => {
    MOCK_BILLING_RATES.length = 0;
    MOCK_BILLING_RATES.push(...rates);
    return simulateApiCall(rates);
};
export const getBillableIncidents = () => simulateApiCall(MOCK_INCIDENTS.filter(i => ['MVA', 'HazMat'].includes(i.type) && !MOCK_INVOICES.some(inv => inv.incidentId === i.id)));
export const getInvoices = () => simulateApiCall(MOCK_INVOICES);
export const generateInvoiceForIncident = (id) => {
    const incident = MOCK_INCIDENTS.find(i => i.id === id);
    if (!incident) throw new Error("Incident not found");

    const personnelRate = MOCK_BILLING_RATES.find(r => r.item === 'Personnel')?.rate || 50;
    const engineRate = MOCK_BILLING_RATES.find(r => r.item === 'Engine')?.rate || 200;
    
    const lineItems: InvoiceLineItem[] = [];
    let totalAmount = 0;
    
    // Mock 2 hours of personnel time
    const personnelTime = 2;
    const personnelCost = incident.respondingPersonnelIds.length * personnelRate * personnelTime;
    lineItems.push({ description: 'Personnel Response', quantity: incident.respondingPersonnelIds.length * personnelTime, rate: personnelRate, total: personnelCost });
    totalAmount += personnelCost;
    
    // Mock 2 hours of apparatus time
    const apparatusTime = 2;
    const apparatusCost = incident.respondingApparatusIds.length * engineRate * apparatusTime;
    lineItems.push({ description: 'Apparatus Response', quantity: incident.respondingApparatusIds.length * apparatusTime, rate: engineRate, total: apparatusCost });
    totalAmount += apparatusCost;

    const newInvoice: Invoice = {
        id: `inv-${incident.incidentNumber}`,
        incidentId: incident.id,
        incidentNumber: incident.incidentNumber,
        propertyId: 'prop-unknown', // This would need to be linked properly
        propertyAddress: incident.address,
        date: new Date().toISOString(),
        lineItems,
        totalAmount,
        status: 'Draft'
    };
    MOCK_INVOICES.push(newInvoice);
    return simulateApiCall(newInvoice);
};

export const getRepairTickets = () => simulateApiCall(MOCK_REPAIR_TICKETS);
export const getApplicants = () => simulateApiCall(MOCK_APPLICANTS);
export const updateApplicantStatus = (applicantId: string, status: ApplicantStatus): Promise<Applicant> => {
    const applicant = MOCK_APPLICANTS.find(a => a.id === applicantId);
    if (!applicant) throw new Error("Applicant not found");
    applicant.status = status;
    return simulateApiCall(applicant);
};

export const promoteApplicantToPersonnel = (applicantId: string): Promise<Personnel> => {
    const applicantIndex = MOCK_APPLICANTS.findIndex(a => a.id === applicantId);
    if (applicantIndex === -1) throw new Error("Applicant not found");

    const applicant = MOCK_APPLICANTS[applicantIndex];
    const newPersonnel: Personnel = {
        id: `p-${Date.now()}`,
        nfirsId: `NF-${Math.floor(Math.random() * 900) + 100}`,
        badgeNumber: `B-${new Date().getFullYear() + 1}`,
        name: applicant.name,
        rank: 'Probation',
        status: 'Probation',
        phoneNumbers: [{ type: 'Mobile', number: applicant.phone }],
        emails: [{ type: 'Work', address: applicant.email }],
        username: applicant.name.split(' ')[0].toLowerCase(),
        role: Role.FIREFIGHTER,
        avatarUrl: `https://picsum.photos/seed/${applicant.name}/100/100`,
        certifications: [],
        emergencyContacts: [],
        trainingHistory: [],
        hireDate: new Date().toISOString(),
    };
    MOCK_PERSONNEL.push(newPersonnel);
    MOCK_APPLICANTS.splice(applicantIndex, 1);
    return simulateApiCall(newPersonnel);
};

export const getChecklistTemplates = () => simulateApiCall(MOCK_CHECKLIST_TEMPLATES);
export const updateRepairTicket = (id: string, data: Partial<RepairTicket>) => {
    const ticket = MOCK_REPAIR_TICKETS.find(t => t.id === id);
    if (!ticket) throw new Error('Ticket not found');
    Object.assign(ticket, data);
    return simulateApiCall(ticket);
}
export const deleteRepairTicket = (id: string) => {
    const index = MOCK_REPAIR_TICKETS.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Ticket not found');
    MOCK_REPAIR_TICKETS.splice(index, 1);
    return simulateApiCall(undefined);
}
export const getPublicEvents = () => simulateApiCall(MOCK_EVENTS.filter(e => e.category === EventCategory.PUBLIC_EVENT));
export const getAboutUsContent = () => simulateApiCall(MOCK_ABOUT_US_CONTENT);
export const getLeadershipTeam = () => {
    const leaders = MOCK_PERSONNEL.filter(p => [Role.CHIEF, Role.ADMINISTRATOR].includes(p.role) || ['Captain', 'Lieutenant'].includes(p.rank));
    const leadershipTeam: LeadershipMember[] = leaders.map(l => ({
        id: l.id,
        name: l.name,
        rank: l.rank,
        avatarUrl: l.avatarUrl,
        bio: `A dedicated member of the Anytown Fire Department serving as ${l.rank}.`
    }));
    return simulateApiCall(leadershipTeam);
}

export const getPhotoAlbums = () => simulateApiCall(MOCK_PHOTO_ALBUMS);
export const getAlbumWithPhotos = (albumId: string) => {
    const album = MOCK_PHOTO_ALBUMS.find(a => a.id === albumId);
    if (!album) return simulateApiCall(null);
    const photos = MOCK_PHOTOS.filter(p => p.albumId === albumId);
    return simulateApiCall({ album, photos });
}
export const createPhotoAlbum = (data: Omit<PhotoAlbum, 'id'|'coverPhotoUrl'>) => {
    const newAlbum: PhotoAlbum = { ...data, id: `album-${Date.now()}`, coverPhotoUrl: 'https://picsum.photos/seed/new-album/600/400' };
    MOCK_PHOTO_ALBUMS.push(newAlbum);
    return simulateApiCall(newAlbum);
}
export const uploadPhoto = (albumId: string, caption: string) => {
    const newPhoto: Photo = {
        id: `photo-${Date.now()}`,
        albumId,
        caption,
        url: `https://picsum.photos/seed/${Date.now()}/1024/768`,
        dateTaken: new Date().toISOString()
    };
    MOCK_PHOTOS.push(newPhoto);
    return simulateApiCall(newPhoto);
}
export const getRecordsRequests = () => simulateApiCall(MOCK_RECORDS_REQUESTS);
export const createRecordsRequest = (data: Omit<RecordsRequest, 'id'|'status'|'submittedAt'>) => {
    const newRequest: RecordsRequest = { ...data, id: `rr-${Date.now()}`, status: RecordsRequestStatus.PENDING, submittedAt: new Date().toISOString() };
    MOCK_RECORDS_REQUESTS.push(newRequest);
    return simulateApiCall(newRequest);
}
export const updateRecordsRequestStatus = (id: string, status: RecordsRequestStatus) => {
    const request = MOCK_RECORDS_REQUESTS.find(r => r.id === id);
    if (!request) throw new Error('Request not found');
    request.status = status;
    return simulateApiCall(request);
}

export const getAnalyticsData = () => {
    const incidentsByMonth = MOCK_INCIDENTS.reduce((acc, inc) => {
        const month = new Date(inc.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const trainingCompliance = MOCK_PERSONNEL.reduce((acc, p) => {
        const hasEvoc = p.trainingHistory.some(t => t.courseId === 'tc-3');
        if (hasEvoc) acc.compliant++; else acc.nonCompliant++;
        return acc;
    }, { compliant: 0, nonCompliant: 0});

    const analytics = {
        incidentsByMonth: Object.entries(incidentsByMonth).map(([name, count]) => ({name, count})),
        trainingCompliance: [
            {name: 'Compliant', value: trainingCompliance.compliant},
            {name: 'Non-Compliant', value: trainingCompliance.nonCompliant}
        ],
        budgetPerformance: MOCK_BUDGET.lineItems.map(i => ({name: i.category, budgeted: i.budgetedAmount, spent: i.actualAmount}))
    };
    return simulateApiCall(analytics);
}

export const getAuditLogs = (filters: {userId?: string, date?: string, target?: string, targetId?: string}) => {
    let logs = MOCK_AUDIT_LOGS;
    if (filters.userId && filters.userId !== 'all') {
        logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters.date) {
        logs = logs.filter(l => l.timestamp.startsWith(filters.date!));
    }
    if (filters.target) {
        logs = logs.filter(l => l.target === filters.target);
    }
    if (filters.targetId) {
        logs = logs.filter(l => l.targetId === filters.targetId);
    }
    return simulateApiCall(logs);
};

export const getInternalMessages = () => simulateApiCall(MOCK_INTERNAL_MESSAGES.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
export const createInternalMessage = (authorId: string, content: string) => {
    const author = MOCK_PERSONNEL.find(p => p.id === authorId);
    if (!author) throw new Error('Author not found');
    const newMessage: InternalMessage = {
        id: `im-${Date.now()}`,
        authorId,
        authorName: author.name,
        authorAvatar: author.avatarUrl,
        content,
        timestamp: new Date().toISOString(),
    };
    MOCK_INTERNAL_MESSAGES.unshift(newMessage);
    return simulateApiCall(newMessage);
}

export const sendMassNotification = (data: any) => {
    // This is a mock. In a real app, it would connect to an email/SMS service.
    console.log("Sending mass notification:", data);
    return simulateApiCall({ success: true, recipients: 5 }); // Mock response
}

export const getCitizenDetails = (id: string) => simulateApiCall(MOCK_CITIZENS.find(c => c.id === id) || null);
export const updateCitizenDetails = (id: string, data: Partial<Citizen>) => {
    const citizen = MOCK_CITIZENS.find(c => c.id === id);
    if (!citizen) throw new Error("Citizen not found");
    Object.assign(citizen, data);
    return simulateApiCall(citizen);
}
export const addPhoneNumber = (id, phone: {number: string, type: 'Mobile'|'Home'|'Work'}) => {
    const citizen = MOCK_CITIZENS.find(c => c.id === id);
    if (!citizen) throw new Error("Citizen not found");
    if (!citizen.phoneNumbers) citizen.phoneNumbers = [];
    citizen.phoneNumbers.push(phone);
    return simulateApiCall(citizen);
}
export const deletePhoneNumber = (id: string, number: string) => {
    const citizen = MOCK_CITIZENS.find(c => c.id === id);
    if (citizen && citizen.phoneNumbers) {
        citizen.phoneNumbers = citizen.phoneNumbers.filter(p => p.number !== number);
    }
    return simulateApiCall(citizen);
}
export const updateNotificationPreferences = (id: string, prefs: Record<string, boolean>) => {
     const citizen = MOCK_CITIZENS.find(c => c.id === id);
    if (citizen) {
        citizen.notificationPreferences = prefs;
    }
    return simulateApiCall(citizen);
}

export const getSecurityRoles = () => simulateApiCall(MOCK_SECURITY_ROLES);
export const updateSecurityRole = (roleData: SecurityRole) => {
    if (roleData.id) {
        const index = MOCK_SECURITY_ROLES.findIndex(r => r.id === roleData.id);
        if (index !== -1) MOCK_SECURITY_ROLES[index] = roleData;
    } else {
        const newRole = { ...roleData, id: `role-${Date.now()}` };
        MOCK_SECURITY_ROLES.push(newRole);
    }
    return simulateApiCall(roleData);
}

export const getConfiguration = () => simulateApiCall(MOCK_CONFIGURATION);
export const updateConfiguration = (config: SystemConfiguration) => {
    MOCK_CONFIGURATION.incidentTypes = config.incidentTypes;
    MOCK_CONFIGURATION.budgetCategories = config.budgetCategories;
    MOCK_CONFIGURATION.optionalFields = config.optionalFields;
    return simulateApiCall(MOCK_CONFIGURATION);
};
export const getDepartmentInfo = () => simulateApiCall(MOCK_DEPARTMENT_INFO);
export const updateDepartmentInfo = (info: DepartmentInfo) => {
    Object.assign(MOCK_DEPARTMENT_INFO, info);
    return simulateApiCall(MOCK_DEPARTMENT_INFO);
}
export const generateAssetNotifications = () => {
    const lowStockItems = MOCK_CONSUMABLES.filter(c => c.quantity <= c.reorderLevel);
    lowStockItems.forEach(item => {
        const existingNotif = MOCK_NOTIFICATIONS.find(n => n.message.includes(item.name));
        if (!existingNotif) {
             MOCK_NOTIFICATIONS.unshift({ id: `notif-${Date.now()}`, type: 'warning', message: `${item.name} are below reorder level.`, link: '/app/inventory', timestamp: new Date().toISOString(), read: false });
        }
    });
    return simulateApiCall(undefined);
}
export const getNotifications = () => simulateApiCall(MOCK_NOTIFICATIONS.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
export const markNotificationsAsRead = () => {
    MOCK_NOTIFICATIONS.forEach(n => n.read = true);
    return simulateApiCall(MOCK_NOTIFICATIONS);
}
export const createEmptyNfirsShellFrom = (incident: NfirsIncident): NfirsIncident => {
    return {
        ...incident,
        fireModule: null,
        structureFireModule: null,
        emsModule: null,
        wildlandFireModule: null,
        hazmatModule: null,
        arsonModule: null,
    };
};
export const createEmptyModule = (type: string, sectionA?: NfirsModuleSectionA): NfirsFireModule | NfirsStructureFireModule | NfirsEmsModule | NfirsWildlandFireModule | NfirsHazmatModule | NfirsArsonModule => {
    const baseSectionA = sectionA || { fdid: '', incidentDate: '', incidentNumber: '', exposureNumber: '', station: '' };

    if (type === 'Fire') {
        return {
            sectionA: baseSectionA,
            propertyDetails: { residentialUnits: 0, buildingsInvolved: 0, acresBurned: 0 },
            onSiteMaterials: {},
            ignition: { areaOfOrigin: '', heatSource: '', itemFirstIgnited: '', materialFirstIgnited: '' },
            causeOfIgnition: { cause: '', humanFactors: [] },
            equipmentInvolved: {},
            fireSuppressionFactors: [],
            mobileProperty: {},
        };
    }
    if (type === 'Structure') {
        return {
            sectionA: baseSectionA,
            structureType: '',
            buildingStatus: '',
            buildingHeight: 0,
            mainFloorSize: 0,
            fireOrigin: '',
            fireSpread: '',
            storiesDamaged: 0,
            itemContributingSpread: '',
            materialContributingSpread: '',
            detectors: { presence: '' },
            extinguishingSystem: { presence: '' }
        };
    }
    if (type === 'EMS') {
        return {
            sectionA: baseSectionA,
            patientCount: 0,
            patientNumber: 0,
            arrivedAtPatientDateTime: '',
            patientTransferDateTime: '',
            providerImpression: '',
            humanFactors: [],
            otherFactors: [],
            bodySiteOfInjury: '',
            injuryType: '',
            causeOfIllnessInjury: '',
            proceduresUsed: [],
            safetyEquipment: '',
            cardiacArrest: { when: '', initialRhythm: '' },
            providerLevel: { initial: '', highestOnScene: '' },
            patientStatus: '',
            emsDisposition: '',
        };
    }
    if (type === 'Hazmat') {
        return {
            sectionA: baseSectionA,
            hazmatNumber: '',
            actionsTaken: [],
            releaseIgnitionSequence: '',
            causeOfRelease: '',
            factorsContributing: [],
            factorsAffectingMitigation: [],
            equipmentInvolved: {},
            mobileProperty: {},
            disposition: '',
            civilianCasualties: 0,
        };
    }
    if (type === 'Wildland') {
        return {
            sectionA: baseSectionA,
            weatherInfo: { windDirection: 'N', windSpeed: 0, temperature: 0, fuelMoisture: 0, dangerRating: '' },
            ignitedBuildings: 0,
            threatenedBuildings: 0,
        };
    }
    if (type === 'Arson') {
        return {
            sectionA: baseSectionA,
            agencyReferredTo: '',
            caseStatus: '',
            availabilityOfMaterial: '',
            motivationFactors: [],
            groupInvolvement: '',
            entryMethod: '',
            fireInvolvementOnArrival: '',
            incendiaryDevices: {},
            otherInvestigativeInfo: [],
            propertyOwnership: '',
            initialObservations: [],
        };
    }
    throw new Error(`Unknown module type: ${type}`);
};
export const getPrebuiltReports = (): Promise<PrebuiltReport[]> => {
    return simulateApiCall(MOCK_PREBUILT_REPORTS);
};
export const getReportData = (reportId: string) => {
    if (reportId === 'rep-1') {
        const data = MOCK_INCIDENTS.map(i => ({ Month: new Date(i.date).getMonth() + 1, Type: i.type, Status: i.status }));
        return simulateApiCall({ data, columns: [{header: 'Month'}, {header: 'Type'}, {header: 'Status'}] });
    }
    return simulateApiCall({ data: [], columns: [] });
};
export const generateCustomReport = (config: CustomReportConfig) => {
    let sourceData: any[] = [];
    switch (config.dataSource) {
        case 'incidents': sourceData = MOCK_INCIDENTS; break;
        case 'personnel': sourceData = MOCK_PERSONNEL; break;
        case 'apparatus': sourceData = MOCK_APPARATUS; break;
        case 'assets': sourceData = MOCK_ASSETS; break;
    }
    // Very basic filter logic for mock
    let filteredData = sourceData;
    config.filters.forEach(filter => {
        filteredData = filteredData.filter(item => String(item[filter.field]).toLowerCase().includes(filter.value.toLowerCase()));
    });
    const data = filteredData.map(item => {
        const row = {};
        config.fields.forEach(field => {
            row[field] = item[field];
        });
        return row;
    });
    const columns = config.fields.map(field => ({ header: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }));
    return simulateApiCall({ data, columns });
};
export const createChecklistTemplate = (data: any) => {
    const newTemplate = { ...data, id: `ct-${Date.now()}`, items: data.items.map((item, i) => ({...item, id: `ci-${Date.now()}-${i}`})) };
    MOCK_CHECKLIST_TEMPLATES.push(newTemplate);
    return simulateApiCall(newTemplate);
};
export const updateChecklistTemplate = (id: string, data: any) => {
    const index = MOCK_CHECKLIST_TEMPLATES.findIndex(t => t.id === id);
    if(index === -1) throw new Error("Template not found");
    const updatedTemplate = { ...MOCK_CHECKLIST_TEMPLATES[index], ...data };
    MOCK_CHECKLIST_TEMPLATES[index] = updatedTemplate;
    return simulateApiCall(updatedTemplate);
};
export const deleteChecklistTemplate = (id: string) => {
    const index = MOCK_CHECKLIST_TEMPLATES.findIndex(t => t.id === id);
    if(index > -1) MOCK_CHECKLIST_TEMPLATES.splice(index, 1);
    return simulateApiCall(undefined);
};
export const swapAssetComponent = (spareId: string, oldComponentId: string, parentId: string) => {
    const spare = MOCK_ASSETS.find(a => a.id === spareId);
    const oldComponent = MOCK_ASSETS.find(a => a.id === oldComponentId);
    if (!spare || !oldComponent) throw new Error('Component not found');
    
    spare.parentId = parentId;
    spare.status = 'In Use';

    oldComponent.parentId = null;
    oldComponent.status = 'In Storage';

    return simulateApiCall(undefined);
};
export const updateAssetDocumentSummary = (assetId, docId, summary) => {
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (asset?.documents) {
        const doc = asset.documents.find(d => d.id === docId);
        if (doc) doc.summary = summary;
    }
    return simulateApiCall(asset);
};
export const uploadAssetPhoto = (assetId: string, file: File) => {
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (!asset) throw new Error("Asset not found");
    if (!asset.photos) asset.photos = [];
    const newPhoto: AssetPhoto = { id: `photo-${Date.now()}`, url: URL.createObjectURL(file), caption: file.name };
    asset.photos.push(newPhoto);
    return simulateApiCall(asset);
};
export const uploadAssetDocument = (assetId: string, file: File) => {
     const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (!asset) throw new Error("Asset not found");
    if (!asset.documents) asset.documents = [];
    const newDoc: AssetDocument = { id: `doc-${Date.now()}`, url: URL.createObjectURL(file), name: file.name, mockContent: 'Sample document content for summarization.' };
    asset.documents.push(newDoc);
    return simulateApiCall(asset);
};
export const deleteAssetPhoto = (assetId: string, photoId: string) => {
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (asset?.photos) {
        asset.photos = asset.photos.filter(p => p.id !== photoId);
    }
    return simulateApiCall(asset);
};
export const deleteAssetDocument = (assetId: string, docId: string) => {
     const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (asset?.documents) {
        asset.documents = asset.documents.filter(d => d.id !== docId);
    }
    return simulateApiCall(asset);
};
export const getAssetDashboardData = () => {
    const statusCounts = MOCK_ASSETS.reduce((acc, asset) => {
        if (!asset.parentId) {
            const status = asset.status;
            const existing = acc.find(item => item.name === status);
            if (existing) {
                existing.value++;
            } else {
                acc.push({ name: status, value: 1 });
            }
        }
        return acc;
    }, [] as { name: string, value: number }[]);
    const categoryCounts = MOCK_ASSETS.reduce((acc, asset) => {
         if (!asset.parentId) {
            const cat = asset.category;
            const existing = acc.find(item => item.name === cat);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ name: cat, count: 1 });
            }
        }
        return acc;
    }, [] as { name: string, count: number }[]);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const upcomingPms = MOCK_ASSETS.flatMap(asset => 
        asset.pmSchedules
        .filter(pm => new Date(pm.nextDueDate) <= ninetyDaysFromNow)
        .map(pm => ({...pm, assetName: asset.name, assetSerial: asset.serialNumber}))
    ).map(pm => ({id: pm.id, Task: pm.taskDescription, "Asset Name": pm.assetName, "Asset S/N": pm.assetSerial, "Due Date": new Date(pm.nextDueDate).toLocaleDateString()}));
    
    return simulateApiCall({ statusCounts, categoryCounts, upcomingPms });
};
export const getAssetViews = () => simulateApiCall(MOCK_SAVED_ASSET_VIEWS);
export const saveAssetView = (view: Omit<SavedAssetView, 'id'>) => {
    const newView = { ...view, id: `view-${Date.now()}`};
    MOCK_SAVED_ASSET_VIEWS.push(newView);
    return simulateApiCall(newView);
};
export const checkoutAssetToPersonnel = (assetId, personnelId, user) => {
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    const person = MOCK_PERSONNEL.find(p => p.id === personnelId);
    if (!asset || !person) throw new Error('Asset or personnel not found');
    asset.assignedToId = personnelId;
    asset.assignedToType = 'Personnel';
    asset.status = 'In Use';
    logAuditEvent(user.id, 'ASSET_TRANSFER', 'Asset', assetId, { assetName: asset.name, from: 'Storage', to: person.name });
    return simulateApiCall(asset);
};
export const checkinAsset = (assetId, user) => {
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (!asset) throw new Error('Asset not found');
    const from = asset.assignedToType === 'Personnel' ? MOCK_PERSONNEL.find(p=>p.id === asset.assignedToId)?.name : 'Apparatus';
    asset.assignedToId = null;
    asset.assignedToType = null;
    asset.assignedToName = undefined;
    asset.status = 'In Storage';
    logAuditEvent(user.id, 'ASSET_TRANSFER', 'Asset', assetId, { assetName: asset.name, from: from || 'Unknown', to: 'Storage' });
    return simulateApiCall(asset);
};
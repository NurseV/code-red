

import React from 'react';

export enum Role {
  FIREFIGHTER = 'Firefighter',
  TRAINING_OFFICER = 'Training Officer',
  RESOURCE_OFFICER = 'Resource Officer',
  CHIEF = 'Chief',
  ADMINISTRATOR = 'Administrator',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatarUrl: string;
  username: string;
}

export interface Personnel extends User {
    nfirsId: string;
    badgeNumber: string;
    rank: string;
    status: 'Active' | 'Probation' | 'Inactive';
    assignment?: string;
    phoneNumbers: { type: string, number: string }[];
    emails: { type: string, address: string }[];
    residentialAddress?: string;
    hireDate?: string;
    dateOfBirth?: string;
    ssn?: string;
    gender?: string;
    citizenship?: string;
    certifications: Certification[];
    emergencyContacts: EmergencyContact[];
    trainingHistory: TrainingRecord[];
    awards?: Award[];
    positions?: string[];
    active911Code?: string;
    spouse?: { name: string, phone: string };
    payrollId?: string;
    hasExpiringCerts?: boolean;
    notes?: string;
}

export interface EmergencyContact {
    id: string;
    name: string;
    relationship: string;
    phone: string;
}

export interface Certification {
    id: string;
    name: string;
    expires: string;
    documentUrl?: string;
}

export interface Award {
    id: string;
    name: string;
    dateReceived: string;
    description: string;
}

export interface TrainingRecord {
    courseId: string;
    courseName: string;
    completedDate: string;
    expiresDate?: string;
    documentUrl?: string;
}

export enum ApparatusStatus {
    IN_SERVICE = 'In Service',
    OUT_OF_SERVICE = 'Out of Service',
    MAINTENANCE = 'Maintenance',
}

export interface VitalsLog {
    id: string;
    date: string;
    mileage: number;
    engineHours: number;
    userId: string;
}

export interface Compartment {
    id: string;
    name: string;
    side: 'driver' | 'passenger' | 'rear';
    level: 'top' | 'bottom';
    size: number; // relative size from 1 to 5
    layout: { rows: number; cols: number };
    subCompartments: SubCompartment[];
}

export interface SubCompartment {
    id: string;
    name: string;
    location: { row: number; col: number; rowSpan?: number; colSpan?: number; };
    assignedAssetIds: string[];
}


export interface Apparatus {
    id: string;
    unitId: string;
    type: 'Engine' | 'Ladder' | 'Rescue' | 'Tanker' | 'Brush Truck';
    status: ApparatusStatus;
    lastCheck: string;
    mileage: number;
    engineHours: number;
    checklistTemplateId: string;
    location: Coordinates;
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    purchaseDate?: string;
    specifications?: {
        pumpCapacityGPM: number;
        waterTankSizeGallons: number;
        foamTankSizeGallons: number;
    },
    serviceDates?: {
        lastAnnualService: string;
        nextAnnualServiceDue: string;
        lastPumpTest: string;
        nextPumpTestDue: string;
    }
    vitalsHistory: VitalsLog[];
    compartments: Compartment[];
}

export interface Incident {
    id: string;
    incidentNumber: string;
    type: string;
    address: string;
    date: string;
    status: 'Open' | 'Closed' | 'Pending Review';
    respondingPersonnelIds: string[];
    respondingApparatusIds: string[];
    narrative?: string;
    location?: Coordinates;
    suppliesUsed?: { consumableId: string, quantity: number }[];
}


// --- NFIRS Types ---
export interface NfirsModuleSectionA {
    fdid: string;
    state?: string;
    incidentDate: string;
    station: string;
    incidentNumber: string;
    exposureNumber: string;
    deleteChangeNoActivity?: string;
}

export interface NfirsSectionKPerson {
    prefix?: string;
    firstName?: string;
    middleInitial?: string;
    lastName?: string;
    suffix?: string;
    name?: string; // Fallback for simple name
    businessName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface NfirsBasicModule {
    sectionA: NfirsModuleSectionA;
    sectionB: {
        locationType: string;
        censusTract: string;
        numberMilepost: string;
        streetPrefix: string;
        streetOrHighwayName: string;
        streetType: string;
        streetSuffix: string;
        apartmentSuiteRoom: string;
        city: string;
        state: string;
        zipCode: string;
        crossStreetDirections: string;
    };
    incidentType: string;
    aidGivenOrReceived: string;
    sectionE: {
        alarmDateTime: string;
        arrivalDateTime: string;
        controlledDateTime: string;
        lastUnitClearedDateTime: string;
        shiftOrPlatoon: string;
        alarms: string;
        district: string;
        specialStudies: string;
    };
    actionsTaken: string[];
    sectionG: {
        apparatusCount: number;
        personnelSuppression: number;
        personnelEms: number;
        personnelOther: number;
        propertyLoss: number;
        contentsLoss: number;
        propertyValue: number;
        contentsValue: number;
        completedModules: string[];
    };
    sectionH: {
        casualtiesFire: number;
        casualtiesCivilian: number;
        detectorPresence: string;
        detectorEffectiveness?: string;
        hazMatReleased: string;
    };
    mixedUseProperty: string;
    propertyUse: string;
    sectionK_personEntity: NfirsSectionKPerson;
    sectionK_owner: NfirsSectionKPerson;
    remarks: string;
    sectionM: {
        officerInCharge: string;
        memberMakingReport: string;
    }
}

export interface NfirsFireModule {
    sectionA: NfirsModuleSectionA;
    propertyDetails: {
        residentialUnits: number;
        buildingsInvolved: number;
        acresBurned: number;
    },
    onSiteMaterials: {},
    ignition: {
        areaOfOrigin: string;
        heatSource: string;
        itemFirstIgnited: string;
        materialFirstIgnited: string;
    },
    causeOfIgnition: {
        cause: string;
        humanFactors?: string[];
    },
    equipmentInvolved: {},
    fireSuppressionFactors: string[],
    mobileProperty: {},
}

export interface NfirsStructureFireModule {
    sectionA: NfirsModuleSectionA;
    structureType: string;
    buildingStatus: string;
    buildingHeight: number;
    mainFloorSize: number;
    fireOrigin: string;
    fireSpread: string;
    storiesDamaged: number;
    itemContributingSpread: string;
    materialContributingSpread: string;
    detectors: {
        presence: string;
        type?: string;
        powerSupply?: string;
        operation?: string;
        effectiveness?: string;
        failureReason?: string;
    },
    extinguishingSystem: {
        presence: string;
        type?: string;
        operation?: string;
        sprinklerHeads?: number;
        failureReason?: string;
    }
}

export interface NfirsEmsModule {
    sectionA: NfirsModuleSectionA;
    patientCount: number;
    patientNumber: number;
    arrivedAtPatientDateTime: string;
    patientTransferDateTime: string;
    providerImpression: string;
    humanFactors: string[];
    otherFactors: string[];
    bodySiteOfInjury: string;
    injuryType: string;
    causeOfIllnessInjury: string;
    proceduresUsed: string[];
    safetyEquipment: string;
    cardiacArrest: {
        when: string;
        initialRhythm: string;
    },
    providerLevel: {
        initial: string;
        highestOnScene: string;
    },
    patientStatus: string;
    emsDisposition: string;
}

export interface NfirsCivilianCasualty {
    id: string;
    sectionA: NfirsModuleSectionA;
    casualtyNumber: number;
    name: string;
    gender: 'M' | 'F' | 'U';
    dob?: string;
    age?: number;
    race: string;
    ethnicity: string;
    affiliation: string;
    injuryDateTime: string;
    severity: string;
    causeOfInjury: string;
    humanFactors: string[];
    contributingFactors: string[];
    activityWhenInjured: string;
    locationAtInjury: {
        general: string;
        specific: string;
        storyAtStart: string;
        storyWhereOccurred: string;
    };
    primarySymptom: string;
    primaryBodyPart: string;
    disposition: string;
    remarks: string;
}

export interface NfirsFireServiceCasualty {
    id: string;
    sectionA: NfirsModuleSectionA;
    personnelId: string;
    casualtyNumber: number;
    gender: 'M' | 'F';
    age: number;
    affiliation: string;
    injuryDateTime: string;
    priorResponses: number;
    usualAssignment: string;
    physicalCondition: string;
    severity: string;
    takenTo: string;
    activityAtInjury: string;
    primarySymptom: string;
    primaryBodyPart: string;
    causeOfInjury: string;
    contributingFactors: string[];
    objectInvolved: string;
    injuryLocation: {
        whereOccurred: string;
        story: string;
        specificLocation: string;
    };
    protectiveEquipment: {
        sequenceNumber: number;
        status?: string;
        item?: string;
        area?: string;
        problem?: string;
    };
}

export interface NfirsHazmatModule {
    sectionA: NfirsModuleSectionA;
    hazmatNumber: string;
    hazmatId?: {
        unNumber?: string;
        chemicalName?: string;
    };
    container?: {
        type?: string;
        capacity?: number;
        units?: string;
    };
    release?: {
        amount?: number;
        units?: string;
    };
    releasedFrom?: string;
    evacuation?: {
        area: string;
        number: number;
    };
    actionsTaken: string[];
    releaseIgnitionSequence: string;
    causeOfRelease: string;
    factorsContributing: string[];
    factorsAffectingMitigation: string[];
    equipmentInvolved: {},
    mobileProperty: {},
    disposition: string;
    civilianCasualties: number;
}

export interface NfirsWildlandFireModule {
    sectionA: NfirsModuleSectionA;
    location?: {};
    areaType?: string;
    wildlandFireCause?: string;
    humanFactors?: string[];
    ignitionFactors?: string[];
    suppressionFactors?: string[];
    heatSource?: string;
    weatherInfo: {
        windDirection: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
        windSpeed: number;
        temperature: number;
        fuelMoisture: number;
        dangerRating: string;
    };
    ignitedBuildings: number;
    threatenedBuildings: number;
    totalAcresBurned?: number;
    propertyManagement?: {};
    personResponsible?: {};
    rightOfWay?: {};
    fireBehavior?: {};
}

export interface NfirsArsonModule {
    sectionA: NfirsModuleSectionA;
    agencyReferredTo: string;
    caseStatus: string;
    availabilityOfMaterial: string;
    motivationFactors: string[];
    groupInvolvement: string;
    entryMethod: string;
    fireInvolvementOnArrival: string;
    incendiaryDevices: {};
    otherInvestigativeInfo: string[];
    propertyOwnership: string;
    initialObservations: string[];
}

export interface Attachment {
    id: string;
    fileName: string;
    fileType: string;
    size: string;
    url: string;
}

export interface NfirsIncident {
    id: string;
    incidentNumber: string;
    type: string;
    address: string;
    date: string;
    status: 'In Progress' | 'Review Needed' | 'Locked';
    respondingPersonnelIds: string[];
    respondingApparatusIds: string[];
    narrative?: string;
    location?: Coordinates;
    suppliesUsed?: { consumableId: string, quantity: number }[];
    lockedBy?: string;
    lockedAt?: string;
    basicModule: NfirsBasicModule;
    fireModule?: NfirsFireModule | null;
    structureFireModule?: NfirsStructureFireModule | null;
    emsModule?: NfirsEmsModule | null;
    wildlandFireModule?: NfirsWildlandFireModule | null;
    hazmatModule?: NfirsHazmatModule | null;
    arsonModule?: NfirsArsonModule | null;
    civilianCasualties?: NfirsCivilianCasualty[];
    fireServiceCasualties?: NfirsFireServiceCasualty[];
    attachments?: Attachment[];
}

export interface ExpiringCertification {
    personnelId: string;
    personnelName: string;
    certificationName: string;
    expires: string;
}

// --- Infrastructure Types ---
export interface Coordinates {
    lat: number;
    lng: number;
}
export interface Owner {
    id: string;
    name: string;
    mailingAddress: string;
    phone: string;
    email: string;
}
export interface Property {
    id: string;
    parcelId: string;
    address: string;
    ownerIds: string[];
    location?: Coordinates;
    pipId: string | null;
}
export interface HydrantInspection {
    id: string;
    hydrantId: string;
    date: string;
    inspectorName: string;
    staticPressure: number;
    residualPressure: number;
    flowGpm: number;
    notes: string;
}
export interface Hydrant {
    id: string;
    location: Coordinates;
    status: 'In Service' | 'Out of Service' | 'Needs Maintenance';
    lastInspectionDate: string;
    inspections: HydrantInspection[];
}
export interface PreIncidentPlan {
    id: string;
    propertyId: string;
    buildingInfo: string;
    accessPoints: string;
    hazards: string;
    utilityShutoffs: string;
    contacts: string;
}

// --- Financial Types ---
export enum FireDueStatus {
    PAID = 'Paid',
    UNPAID = 'Unpaid',
    OVERDUE = 'Overdue',
}
export interface FireDue {
    id: string;
    propertyId: string;
    year: number;
    amount: number;
    status: FireDueStatus;
    dueDate: string;
}
export interface LineItem {
    id: string;
    category: string;
    budgetedAmount: number;
    actualAmount: number;
}
export interface Budget {
    id: string;
    fiscalYear: number;
    totalBudget: number;
    totalSpent: number;
    lineItems: LineItem[];
}
export interface InvoiceLineItem {
    description: string;
    quantity: number;
    rate: number;
    total: number;
}
export interface Invoice {
    id: string;
    incidentId: string;
    incidentNumber: string;
    propertyId: string;
    propertyAddress: string;
    date: string;
    lineItems: InvoiceLineItem[];
    totalAmount: number;
    status: 'Draft' | 'Sent' | 'Paid';
}
export interface BillingRate {
    id: string;
    item: string;
    rate: number;
    unit: 'per_hour' | 'per_incident';
}


// --- Public Portal Types ---
export interface Announcement {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: string;
}
export interface StormShelter {
    id: string;
    propertyId: string;
    ownerName: string;
    address: string;
    locationOnProperty: string;
    contactPhone: string;
    registeredAt: string;
    coordinates?: Coordinates | null;
}
export enum BurnPermitStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    DENIED = 'Denied',
}
export interface BurnPermit {
    id: string;
    applicantName: string;
    address: string;
    phone: string;
    burnType: string;
    requestedDate: string;
    status: BurnPermitStatus;
}
export interface CitizenUser {
    id: string;
    name: string;
    email: string;
}
export enum CitizenStatus {
    ACTIVE = 'Active',
    PENDING_APPROVAL = 'Pending Approval',
    SUSPENDED = 'Suspended',
    DENIED = 'Denied'
}
export interface Citizen {
    id: string;
    name: string;
    email: string;
    password?: string;
    propertyIds: string[];
    status: CitizenStatus;
    phoneNumbers?: { number: string, type: 'Mobile' | 'Home' | 'Work' }[];
    notificationPreferences?: Record<string, boolean>;
}
export interface BillForgivenessRequest {
    id: string;
    citizenId: string;
    fireDueId: string;
    reason: string;
    submittedAt: string;
    status: 'Pending' | 'Approved' | 'Denied';
}
export interface AboutUsContent {
    mission: string;
    values: { title: string, description: string }[];
    history: string;
    orgStructureDescription: string;
}
export interface LeadershipMember {
    id: string;
    name: string;
    rank: string;
    avatarUrl: string;
    bio: string;
}
export interface PhotoAlbum {
    id: string;
    title: string;
    description: string;
    coverPhotoUrl: string;
}
export interface Photo {
    id: string;
    albumId: string;
    url: string;
    caption: string;
    dateTaken: string;
}
export enum RecordsRequestStatus {
    PENDING = 'Pending',
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
    DENIED = 'Denied'
}
export interface RecordsRequest {
    id: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
    description: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    requestedFormat: 'Electronic' | 'Paper';
    status: RecordsRequestStatus;
    submittedAt: string;
}

// --- Maintenance & Checklists ---
export enum ChecklistItemStatus {
    PENDING = 'Pending',
    PASS = 'Pass',
    FAIL = 'Fail',
}
export interface ApparatusChecklistItem {
    id: string;
    text: string;
    status: ChecklistItemStatus;
}
export interface RepairTicket {
    id: string;
    apparatusId: string;
    apparatusUnitId: string;
    itemDescription: string;
    createdAt: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    assigneeId?: string | null;
    resolutionNotes?: string;
}
export enum ApplicantStatus {
    APPLIED = 'Applied',
    INTERVIEW = 'Interview',
    OFFER = 'Offer',
    HIRED = 'Hired',
    REJECTED = 'Rejected',
}
export interface Applicant {
    id: string;
    name: string;
    email: string;
    phone: string;
    appliedDate: string;
    status: ApplicantStatus;
}
export interface ChecklistItemTemplate {
    id: string;
    text: string;
}
export interface ChecklistTemplate {
    id: string;
    name: string;
    apparatusType: 'Engine' | 'Ladder' | 'Rescue' | 'Tanker' | 'Brush Truck' | 'General';
    items: ChecklistItemTemplate[];
}

// --- Assets & Inventory ---

export interface AssetPhoto {
    id: string;
    url: string;
    caption: string;
}

export interface AssetDocument {
    id: string;
    name: string;
    url: string;
    mockContent?: string;
    summary?: string;
}

export interface Asset {
    id: string;
    name: string;
    assetType: string;
    category: 'Equipment' | 'PPE' | 'Kit';
    serialNumber: string;
    manufacturer: string;
    model: string;
    purchaseDate: string;
    purchasePrice: number;
    status: 'In Use' | 'In Storage' | 'Needs Repair' | 'Retired';
    assignedToId: string | null;
    assignedToType: 'Personnel' | 'Apparatus' | 'SubCompartment' | null;
    assignedToName?: string;
    lastTestedDate?: string;
    nextTestDueDate?: string;
    notes?: string;
    warrantyExpirationDate?: string;
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        expirationDate: string;
    };
    maintenanceHistory: MaintenanceLog[];
    pmSchedules: PreventativeMaintenanceSchedule[];
    inspectionHistory: AssetInspection[];
    parentId: string | null;
    components?: Asset[]; // For composite assets like SCBA packs
    inventory?: { consumableId: string, quantity: number }[]; // For kits
    lifespanYears?: number;
    photos?: AssetPhoto[];
    documents?: AssetDocument[];
    totalCostOfOwnership?: number;
    currentValue?: number;
    // PPE Specific
    manufactureDate?: string;
    lastCleaningDate?: string;
    retirementDate?: string;
    nfpaCategory?: string;
    // SCBA Bottle Specific
    hydrostaticTestDate?: string;
}

export interface ConsumableUsageLog {
    id: string;
    date: string; // ISO 8601
    change: number; // e.g., -5 or +50
    reason: string;
    userId: string;
    userName: string;
}

export interface Consumable {
    id: string;
    name: string;
    category: 'Medical' | 'Station Supplies' | 'Rescue';
    quantity: number;
    reorderLevel: number;
    expirationDate?: string; // ISO 8601
    usageHistory?: ConsumableUsageLog[];
}

export interface MaintenanceLog {
    id: string;
    assetId: string;
    date: string;
    description: string;
    cost: number;
    performedBy: string;
    laborHours?: number;
    type: 'Preventative' | 'Repair';
}

export interface PreventativeMaintenanceSchedule {
    id: string;
    assetId: string;
    taskDescription: string;
    frequencyType: 'time' | 'usage';
    frequencyInterval: number;
    frequencyUnit: 'months' | 'years' | 'hours';
    nextDueDate: string;
    lastPerformedDate?: string;
}

export interface AssetInspection {
    id: string;
    assetId: string;
    date: string;
    performedBy: string;
    notes: string;
}

export interface SavedAssetView {
    id: string;
    name: string;
    filters: any;
}

// --- Training & Scheduling ---
export interface TrainingCourse {
    id: string;
    name: string;
    description: string;
    durationHours: number;
    isRequired?: boolean;
}
export interface ScheduledTraining {
    id: string;
    courseId: string;
    date: string;
    instructor: string;
    attendeeIds: string[];
}
export interface Shift {
    id: string;
    personnelId: string;
    personnelName: string;
    date: string;
    shiftType: 'A Shift' | 'B Shift' | 'C Shift' | 'Off';
}

// --- Documents ---
export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
}
export interface Document {
    id: string;
    name: string;
    folderId: string | null;
    size: string;
    type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Other';
    version: number;
    modifiedAt: string;
}

// --- Calendar ---
export enum EventCategory {
    TRAINING = 'Training',
    MAINTENANCE = 'Maintenance',
    PUBLIC_EVENT = 'Public Event',
    MANUAL = 'Manual Entry',
    SHIFT = 'Shift Schedule'
}
export interface Event {
    id: string;
    title: string;
    date: string; // ISO string
    endDate?: string; // ISO string
    category: EventCategory;
    description?: string;
    location?: string;
}

// --- Reporting & Analytics ---
export interface PrebuiltReport {
    id: string;
    title: string;
    description: string;
}
export type DataSource = 'incidents' | 'personnel' | 'apparatus' | 'assets';
export type FilterCondition = 'is' | 'is_not' | 'contains' | 'does_not_contain' | 'is_greater_than' | 'is_less_than';
export interface ReportFilter {
    id: number;
    field: string;
    condition: FilterCondition;
    value: string;
}
export interface CustomReportConfig {
    dataSource: DataSource;
    fields: string[];
    filters: ReportFilter[];
}

// --- Health & Safety ---
export interface ExposureLog {
    id: string;
    personnelId: string;
    incidentId: string;
    incidentNumber: string;
    exposureDate: string;
    exposureType: 'Chemical' | 'Biological' | 'Smoke' | 'Stress' | 'Other';
    details: string;
}
export interface SdsSheet {
    id: string;
    productName: string;
    manufacturer: string;
    filePath: string;
    uploadedAt: string;
}

// --- V3 ---
export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'alert';
    message: string;
    link: string;
    timestamp: string;
    read: boolean;
}

export interface OptionalFieldConfig {
    [key: string]: boolean;
}

export interface DepartmentContact {
    name: string;
    role: string;
    phone: string;
    email: string;
}

export interface DepartmentInfo {
    name: string;
    fdid: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    phone: string;
    fax: string;
    email: string;
    fipsCode: string;
    stationCount: number;
    numberOfPaidFirefighters: number;
    numberOfVolunteerFirefighters: number;
    numberOfVolunteerPaidPerCallFirefighters: number;
    primaryContact: DepartmentContact;
    secondaryContact: DepartmentContact;
    medicalDirector: DepartmentContact;
    frequencyStatus: string;
    servicesProvided: string[];
    emsStatus: string;
    annualDispatches: number;
}

export interface SystemConfiguration {
    incidentTypes: string[];
    budgetCategories: string[];
    optionalFields: OptionalFieldConfig;
    assetViews: SavedAssetView[];
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    target: string;
    targetId: string;
    details?: any;
}

export interface InternalMessage {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
}

export interface SecurityRole {
    id: string;
    name: string;
    permissions: string[];
    parentId: string | null;
}

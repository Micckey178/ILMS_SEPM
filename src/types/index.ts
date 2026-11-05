export type UserRole = 'admin' | 'labManager' | 'faculty' | 'technician' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  departmentId?: string;
  institution?: string;
  institutionId?: string; // Student ID or Employee ID
  status?: 'active' | 'pending' | 'suspended';
  emailVerified?: boolean;
  requestedRole?: UserRole;
  assignedLabs: string[]; // List of laboratory IDs
  assignedLabId?: string; // Active lab selection
  phoneNumber?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type LaboratoryType =
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer_science'
  | 'electronics'
  | 'mechanical'
  | 'civil'
  | 'biotechnology'
  | 'environmental'
  | 'automobile'
  | 'medical'
  | 'agriculture'
  | 'general_research';

export interface Laboratory {
  id: string;
  name: string;
  code: string;
  type: LaboratoryType;
  organizationId: string;
  campusId: string;
  departmentId: string;
  building: string;
  roomNumber: string;
  capacity: number;
  managerId: string;
  managerName?: string;
  technicianIds: string[];
  contactEmail: string;
  contactPhone?: string;
  operatingHours: string;
  safetyLevel: 'Standard' | 'Biosafety-1' | 'Biosafety-2' | 'Hazardous-Chemical' | 'High-Voltage' | 'Heavy-Machinery';
  status: 'active' | 'maintenance' | 'inactive';
  description: string;
  enabledModules: string[];
  customFields?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt?: string;
}

export type AssetType = 'consumable' | 'reusable_equipment' | 'spare_part' | 'material' | 'software' | 'sample_resource';
export type UnitOfMeasurement = 'pcs' | 'kg' | 'g' | 'litres' | 'ml' | 'meters' | 'sets' | 'boxes' | 'hours' | 'licenses';

export interface UniversalInventoryItem {
  id: string;
  name: string;
  sku: string;
  qrCode: string;
  laboratoryId: string;
  organizationId: string;
  category: string;
  subcategory?: string;
  assetType: AssetType;
  storageLocation: string; // e.g. Shelf B-2, Chemical Cabinet 4
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  quantity: number;
  unit: UnitOfMeasurement;
  minStock: number;
  reorderQuantity: number;
  unitCost: number;
  currency: string;
  supplier?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  expiryDate?: string;
  batchNumber?: string;
  isLowStock: boolean;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'quarantined' | 'archived';
  laboratoryTypeAttributes?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'RECEIPT' | 'CONSUMPTION' | 'ADJUSTMENT' | 'RETURN' | 'DISPOSAL' | 'TRANSFER';

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  laboratoryId: string;
  previousQuantity: number;
  changeAmount: number;
  newQuantity: number;
  type: MovementType;
  reason: string;
  referenceNumber?: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'MAINTENANCE_BLOCKED' | 'CALIBRATION_OVERDUE' | 'OUT_OF_SERVICE' | 'FAULTY' | 'DECOMMISSIONED';

export interface EquipmentAsset {
  id: string;
  name: string;
  assetTag: string;
  qrCode: string;
  laboratoryId: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: EquipmentStatus;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceIntervalDays?: number;
  calibrationDueDate?: string;
  specifications: Record<string, string>;
  isKit?: boolean;
  kitComponents?: string[];
  safetyInstructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface EquipmentBooking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  laboratoryId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  purpose: string;
  projectOrExperiment?: string;
  status: BookingStatus;
  approvedBy?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
}

export type IssueReturnStatus = 'REQUESTED' | 'APPROVED' | 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'DAMAGED_RETURN' | 'CLOSED';

export interface IssueReturnTransaction {
  id: string;
  itemId: string;
  itemName: string;
  isEquipment: boolean;
  laboratoryId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail: string;
  technicianId?: string;
  technicianName?: string;
  quantity: number;
  issueDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  conditionBeforeIssue: 'EXCELLENT' | 'GOOD' | 'FAIR';
  conditionAfterReturn?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
  missingComponents?: string[];
  inspectionNotes?: string;
  damageFee?: number;
  status: IssueReturnStatus;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  laboratoryId: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'SAFETY_INSPECTION';
  scheduledDate: string;
  completionDate?: string;
  technicianId: string;
  technicianName: string;
  serviceProvider?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  faultDescription?: string;
  workPerformed?: string;
  cost: number;
  partsReplaced?: string[];
  certificateUrl?: string;
  nextScheduledDate?: string;
  createdAt: string;
}

export interface IncidentTicket {
  id: string;
  title: string;
  laboratoryId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'EQUIPMENT_DAMAGE' | 'CHEMICAL_SPILL' | 'BIOSAFETY' | 'ELECTRICAL' | 'FIRE' | 'INJURY' | 'IT_SYSTEM';
  reportedBy: string;
  reportedByName: string;
  description: string;
  immediateActionsTaken?: string;
  correctiveActionsRequired?: string;
  assignedTo?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'CORRECTIVE_ACTION_PENDING' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface PurchaseRequest {
  id: string;
  title: string;
  laboratoryId: string;
  requestedBy: string;
  requestedByName: string;
  items: {
    name: string;
    category: string;
    quantity: number;
    estimatedUnitCost: number;
    supplier?: string;
  }[];
  totalEstimatedCost: number;
  currency: string;
  justification: string;
  departmentBudgetCode?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ORDER_PLACED' | 'RECEIVED' | 'CANCELLED';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  purchaseOrderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentRecord {
  id: string;
  title: string;
  code: string;
  laboratoryId: string;
  leadFacultyId: string;
  leadFacultyName: string;
  equipmentUsed: string[];
  samplesUsed: string[];
  startDate: string;
  endDate?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ANALYSIS' | 'COMPLETED' | 'ARCHIVED';
  objective: string;
  protocolNotes: string;
  resultsSummary?: string;
  attachments?: string[];
  createdAt: string;
}

export interface SampleRecord {
  id: string;
  sampleId: string;
  name: string;
  laboratoryId: string;
  type: string; // e.g., 'Soil Specimen', 'Bacterial Culture', 'Alloy Test Bar'
  source: string;
  collectionDate: string;
  storageCondition: string; // e.g. '-80°C Freezer #2'
  responsiblePerson: string;
  status: 'STORED' | 'IN_USE' | 'DEPLETED' | 'DISPOSED';
  disposalDate?: string;
  notes?: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  type: 'LOW_STOCK' | 'OVERDUE_RETURN' | 'BOOKING_UPDATE' | 'MAINTENANCE_DUE' | 'PURCHASE_APPROVAL' | 'SAFETY_ALERT';
  title: string;
  message: string;
  laboratoryId?: string;
  targetUserId?: string;
  targetRole?: UserRole;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  category: 'AUTH' | 'INVENTORY' | 'BOOKING' | 'MAINTENANCE' | 'PROCUREMENT' | 'ADMIN' | 'SAFETY';
  laboratoryId?: string;
  userId: string;
  userName: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ComputerWorkstation {
  id: string;
  workstationTag: string;
  laboratoryId: string;
  cpu: string;
  ram: string;
  gpu?: string;
  storage: string;
  os: string;
  status: 'WORKING' | 'FAULTY' | 'UNDER_MAINTENANCE';
  reportedFault?: string;
  lastInspection: string;
  assignedTechnician?: string;
}

export interface PracticalSession {
  id: string;
  title: string;
  courseCode: string;
  laboratoryId: string;
  facultyId: string;
  facultyName: string;
  groupName: string;
  studentCount: number;
  date: string;
  startTime: string;
  endTime: string;
  requiredEquipment: string[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  observations?: string;
  attendanceCount?: number;
}

export interface SmartHealthScore {
  overall: number; // 0-100
  availabilityScore: number;
  maintenanceScore: number;
  stockScore: number;
  incidentScore: number;
  summary: string;
}

export interface FaultTicket {
  id: string;
  equipmentId: string;
  equipmentName: string;
  laboratoryId: string;
  reportedBy: string;
  reportedByName: string;
  problemCategory: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'REPAIR_SCHEDULED' | 'RESOLVED';
  photoUrl?: string;
  reportedAt: string;
  resolvedAt?: string;
  timeline: { stage: string; timestamp: string; note?: string }[];
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  institutionId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  laboratoryId: string;
  laboratoryName: string;
  sessionId?: string;
  sessionTitle: string;
  courseCode: string;
  classBatch: string;
  date: string; // YYYY-MM-DD
  facultyId: string;
  facultyName: string;
  students: StudentAttendanceItem[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  isConfirmed: boolean;
  confirmedAt?: string;
  corrections?: {
    studentId: string;
    studentName: string;
    oldStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    reason: string;
    updatedBy: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type VendorVerificationStatus = 'REGISTERED' | 'DOCUMENTS_PENDING' | 'VERIFIED' | 'EXPIRED' | 'SUSPENDED';

export interface CertifiedVendor {
  id: string;
  name: string;
  companyRegistrationNumber: string;
  verificationStatus: VendorVerificationStatus;
  certificationDetails: string;
  certificationDocUrl?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verificationDate?: string;
  verificationExpiryDate?: string;
  categories: string[];
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceAreas: string[];
  warrantyPolicy: string;
  supportContact: string;
  rating: number; // 1-5
  totalOrdersCompleted: number;
  createdAt: string;
}

export interface VendorCatalogProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  category: string;
  manufacturer: string;
  modelNumber: string;
  specifications: string;
  unitPrice: number;
  currency: string;
  availability: 'IN_STOCK' | 'LEAD_TIME_REQUIRED' | 'DISCONTINUED';
  leadTimeDays: number;
  minOrderQuantity: number;
  warrantyMonths: number;
  docUrl?: string;
  verifiedProduct: boolean;
}

export interface TechnicianWorkLog {
  id: string;
  workOrderNumber: string;
  laboratoryId: string;
  laboratoryName: string;
  roomCode: string;
  title: string;
  category: 'WORKSTATION_DEPLOYMENT' | 'HARDWARE_REPAIR' | 'NETWORK_CONFIG' | 'CALIBRATION' | 'PREVENTIVE_MAINTENANCE' | 'EMERGENCY_FAULT';
  equipmentName: string;
  workDescription: string;
  date: string;
  timeSpentHours: number;
  technicianId: string;
  technicianName: string;
  verifiedBy: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  costRupees: number;
}

export interface InstitutionalAlert {
  id: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'EQUIPMENT_FAULT' | 'OVERDUE_RETURN' | 'MAINTENANCE_DUE' | 'CALIBRATION_DUE' | 'LOW_STOCK' | 'EXPIRING_STOCK' | 'PENDING_APPROVAL' | 'SAFETY_INCIDENT';
  laboratoryId: string;
  laboratoryName: string;
  departmentId: string;
  departmentName: string;
  timestamp: string;
  recordId: string;
  actionUrl: string;
  actionLabel: string;
  acknowledged?: boolean;
}

export interface DepartmentSummary {
  id: string;
  departmentId?: string;
  name: string;
  code: string;
  laboratoriesCount: number;
  totalLaboratories?: number;
  totalEquipment: number;
  operationalEquipment: number;
  equipmentRequiringMaintenance: number;
  maintenanceRequired?: number;
  activeSessions: number;
  resourceUtilizationRate: number; // 0 to 100%
  resourceUtilizationPct?: number;
  pendingRequestsCount: number;
  totalMaintenanceExpenditure: number; // in ₹
  estimatedMaintenanceCost?: number;
}

export interface EquipmentUtilizationMetric {
  equipmentId: string;
  equipmentName: string;
  assetTag: string;
  laboratoryId: string;
  laboratoryName: string;
  departmentId: string;
  departmentName: string;
  totalUsageHours: number;
  operatingDurationHours: number;
  utilizationPercentage: number;
  downtimeHours: number;
  lastUsedDate: string;
  condition: 'WORKING' | 'FAULTY' | 'UNDER_MAINTENANCE' | 'CALIBRATING';
  utilizationCategory: 'HIGH' | 'MODERATE' | 'UNDERUTILIZED' | 'UNUSED' | 'UNAVAILABLE';
}

export interface ResourceShortage {
  id: string;
  departmentId: string;
  departmentName: string;
  laboratoryId: string;
  laboratoryName: string;
  equipmentCategory: string;
  requiredQuantity: number;
  availableOperationalQuantity: number;
  shortageQuantity: number;
  supportingData: string;
  suggestedAction: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface ResourceRecommendation {
  id: string;
  type: 'TRANSFER' | 'MAINTENANCE' | 'PROCUREMENT' | 'STOCK_REPLENISHMENT' | 'CAPACITY_REVIEW';
  title: string;
  reason: string;
  supportingData: string;
  affectedDepartment: string;
  affectedLaboratory: string;
  expectedOperationalBenefit: string;
  suggestedAction: string;
  status: 'PENDING' | 'APPROVED' | 'DISMISSED';
  createdAt: string;
  actionPayload?: Record<string, any>;
}

export interface CommandCentreKPIs {
  totalLaboratories: number;
  operationalLaboratories: number;
  laboratoriesRequiringAttention: number;
  totalRegisteredEquipment: number;
  workingEquipment: number;
  nonOperationalEquipment: number;
  totalDepartments: number;
  activeSessions: number;
  pendingApprovals: number;
  activeReservations: number;
  openMaintenanceRequests: number;
  lowStockAlerts: number;
}

export interface CapacityMetric {
  laboratoryId: string;
  laboratoryName: string;
  code: string;
  building: string;
  roomNumber: string;
  registeredCapacity: number;
  scheduledStudentCount: number;
  checkedInStudentCount: number;
  remainingCapacity: number;
  capacityUtilizationPct: number;
  peakPeriod: string;
  occupancyTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

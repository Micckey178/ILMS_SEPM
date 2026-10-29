export type UserRole = 'admin' | 'labManager' | 'faculty' | 'technician' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  departmentId?: string;
  assignedLabs: string[]; // List of laboratory IDs
  assignedLabId?: string; // Active lab selection
  phoneNumber?: string;
  avatarUrl?: string;
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

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'MAINTENANCE_BLOCKED' | 'CALIBRATION_OVERDUE' | 'OUT_OF_SERVICE';

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

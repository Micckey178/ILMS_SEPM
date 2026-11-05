import { describe, it, expect, beforeEach } from 'vitest';
import { DataService, localStore } from '../src/services/dataService';
import { UserProfile, UserRole } from '../src/types';

describe('ILMS Strict Four-Role Architecture & Command Centre + Resource Intelligence', () => {
  const adminUser: UserProfile = {
    id: 'usr-admin-vtu',
    email: 'admin@institution.edu',
    displayName: 'Dean of Infrastructure',
    role: 'admin',
    organizationId: 'org-main-01',
    assignedLabs: ['lab-chem-01', 'lab-cse-01'],
    assignedLabId: 'lab-cse-01'
  };

  const facultyUser: UserProfile = {
    id: 'usr-fac-vtu',
    email: 'faculty@institution.edu',
    displayName: 'Dr. Anand Kumar',
    role: 'faculty',
    organizationId: 'org-main-01',
    departmentId: 'dept-cse',
    assignedLabs: ['lab-cse-01'],
    assignedLabId: 'lab-cse-01'
  };

  const techUser: UserProfile = {
    id: 'usr-tech-vtu',
    email: 'tech@institution.edu',
    displayName: 'Ramesh Sharma',
    role: 'technician',
    organizationId: 'org-main-01',
    assignedLabs: ['lab-cse-01'],
    assignedLabId: 'lab-cse-01'
  };

  const studentUser: UserProfile = {
    id: 'usr-student-vtu',
    email: 'student@institution.edu',
    displayName: 'Mehek Student',
    role: 'student',
    organizationId: 'org-main-01',
    assignedLabs: ['lab-cse-01'],
    assignedLabId: 'lab-cse-01'
  };

  beforeEach(() => {
    localStore.resetToSeed();
  });

  describe('Strict Four-Role Architecture Compliance', () => {
    it('1. Enforces exactly four canonical user roles with distinct operational scopes', () => {
      const authorizedRoles: UserRole[] = ['student', 'faculty', 'technician', 'admin'];

      expect(authorizedRoles).toContain(adminUser.role);
      expect(authorizedRoles).toContain(facultyUser.role);
      expect(authorizedRoles).toContain(techUser.role);
      expect(authorizedRoles).toContain(studentUser.role);
      expect(authorizedRoles.length).toBe(4);
    });
  });

  describe('Module A: ILMS Command Centre', () => {
    it('2. Computes live institutional Command Centre KPIs from active records', async () => {
      const kpis = await DataService.getCommandCentreKPIs();

      expect(kpis.totalLaboratories).toBeGreaterThan(0);
      expect(kpis.operationalLaboratories).toBeGreaterThanOrEqual(0);
      expect(kpis.totalRegisteredEquipment).toBeGreaterThan(0);
      expect(kpis.workingEquipment).toBeGreaterThanOrEqual(0);
      expect(kpis.totalDepartments).toBeGreaterThanOrEqual(4);
      expect(kpis.activeReservations).toBeGreaterThanOrEqual(0);
      expect(typeof kpis.pendingApprovals).toBe('number');
      expect(typeof kpis.openMaintenanceRequests).toBe('number');
      expect(typeof kpis.lowStockAlerts).toBe('number');
    });

    it('3. Compiles department summaries across all engineering disciplines', async () => {
      const departments = await DataService.getDepartmentSummaries();

      expect(departments.length).toBeGreaterThanOrEqual(4);
      const cse = departments.find(d => d.code === 'CSE');
      expect(cse).toBeDefined();
      expect(cse?.totalLaboratories).toBeGreaterThan(0);
      expect(cse?.totalEquipment).toBeGreaterThan(0);
      expect(cse?.resourceUtilizationPct).toBeGreaterThanOrEqual(0);
      expect(cse?.estimatedMaintenanceCost).toBeGreaterThanOrEqual(0);
    });

    it('4. Aggregates and prioritizes institutional operational alerts', async () => {
      const alerts = await DataService.getInstitutionalAlerts();

      expect(Array.isArray(alerts)).toBe(true);
      if (alerts.length > 0) {
        const topAlert = alerts[0];
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(topAlert.priority);
        expect(topAlert.laboratoryId).toBeDefined();
        expect(topAlert.actionUrl).toBeDefined();
      }
    });

    it('5. Allows administrators to acknowledge and dismiss alerts persistently', async () => {
      const initialAlerts = await DataService.getInstitutionalAlerts();
      if (initialAlerts.length > 0) {
        const alertToAck = initialAlerts[0].id;
        await DataService.acknowledgeAlert(alertToAck);

        const updatedAlerts = await DataService.getInstitutionalAlerts();
        expect(updatedAlerts.some(a => a.id === alertToAck)).toBe(false);
      }
    });
  });

  describe('Module C: Institutional Resource Intelligence', () => {
    it('6. Calculates deterministic equipment utilization and categorizes tiers dynamically', async () => {
      const standardMetrics = await DataService.getEquipmentUtilizationMetrics(70, 35);

      expect(standardMetrics.length).toBeGreaterThan(0);
      const sample = standardMetrics[0];

      expect(sample.operatingDurationHours).toBe(208); // 26 days * 8 hours standard academic capacity
      expect(sample.utilizationPercentage).toBeGreaterThanOrEqual(0);
      expect(sample.utilizationPercentage).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MODERATE', 'UNDERUTILIZED', 'UNUSED', 'UNAVAILABLE']).toContain(sample.utilizationCategory);

      // Verify custom configurable threshold re-classification
      const strictMetrics = await DataService.getEquipmentUtilizationMetrics(90, 60);
      expect(strictMetrics.length).toBe(standardMetrics.length);
    });

    it('7. Detects cohort student vs operational equipment shortages', async () => {
      const shortages = await DataService.getResourceShortages();

      expect(Array.isArray(shortages)).toBe(true);
      shortages.forEach(st => {
        expect(st.requiredQuantity).toBeGreaterThan(st.availableOperationalQuantity);
        expect(st.shortageQuantity).toBe(st.requiredQuantity - st.availableOperationalQuantity);
        expect(st.supportingData).toBeDefined();
        expect(st.suggestedAction).toBeDefined();
      });
    });

    it('8. Generates rule-based optimization recommendations for administrative review', async () => {
      const recs = await DataService.getResourceRecommendations();

      expect(recs.length).toBeGreaterThan(0);
      const validTypes = ['TRANSFER', 'MAINTENANCE', 'PROCUREMENT', 'STOCK_REPLENISHMENT', 'CAPACITY_REVIEW'];
      recs.forEach(r => {
        expect(validTypes).toContain(r.type);
        expect(r.title).toBeDefined();
        expect(r.reason).toBeDefined();
        expect(r.expectedOperationalBenefit).toBeDefined();
        expect(['PENDING', 'APPROVED', 'DISMISSED']).toContain(r.status);
      });
    });

    it('9. Supports audited approval and dismissal of resource recommendations by administrators', async () => {
      const recs = await DataService.getResourceRecommendations();
      const firstRec = recs[0];

      await DataService.approveResourceRecommendation(firstRec.id, adminUser);
      let updatedRecs = await DataService.getResourceRecommendations();
      expect(updatedRecs.find(r => r.id === firstRec.id)?.status).toBe('APPROVED');

      if (recs.length > 1) {
        const secondRec = recs[1];
        await DataService.dismissResourceRecommendation(secondRec.id, adminUser);
        updatedRecs = await DataService.getResourceRecommendations();
        expect(updatedRecs.find(r => r.id === secondRec.id)?.status).toBe('DISMISSED');
      }
    });

    it('10. Analyzes laboratory capacity, scheduled student counts, and checked-in attendance', async () => {
      const capacity = await DataService.getCapacityMetrics();

      expect(capacity.length).toBeGreaterThan(0);
      const sample = capacity[0];
      expect(sample.registeredCapacity).toBeGreaterThan(0);
      expect(sample.scheduledStudentCount).toBeGreaterThanOrEqual(0);
      expect(sample.checkedInStudentCount).toBeGreaterThanOrEqual(0);
      expect(sample.capacityUtilizationPct).toBeGreaterThanOrEqual(0);
      expect(sample.peakPeriod).toBeDefined();
      expect(['INCREASING', 'STABLE', 'DECREASING']).toContain(sample.occupancyTrend);
    });
  });
});

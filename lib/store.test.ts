import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStore,
  saveStore,
  getProjects,
  upsertDailyReport,
  getProjectById,
  getBowlingMatrix,
  getDailyReportById,
  markDailySentToProjectSight,
  createProject,
  updateProjectWorkingDays,
  updateProjectTradePartners,
  removeTradePartnerFromProject,
  approveDailyReport,
  deleteProject,
  getCapacityStatus,
  CapacityLimitError,
  getProjectCompanies,
  setProjectCompanies,
  toggleCompanyTracking,
  addCompanyContact,
} from './store';
import type { CompanyContact, ProjectCompany } from '@/types/hpproto';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'hpproto-test-db.json');

describe('HPproto Local Store', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('initializes default seeded projects with empty trade partners', () => {
    const store = getStore(TEST_DB_PATH);
    expect(store.projects.length).toBeGreaterThan(0);
    const demo = getProjectById('1025', TEST_DB_PATH);
    expect(demo).toBeDefined();
    expect(demo?.tradePartners).toEqual([]);
  });

  it('updates project trade partners properly', () => {
    updateProjectTradePartners(
      '1025',
      [
        { id: 'three-star-drywall', name: 'Three Star Drywall' },
        { id: 'electro-electrical-co', name: 'Electro Electrical Co.' },
      ],
      TEST_DB_PATH,
    );
    const demo = getProjectById('1025', TEST_DB_PATH);
    expect(demo).toBeDefined();
    const ids = demo!.tradePartners.map(tp => tp.id);
    expect(ids).toContain('three-star-drywall');
    expect(ids).toContain('electro-electrical-co');
  });

  it('creates new projects dynamically and updates working days', () => {
    const created = createProject(
      {
        name: 'Apex Arena Project',
        code: 'APEX01',
        workingDays: [1, 2, 3, 4, 5, 6],
      },
      TEST_DB_PATH,
    );
    expect(created.id).toBe('apex-arena-project');
    expect(created.code).toBe('APEX01');
    expect(created.workingDays).toEqual([1, 2, 3, 4, 5, 6]);

    const updated = updateProjectWorkingDays('apex-arena-project', [1, 2, 3, 4, 5], TEST_DB_PATH);
    expect(updated?.workingDays).toEqual([1, 2, 3, 4, 5]);

    const deleted = deleteProject('apex-arena-project', TEST_DB_PATH);
    expect(deleted).toBe(true);
    expect(getProjectById('apex-arena-project', TEST_DB_PATH)).toBeUndefined();
    const afterDelete = getProjects(TEST_DB_PATH);
    expect(afterDelete.map(p => p.id)).not.toContain('apex-arena-project');
  });

  it('upserts a daily report and replaces previous submission on the same date', () => {
    updateProjectTradePartners('1025', [{ id: 'three-star-drywall', name: 'Three Star Drywall' }], TEST_DB_PATH);
    const report1 = {
      id: 'rpt-1',
      projectId: '1025',
      tradePartnerId: 'three-star-drywall',
      tradePartnerName: 'Three Star Drywall',
      date: '2026-08-20',
      submittedAt: new Date().toISOString(),
      locationDescription: 'Building A 2nd Floor',
      workerCount: 5,
      totalHours: 40,
      crewBreakdown: [{ craft: 'Drywaller', count: 5 }],
      equipment: ['Scissor Lift'],
      notes: 'No delays',
      staCompleted: true,
      emailRecipients: ['test@threestar.com'],
    };

    upsertDailyReport(report1, TEST_DB_PATH);
    const matrix = getBowlingMatrix('1025', '2026-08', TEST_DB_PATH);
    const row = matrix.rows.find(r => r.tradePartner.id === 'three-star-drywall');
    expect(row).toBeDefined();
    const cell20 = row?.cells.find(c => c.date === '2026-08-20');
    expect(cell20?.status).toBe('submitted');
    expect(cell20?.workerCount).toBe(5);
    expect(cell20?.totalHours).toBe(40);

    // Upsert replacement for same trade partner + date
    const report2 = { ...report1, id: 'rpt-2', workerCount: 8, totalHours: 64 };
    upsertDailyReport(report2, TEST_DB_PATH);
    const updatedMatrix = getBowlingMatrix('1025', '2026-08', TEST_DB_PATH);
    const updatedCell = updatedMatrix.rows
      .find(r => r.tradePartner.id === 'three-star-drywall')
      ?.cells.find(c => c.date === '2026-08-20');
    expect(updatedCell?.workerCount).toBe(8);
    expect(updatedCell?.totalHours).toBe(64);
  });

  it('approves a daily report, records approver metadata, and auto-adds company to trade partners', () => {
    // Project starts with empty trade partners
    expect(getProjectById('1025', TEST_DB_PATH)?.tradePartners).toEqual([]);

    const report = {
      id: 'rpt-app-1',
      projectId: '1025',
      tradePartnerId: 'three-star-drywall',
      tradePartnerName: 'Three Star Drywall',
      date: '2026-08-21',
      submittedAt: new Date().toISOString(),
      locationDescription: 'Site',
      workerCount: 4,
      totalHours: 32,
      crewBreakdown: [],
      equipment: [],
      notes: '',
      staCompleted: true,
      emailRecipients: [],
    };
    upsertDailyReport(report, TEST_DB_PATH);
    const approved = approveDailyReport('rpt-app-1', 'superintendent@henselphelps.com', TEST_DB_PATH);
    expect(approved?.approvalStatus).toBe('approved');
    expect(approved?.approvedBy).toBe('superintendent@henselphelps.com');
    expect(approved?.approvedAt).toBeDefined();

    // Verify company was auto-added to project trade partners
    const updatedProject = getProjectById('1025', TEST_DB_PATH);
    expect(updatedProject?.tradePartners.map(tp => tp.name)).toContain('Three Star Drywall');
  });

  it('respects working days configuration in the bowling matrix', () => {
    updateProjectTradePartners('1025', [{ id: 'three-star-drywall', name: 'Three Star Drywall' }], TEST_DB_PATH);
    // August 2026: Aug 1 is Saturday, Aug 2 is Sunday, Aug 3 is Monday
    const matrix = getBowlingMatrix('1025', '2026-08', TEST_DB_PATH, [1, 2, 3, 4, 5]); // Mon-Fri
    const row = matrix.rows[0];
    expect(row).toBeDefined();

    const aug1 = row.cells.find(c => c.date === '2026-08-01'); // Saturday
    expect(aug1?.status).toBe('na');

    const aug2 = row.cells.find(c => c.date === '2026-08-02'); // Sunday
    expect(aug2?.status).toBe('na');

    const aug3 = row.cells.find(c => c.date === '2026-08-03'); // Monday (work day)
    expect(aug3?.status).toBe('missing');
  });

  it('tracks capacity status and enforces the 2000 daily reports limit', () => {
    const status = getCapacityStatus(TEST_DB_PATH);
    expect(status.max).toBe(2000);
    expect(status.isLocked).toBe(false);

    const store = getStore(TEST_DB_PATH);
    // Fill up to 2000
    for (let i = 0; i < 2000; i++) {
      store.dailyReports.push({
        id: `dr-fill-${i}`,
        projectId: '1025',
        tradePartnerId: 'three-star-drywall',
        tradePartnerName: 'Three Star Drywall',
        date: `2026-01-01`,
        submittedAt: new Date().toISOString(),
        locationDescription: '',
        workerCount: 1,
        totalHours: 8,
        crewBreakdown: [],
        equipment: [],
        notes: '',
        staCompleted: false,
        emailRecipients: [],
      });
    }
    saveStore(store, TEST_DB_PATH);

    const lockedStatus = getCapacityStatus(TEST_DB_PATH);
    expect(lockedStatus.isLocked).toBe(true);

    expect(() => {
      upsertDailyReport(
        {
          id: 'dr-over-capacity',
          projectId: '1025',
          tradePartnerId: 'monster-plumbing-mechanical',
          tradePartnerName: 'Monster Plumbing & Mechanical',
          date: '2026-08-25',
          submittedAt: new Date().toISOString(),
          locationDescription: '',
          workerCount: 1,
          totalHours: 8,
          crewBreakdown: [],
          equipment: [],
          notes: '',
          staCompleted: false,
          emailRecipients: [],
        },
        TEST_DB_PATH,
      );
    }).toThrow(CapacityLimitError);
  });

  it('removes a company and purges associated reports and records exclusion', () => {
    updateProjectTradePartners(
      '1025',
      [
        { id: 'titan-electric', name: 'Titan Electric', category: 'Electrical' },
        { id: 'three-star', name: 'Three Star Drywall', category: 'Drywall' },
      ],
      TEST_DB_PATH,
    );

    upsertDailyReport(
      {
        id: 'dr-titan-1',
        projectId: '1025',
        tradePartnerId: 'titan-electric',
        tradePartnerName: 'Titan Electric',
        date: '2026-08-10',
        submittedAt: new Date().toISOString(),
        locationDescription: 'Floor 1',
        workerCount: 4,
        totalHours: 32,
        crewBreakdown: [],
        equipment: [],
        notes: '',
        staCompleted: true,
        emailRecipients: [],
      },
      TEST_DB_PATH,
    );

    const res = removeTradePartnerFromProject('1025', 'Titan Electric', true, TEST_DB_PATH);
    expect(res.removedCount).toBe(1);
    expect(res.purgedReportsCount).toBe(1);

    const proj = getProjectById('1025', TEST_DB_PATH);
    expect(proj?.tradePartners.some((tp) => tp.id === 'titan-electric')).toBe(false);
    expect(proj?.tradePartners).toHaveLength(1);
    expect(proj?.tradePartners[0].name).toBe('Three Star Drywall');
    expect(proj?.excludedTradePartnerIds).toContain('titan electric');

    const remainingReports = getStore(TEST_DB_PATH).dailyReports;
    expect(remainingReports.some((r) => r.id === 'dr-titan-1')).toBe(false);
  });

  it('manages project companies, contacts, and keeps tradePartners synchronized with isTracked', () => {
    const proj = getProjectById('1025', TEST_DB_PATH);
    expect(proj).toBeDefined();

    // Test setting available companies
    const initialCompanies: ProjectCompany[] = [
      {
        id: 'titan-electric',
        name: 'Titan Electric',
        trade: 'Electrical',
        isTracked: true,
        contacts: [
          { id: 'c-1', firstName: 'John', lastName: 'Doe', displayName: 'John Doe', email: 'jdoe@titan.com' }
        ]
      },
      {
        id: 'apex-drywall',
        name: 'Apex Drywall',
        trade: 'Drywall',
        isTracked: false,
        contacts: []
      }
    ];

    setProjectCompanies('1025', initialCompanies, TEST_DB_PATH);
    const fetched = getProjectCompanies('1025', TEST_DB_PATH);
    expect(fetched).toHaveLength(2);
    expect(fetched[0].contacts).toHaveLength(1);

    // Verify tradePartners synchronized with isTracked = true
    const updatedProj = getProjectById('1025', TEST_DB_PATH);
    expect(updatedProj?.tradePartners).toHaveLength(1);
    expect(updatedProj?.tradePartners[0].name).toBe('Titan Electric');

    // Toggle tracking
    toggleCompanyTracking('1025', 'apex-drywall', true, TEST_DB_PATH);
    const afterToggle = getProjectById('1025', TEST_DB_PATH);
    expect(afterToggle?.tradePartners).toHaveLength(2);

    // Add contact
    const newContact: CompanyContact = {
      id: 'c-2',
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Jane Smith',
      email: 'jsmith@titan.com',
      title: 'Foreman'
    };
    addCompanyContact('1025', 'titan-electric', newContact, TEST_DB_PATH);
    const withContact = getProjectCompanies('1025', TEST_DB_PATH);
    const titan = withContact.find(c => c.id === 'titan-electric');
    expect(titan?.contacts.some(c => c.email === 'jsmith@titan.com')).toBe(true);
  });
});

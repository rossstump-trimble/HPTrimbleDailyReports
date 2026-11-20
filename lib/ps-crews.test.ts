import { describe, expect, it } from 'vitest';
import { mergePsCrews, psCrewsFromCompany } from './ps-crews';

describe('psCrewsFromCompany', () => {
  it('reads crew id, name and headcount from a ProjectSight company', () => {
    const crews = psCrewsFromCompany({
      Crews: [{ CrewID: 508, CrewName: 'Tier 2 Framing Crew', Workers: 12, Deleted: false }],
    });
    expect(crews).toEqual([{ psCrewId: 508, name: 'Tier 2 Framing Crew', workers: 12 }]);
  });

  it('skips deleted crews, crews without an id and crews without a name', () => {
    const crews = psCrewsFromCompany({
      Crews: [
        { CrewID: 1, CrewName: 'Gone', Deleted: true },
        { CrewName: 'No id' },
        { CrewID: 3, CrewName: '   ' },
        { CrewID: 4, CrewName: 'Kept' },
      ],
    });
    expect(crews.map((c) => c.psCrewId)).toEqual([4]);
  });

  it('skips the "N/A" placeholder crew ProjectSight creates for every company', () => {
    const crews = psCrewsFromCompany({
      Crews: [
        { CrewID: 1, CrewName: 'N/A', IsDefault: true },
        { CrewID: 5, CrewName: 'Crew B', IsDefault: false },
      ],
    });
    expect(crews.map((c) => c.psCrewId)).toEqual([5]);
  });

  it('keeps a real crew even when it is the default one', () => {
    const crews = psCrewsFromCompany({ Crews: [{ CrewID: 9, CrewName: 'Main Crew', IsDefault: true }] });
    expect(crews.map((c) => c.psCrewId)).toEqual([9]);
  });

  it('returns nothing when the company has no Crews array', () => {
    expect(psCrewsFromCompany({})).toEqual([]);
    expect(psCrewsFromCompany({ Crews: null })).toEqual([]);
  });
});

describe('mergePsCrews', () => {
  it('adds ProjectSight crews that are not in the app yet', () => {
    const merged = mergePsCrews(undefined, [{ psCrewId: 7, name: 'Crew A' }]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ name: 'Crew A', psCrewId: 7 });
    expect(merged[0].id).toBeTruthy();
  });

  it('updates the name of an existing crew with the same ProjectSight id and keeps its app id', () => {
    const merged = mergePsCrews(
      [{ id: 'cr-1', name: 'Old name', psCrewId: 7 }],
      [{ psCrewId: 7, name: 'New name' }],
    );
    expect(merged).toEqual([{ id: 'cr-1', name: 'New name', psCrewId: 7 }]);
  });

  it('links a hand-typed crew to the ProjectSight crew with the same name instead of duplicating it', () => {
    const merged = mergePsCrews(
      [{ id: 'cr-1', name: 'crew a' }],
      [{ psCrewId: 7, name: 'Crew A' }],
    );
    expect(merged).toEqual([{ id: 'cr-1', name: 'Crew A', psCrewId: 7 }]);
  });

  it('keeps hand-typed crews that ProjectSight does not know about', () => {
    const merged = mergePsCrews(
      [{ id: 'cr-1', name: 'Night crew' }],
      [{ psCrewId: 7, name: 'Crew A' }],
    );
    expect(merged.map((c) => c.name)).toEqual(['Night crew', 'Crew A']);
  });

  it('does not duplicate when the same ProjectSight crew is imported twice', () => {
    const once = mergePsCrews(undefined, [{ psCrewId: 7, name: 'Crew A' }]);
    const twice = mergePsCrews(once, [{ psCrewId: 7, name: 'Crew A' }]);
    expect(twice).toHaveLength(1);
  });
});

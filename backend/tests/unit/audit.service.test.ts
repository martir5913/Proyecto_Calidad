import { AuditService } from '../../src/services/audit.service';
import { AuditRepository } from '../../src/repositories/audit.repository';

describe('ISO/IEC 25010 - Adecuación Funcional: Pruebas Unitarias de Auditoría de Calidad', () => {
  let mockAuditRepo: jest.Mocked<AuditRepository>;
  let auditService: AuditService;

  beforeEach(() => {
    mockAuditRepo = {
      create: jest.fn().mockImplementation((audit) => Promise.resolve({ id: 'audit-id', ...audit, created_at: new Date() })),
      findAllByTenant: jest.fn(),
    } as any;

    auditService = new AuditService(mockAuditRepo);
  });

  it('Debe dictaminar CONFORME (is_compliant = true) si el score de cumplimiento es >= 90.0%', async () => {
    const result = await auditService.evaluateAudit({
      batch_id: 'batch-001',
      inspector_id: 'user-inspector-1',
      standard_name: 'GLOBALGAP',
      compliance_score: 95.5,
      observations: 'Inspección aprobada sin observaciones críticas.'
    });

    expect(result.is_compliant).toBe(true);
    expect(result.compliance_score).toBe(95.5);
    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        is_compliant: true,
        standard_name: 'GLOBALGAP'
      })
    );
  });

  it('Debe dictaminar NO CONFORME (is_compliant = false) si el score de cumplimiento es < 90.0%', async () => {
    const result = await auditService.evaluateAudit({
      batch_id: 'batch-001',
      inspector_id: 'user-inspector-1',
      standard_name: 'USDA_ORGANIC',
      compliance_score: 82.0
    });

    expect(result.is_compliant).toBe(false);
    expect(result.compliance_score).toBe(82.0);
    expect(result.observations).toContain('NO CONFORME');
  });
});

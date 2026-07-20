import { Request } from 'express';

/**
 * Custom error class for school context issues
 */
export class SchoolContextError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number = 403, code: string = 'NO_SCHOOL_CONTEXT') {
    super(message);
    this.name = 'SchoolContextError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Extracts the correct tenant ID from the request.
 * Prioritizes req.activeSchoolId (set by authenticate middleware from X-School-Context header)
 * over req.user?.tenantId (from JWT).
 * 
 * Throws a SchoolContextError if no school context is available.
 */
export const getTenantId = (req: Request): number => {
  // req.activeSchoolId is set by authenticate middleware when X-School-Context header is present
  // It has already been validated by schoolService.validateSchoolAccess()
  const tenantId = req.activeSchoolId ?? req.user?.tenantId;
  
  if (!tenantId) {
    throw new SchoolContextError('No active school context found for this request', 403);
  }
  
  return tenantId;
};

import { Request, Response } from 'express';
import * as schoolService from '../services/schoolService';
import { User } from '../model';
import * as jwtHelper from '../helper/jwtHelper';

export const createSchool = async (req: Request, res: Response) => {
  try {
    const { schoolName, slug, timezone, studyDays, address } = req.body;

    if (!schoolName || !slug || !studyDays) {
      return res.status(400).json({ error: 'School name, slug, and study days are required' });
    }

    // Convert string days (MON, TUE) to numbers (0-6, where SUN is 0)
    // Assuming frontend sends ['MON', 'TUE', ...]
    const dayMap: { [key: string]: number } = {
      'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
    };

    const studyDayNumbers = Array.isArray(studyDays) 
      ? studyDays.map((d: string) => dayMap[d.toUpperCase()]).filter(n => n !== undefined)
      : [];

    const schoolData: schoolService.CreateSchoolDTO = {
      name: schoolName,
      slug,
      timezone,
      study_days: studyDayNumbers,
      address,
    };

    const newSchool = await schoolService.createSchool(schoolData);

    // If the creator is a user (which they should be), update their tenant_id to the new school
    if (req.user && req.user.userId) {
      const user = await User.findByPk(req.user.userId);
      if (user) {
        user.tenant_id = newSchool.id;
        await user.save();

        // Refresh the JWT token with the new tenantId
        const newToken = jwtHelper.signToken({
          userId: user.id,
          roleId: user.role_id,
          tenantId: user.tenant_id,
        });
        
        jwtHelper.setAuthCookie(res, newToken);
      }
    }

    return res.status(201).json({
      message: 'School created successfully',
      school: newSchool
    });
  } catch (error: any) {
    console.error('School creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create school',
      details: error.message 
    });
  }
};

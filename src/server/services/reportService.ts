import { Session, MemorizationRecord, RevisionRecord, Attendance, Surah, User, AttendanceStatus } from '../model';
import { Op, fn, col, literal } from 'sequelize';
import * as progressService from './progressService';
import { analyticsService } from './analyticsService';
import { getPaginationOptions, formatPaginationResult } from '../helper/paginationHelper';

export interface StudentReportData {
  student: {
    firstName: string;
    lastName: string;
    email: string;
    studentIdentifier: string;
  };
  summary: {
    totalSessions: number;
    attendanceRate: number;
    totalAyahsMemorized: number;
    completionPercentage: number;
  };
  sessions: any[];
}

export const getStudentReport = async (studentId: number, tenantId: number) => {
  try {
    const student = await User.findOne({
      where: { id: studentId, tenant_id: tenantId },
      attributes: ['first_name', 'last_name', 'email', 'student_identifier']
    });

    if (!student) throw new Error('Student not found');

    const sessions = await Session.findAll({
      where: { student_id: studentId, tenant_id: tenantId },
      include: [
        { model: Attendance, as: 'attendance', attributes: ['status'] },
        { 
          model: MemorizationRecord, 
          as: 'memorization_records',
          include: [{ model: Surah, as: 'surah', attributes: ['name'] }]
        },
        { 
          model: RevisionRecord, 
          as: 'revision_records',
          include: [
            { model: Surah, as: 'surah', attributes: ['name'] },
            { model: Surah, as: 'start_surah', attributes: ['name'] },
            { model: Surah, as: 'end_surah', attributes: ['name'] }
          ]
        }
      ],
      order: [['session_date', 'DESC']]
    });

    const totalSessions = sessions.length;
    const presentSessions = sessions.filter((s: any) => s.attendance?.status === AttendanceStatus.PRESENT).length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    const calculatedProgress = await progressService.calculateStudentProgress(studentId, tenantId);
    const totalAyahsMemorized = calculatedProgress.totalAyahs;
    const completionPercentage = calculatedProgress.percentage;

    return {
      student: {
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        studentIdentifier: student.student_identifier
      },
      summary: {
        totalSessions,
        attendanceRate,
        totalAyahsMemorized,
        completionPercentage
      },
      sessions: sessions.map((s: any) => ({
        date: s.session_date,
        attendance: s.attendance?.status || 'N/A',
        memorization: s.memorization_records.map((m: any) => `${m.surah?.name} (${m.start_ayah}-${m.end_ayah})`).join(', '),
        revision: s.revision_records.map((r: any) => {
          if (r.start_surah_number && r.end_surah_number && r.start_surah_number !== r.end_surah_number) {
            return `Surahs ${r.start_surah?.name || r.start_surah_number} - ${r.end_surah?.name || r.end_surah_number}`;
          }
          return `${r.surah?.name || 'Surah ' + r.surah_number} (${r.start_ayah || 1}-${r.end_ayah || 'Full'})`;
        }).join(', '),
        notes: s.notes
      }))
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get overall school performance report data
 */
export const getSchoolPerformanceReport = async (tenantId: number, startDate: string, endDate: string) => {
  try {
    // 1. Get basic stats
    const attendanceMetrics = await analyticsService.getAttendanceMetrics(tenantId, startDate, endDate);
    const memorizationProgress = await analyticsService.getMemorizationProgress(tenantId, startDate, endDate);
    const activeStudents = await analyticsService.getActiveStudents(tenantId);

    // 2. Get top performers (students with highest memorization activity in the period)
    const topPerformersData = await User.findAll({
      where: { tenant_id: tenantId, role: 'student' },
      include: [
        {
          model: MemorizationRecord,
          as: 'student_memorization_records',
          required: false,
          attributes: [],
          include: [
            {
              model: Session,
              as: 'session',
              required: true,
              where: {
                session_date: { [Op.between]: [startDate, endDate] }
              },
              attributes: []
            }
          ]
        }
      ],
      attributes: [
        'id', 'first_name', 'last_name', 'class_name', 'grade_level',
        [fn('COUNT', col('student_memorization_records.id')), 'record_count']
      ],
      group: ['User.id', 'User.first_name', 'User.last_name', 'User.class_name', 'User.grade_level'],
      order: [[literal('record_count'), 'DESC']],
      subQuery: false,
      limit: 5
    });

    const topPerformers = await Promise.all(topPerformersData.map(async (u: any) => {
      const progress = await progressService.calculateStudentProgress(u.id, tenantId);
      return {
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        class: u.class_name || 'Unassigned',
        memorized: `${Math.floor(progress.totalAyahs / 100)} Juz`, // Rough conversion
        accuracy: '95%', // Placeholder
        status: 'Advancing',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.first_name}`
      };
    }));

    // 3. Trend data (using memorization progress trend)
    const trendData = memorizationProgress.trend.map(t => ({
      name: t.date,
      current: t.pages,
      target: t.pages * 0.9 // Placeholder target
    }));

    return {
      stats: [
        {
          label: 'AVERAGE ATTENDANCE',
          value: `${attendanceMetrics.percentage.toFixed(1)}%`,
          trend: '+1.5% from last month', // Placeholder trend calculation
          icon: 'Calendar',
          iconColor: 'text-primary',
          bgIcon: 'bg-primary/10'
        },
        {
          label: 'MEMORIZATION PROGRESS',
          value: `${Math.round(memorizationProgress.pages_memorized)} Pages`,
          trend: '+24% velocity increase', // Placeholder
          icon: 'BookOpen',
          iconColor: 'text-blue-400',
          bgIcon: 'bg-blue-400/10'
        },
        {
          label: 'ACTIVE STUDENTS',
          value: activeStudents.monthly.toString(),
          trend: 'Across multiple levels',
          icon: 'Users',
          iconColor: 'text-primary',
          bgIcon: 'bg-primary/10'
        }
      ],
      trendData,
      topPerformers,
      reportTypes: [
        { title: 'Student Performance Report', desc: 'Individual detailed breakdown', icon: 'UserCheck', color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Class Progression Report', desc: 'Curriculum coverage analysis', icon: 'TrendingUp', color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { title: 'Daily Attendance Summary', desc: 'Presence & punctuality log', icon: 'ClipboardList', color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Teacher Evaluation', desc: 'Class instruction performance', icon: 'Presentation', color: 'text-primary', bg: 'bg-primary/10' }
      ],
      recentExports: [
        { name: 'Q3_Full_School_Report.pdf', info: 'Generated 2h ago • 4.2 MB' },
        { name: 'Hifz_A_Attendance_Oct.csv', info: 'Generated Yesterday • 120 KB' }
      ]
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get paginated students performance list
 */
export const getPaginatedStudentsReport = async (tenantId: number, page: number, limit: number, filters?: { class_name?: string, grade_level?: string }) => {
  try {
    const { offset, limit: limitVal } = getPaginationOptions(page, limit);
    const where: any = { tenant_id: tenantId, role: 'student' };
    
    if (filters?.class_name) where.class_name = filters.class_name;
    if (filters?.grade_level) where.grade_level = filters.grade_level;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: limitVal,
      offset,
      order: [['first_name', 'ASC'], ['last_name', 'ASC']]
    });

    const studentsReport = await Promise.all(rows.map(async (u) => {
      const progress = await progressService.calculateStudentProgress(u.id, tenantId);
      return {
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        class: u.class_name,
        grade: u.grade_level,
        memorizedAyahs: progress.totalAyahs,
        completionPercentage: progress.percentage,
        studentIdentifier: u.student_identifier
      };
    }));

    return formatPaginationResult(studentsReport, count, page, limit);
  } catch (error) {
    throw error;
  }
};

export const generateStudentReportCSV = async (studentId: number, tenantId: number) => {
  const data = await getStudentReport(studentId, tenantId);
  
  let csv = 'Student Report\n';
  csv += `Name,${data.student.firstName} ${data.student.lastName}\n`;
  csv += `ID,${data.student.studentIdentifier}\n`;
  csv += `Email,${data.student.email}\n\n`;
  
  csv += 'Summary\n';
  csv += `Total Sessions,${data.summary.totalSessions}\n`;
  csv += `Attendance Rate,${data.summary.attendanceRate}%\n`;
  csv += `Ayahs Memorized,${data.summary.totalAyahsMemorized}\n`;
  csv += `Completion,${data.summary.completionPercentage}%\n\n`;
  
  csv += 'Session History\n';
  csv += 'Date,Attendance,Memorization,Revision,Notes\n';
  
  data.sessions.forEach(s => {
    csv += `"${s.date}","${s.attendance}","${s.memorization}","${s.revision}","${s.notes || ''}"\n`;
  });
  
  return csv;
};

/**
 * Generate Overall Student Performance CSV
 */
export const generateOverallPerformanceCSV = async (tenantId: number, startDate: string, endDate: string) => {
  const students = await User.findAll({
    where: { tenant_id: tenantId, role: 'student' },
    attributes: ['id', 'first_name', 'last_name', 'student_identifier', 'class_name', 'grade_level'],
    order: [['first_name', 'ASC']]
  });

  let csv = 'Overall Student Performance Report\n';
  csv += `Period,${startDate} to ${endDate}\n\n`;
  csv += 'ID,Name,Class,Grade,Ayahs Memorized,Progress %,Attendance Rate %\n';

  for (const student of students) {
    const progress = await progressService.calculateStudentProgress(student.id, tenantId);
    
    // Calculate attendance rate for the period
    const attendanceMetrics = await analyticsService.getAttendanceMetrics(tenantId, startDate, endDate, { student_id: student.id });
    
    csv += `"${student.student_identifier}","${student.first_name} ${student.last_name}","${student.class_name || ''}","${student.grade_level || ''}",${progress.totalAyahs},${progress.percentage.toFixed(1)}%,${attendanceMetrics.percentage.toFixed(1)}%\n`;
  }

  return csv;
};

/**
 * Generate Overall Attendance Summary CSV
 */
export const generateOverallAttendanceCSV = async (tenantId: number, startDate: string, endDate: string) => {
  const students = await User.findAll({
    where: { tenant_id: tenantId, role: 'student' },
    attributes: ['id', 'first_name', 'last_name', 'student_identifier'],
    order: [['first_name', 'ASC']]
  });

  // Get all unique session dates in the period
  const sessions = await Session.findAll({
    where: { 
      tenant_id: tenantId,
      session_date: { [Op.between]: [startDate, endDate] }
    },
    attributes: [[fn('DISTINCT', col('session_date')), 'session_date']],
    order: [['session_date', 'ASC']],
    raw: true
  }) as any[];

  const uniqueDates = sessions.map(s => s.session_date);

  let csv = 'Overall Attendance Summary Report\n';
  csv += `Period,${startDate} to ${endDate}\n\n`;
  csv += `Student ID,Name,${uniqueDates.join(',')}\n`;

  for (const student of students) {
    let row = `"${student.student_identifier}","${student.first_name} ${student.last_name}"`;
    
    // Fetch all attendance for this student in the period
    const studentAttendance = await Session.findAll({
      where: {
        tenant_id: tenantId,
        student_id: student.id,
        session_date: { [Op.between]: [startDate, endDate] }
      },
      include: [{ model: Attendance, as: 'attendance', attributes: ['status'] }],
      raw: true,
      nest: true
    }) as any[];

    const attendanceMap = new Map(studentAttendance.map(a => [a.session_date, a.attendance?.status || 'absent']));

    uniqueDates.forEach(date => {
      row += `,${attendanceMap.get(date) || '-'}`;
    });

    csv += row + '\n';
  }

  return csv;
};

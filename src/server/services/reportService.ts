import { Session, MemorizationRecord, RevisionRecord, Attendance, Surah, User } from '../model';
import { Op } from 'sequelize';

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
          include: [{ model: Surah, as: 'surah', attributes: ['name'] }]
        }
      ],
      order: [['session_date', 'DESC']]
    });

    const totalSessions = sessions.length;
    const presentSessions = sessions.filter((s: any) => s.attendance?.status === 'present').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    const totalQuranAyahs = 6236;
    const memorizationRecords = await MemorizationRecord.findAll({
      where: { student_id: studentId, tenant_id: tenantId },
      attributes: ['surah_number', 'start_ayah', 'end_ayah']
    });

    const uniqueAyahs = new Set();
    memorizationRecords.forEach((record: any) => {
      for(let i = record.start_ayah; i <= record.end_ayah; i++) {
        uniqueAyahs.add(`${record.surah_number}-${i}`);
      }
    });
    
    const totalAyahsMemorized = uniqueAyahs.size;
    const completionPercentage = Math.round((totalAyahsMemorized / totalQuranAyahs) * 100);

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
        revision: s.revision_records.map((r: any) => `${r.surah?.name} (${r.start_ayah}-${r.end_ayah})`).join(', '),
        notes: s.notes
      }))
    };
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

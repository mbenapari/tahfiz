import { Class, ClassStudent, User, School } from '../model';
import logger from '../utils/logger';

export interface CreateClassDTO {
  tenant_id: number;
  name: string;
  slug: string;
  description?: string;
  grade_level?: string;
  instructor_id?: number;
  max_students?: number;
}

export interface UpdateClassDTO {
  name?: string;
  slug?: string;
  description?: string;
  grade_level?: string;
  instructor_id?: number;
  max_students?: number;
}

export interface AddStudentsDTO {
  class_id: number;
  student_ids: number[];
  tenant_id: number;
}

/**
 * Create a new class
 */
export const createClass = async (data: CreateClassDTO) => {
  try {
    const classRecord = await Class.create(data);
    logger.info('classService.createClass: Class created successfully', {
      classId: classRecord.id,
      tenantId: data.tenant_id
    });
    return classRecord;
  } catch (error) {
    logger.error('classService.createClass: Error creating class', {
      error: (error as Error).message
    });
    throw error;
  }
};

/**
 * Get a class by ID with students
 */
export const getClassById = async (id: number, tenantId: number) => {
  try {
    const classRecord = await Class.findOne({
      where: { id, tenant_id: tenantId },
      include: [
        {
          model: User,
          as: 'students',
          attributes: ['id', 'first_name', 'last_name', 'email', 'student_identifier'],
          through: { attributes: ['joined_on'] }
        },
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!classRecord) {
      throw new Error('Class not found');
    }

    return classRecord;
  } catch (error) {
    logger.error('classService.getClassById: Error fetching class', {
      error: (error as Error).message,
      classId: id
    });
    throw error;
  }
};

/**
 * Get all classes for a tenant
 */
export const getClassesByTenant = async (tenantId: number, options?: { includeInstructor?: boolean; includeStudents?: boolean }) => {
  try {
    const include: any[] = [];

    if (options?.includeInstructor) {
      include.push({
        model: User,
        as: 'instructor',
        attributes: ['id', 'first_name', 'last_name', 'email']
      });
    }

    if (options?.includeStudents) {
      include.push({
        model: User,
        as: 'students',
        attributes: ['id', 'first_name', 'last_name', 'email', 'student_identifier'],
        through: { attributes: [] }
      });
    }

    const classes = await Class.findAll({
      where: { tenant_id: tenantId },
      include,
      order: [['name', 'ASC']]
    });

    return classes;
  } catch (error) {
    logger.error('classService.getClassesByTenant: Error fetching classes', {
      error: (error as Error).message,
      tenantId
    });
    throw error;
  }
};

/**
 * Get classes taught by a specific instructor
 */
export const getClassesByInstructor = async (instructorId: number, tenantId: number) => {
  try {
    const classes = await Class.findAll({
      where: {
        instructor_id: instructorId,
        tenant_id: tenantId
      },
      include: [
        {
          model: User,
          as: 'students',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          through: { attributes: [] }
        }
      ],
      order: [['name', 'ASC']]
    });

    return classes;
  } catch (error) {
    logger.error('classService.getClassesByInstructor: Error fetching classes', {
      error: (error as Error).message,
      instructorId
    });
    throw error;
  }
};

/**
 * Update a class
 */
export const updateClass = async (id: number, tenantId: number, data: UpdateClassDTO) => {
  try {
    const classRecord = await getClassById(id, tenantId);
    await classRecord.update(data);

    logger.info('classService.updateClass: Class updated successfully', {
      classId: id,
      tenantId
    });

    return classRecord;
  } catch (error) {
    logger.error('classService.updateClass: Error updating class', {
      error: (error as Error).message,
      classId: id
    });
    throw error;
  }
};

/**
 * Add students to a class
 */
export const addStudentsToClass = async (classId: number, studentIds: number[], tenantId: number) => {
  try {
    // Verify class exists and belongs to tenant
    const classRecord = await getClassById(classId, tenantId);

    // Check max_students limit if set
    if (classRecord.max_students) {
      const currentCount = await ClassStudent.count({
        where: { class_id: classId }
      });

      const availableSlots = classRecord.max_students - currentCount;
      if (availableSlots < studentIds.length) {
        throw new Error(`Cannot add ${studentIds.length} students. Only ${availableSlots} slots available.`);
      }
    }

    // Verify all students exist and belong to tenant
    const students = await User.findAll({
      where: {
        id: studentIds,
        tenant_id: tenantId,
        role: 'student'
      }
    });

    if (students.length !== studentIds.length) {
      throw new Error('Some students not found or do not belong to this tenant');
    }

    // Add students to class (avoiding duplicates)
    const classStudentRecords = studentIds.map(studentId => ({
      class_id: classId,
      student_id: studentId
    }));

    await ClassStudent.bulkCreate(classStudentRecords, {
      ignoreDuplicates: true
    });

    logger.info('classService.addStudentsToClass: Students added to class', {
      classId,
      studentCount: studentIds.length,
      tenantId
    });

    return true;
  } catch (error) {
    logger.error('classService.addStudentsToClass: Error adding students', {
      error: (error as Error).message,
      classId
    });
    throw error;
  }
};

/**
 * Remove a student from a class
 */
export const removeStudentFromClass = async (classId: number, studentId: number, tenantId: number) => {
  try {
    // Verify class exists and belongs to tenant
    await getClassById(classId, tenantId);

    // Remove the student from the class
    const result = await ClassStudent.destroy({
      where: {
        class_id: classId,
        student_id: studentId
      }
    });

    if (result === 0) {
      throw new Error('Student not found in this class');
    }

    logger.info('classService.removeStudentFromClass: Student removed from class', {
      classId,
      studentId,
      tenantId
    });

    return true;
  } catch (error) {
    logger.error('classService.removeStudentFromClass: Error removing student', {
      error: (error as Error).message,
      classId,
      studentId
    });
    throw error;
  }
};

/**
 * Remove multiple students from a class
 */
export const removeStudentsFromClass = async (classId: number, studentIds: number[], tenantId: number) => {
  try {
    // Verify class exists and belongs to tenant
    await getClassById(classId, tenantId);

    // Remove the students from the class
    const result = await ClassStudent.destroy({
      where: {
        class_id: classId,
        student_id: studentIds
      }
    });

    logger.info('classService.removeStudentsFromClass: Students removed from class', {
      classId,
      studentsRemoved: result,
      tenantId
    });

    return result;
  } catch (error) {
    logger.error('classService.removeStudentsFromClass: Error removing students', {
      error: (error as Error).message,
      classId
    });
    throw error;
  }
};

/**
 * Get students in a class
 */
export const getClassStudents = async (classId: number, tenantId: number) => {
  try {
    // Verify class exists
    await getClassById(classId, tenantId);

    const classStudents = await ClassStudent.findAll({
      where: { class_id: classId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'email', 'student_identifier', 'grade_level']
        }
      ],
      order: [['joined_on', 'ASC']]
    });

    return classStudents;
  } catch (error) {
    logger.error('classService.getClassStudents: Error fetching class students', {
      error: (error as Error).message,
      classId
    });
    throw error;
  }
};

/**
 * Get student count in a class
 */
export const getClassStudentCount = async (classId: number) => {
  try {
    const count = await ClassStudent.count({
      where: { class_id: classId }
    });

    return count;
  } catch (error) {
    logger.error('classService.getClassStudentCount: Error counting students', {
      error: (error as Error).message,
      classId
    });
    throw error;
  }
};

/**
 * Delete a class (soft delete)
 */
export const deleteClass = async (id: number, tenantId: number) => {
  try {
    const classRecord = await getClassById(id, tenantId);
    await classRecord.destroy();

    logger.info('classService.deleteClass: Class deleted successfully', {
      classId: id,
      tenantId
    });

    return true;
  } catch (error) {
    logger.error('classService.deleteClass: Error deleting class', {
      error: (error as Error).message,
      classId: id
    });
    throw error;
  }
};

/**
 * Get classes for a specific student
 */
export const getStudentClasses = async (studentId: number, tenantId: number) => {
  try {
    const studentClasses = await Class.findAll({
      where: { tenant_id: tenantId },
      include: [
        {
          model: User,
          as: 'students',
          where: { id: studentId },
          through: { attributes: ['joined_on'] },
          attributes: []
        },
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    return studentClasses;
  } catch (error) {
    logger.error('classService.getStudentClasses: Error fetching student classes', {
      error: (error as Error).message,
      studentId
    });
    throw error;
  }
};

/**
 * Check if a student is in a class
 */
export const isStudentInClass = async (classId: number, studentId: number, tenantId: number) => {
  try {
    // Verify class exists
    await getClassById(classId, tenantId);

    const record = await ClassStudent.findOne({
      where: {
        class_id: classId,
        student_id: studentId
      }
    });

    return record !== null;
  } catch (error) {
    logger.error('classService.isStudentInClass: Error checking student in class', {
      error: (error as Error).message,
      classId,
      studentId
    });
    throw error;
  }
};

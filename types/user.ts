export interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'student' | 'teacher' | 'school_admin' | 'teacher_admin';
  schoolId?: string;
  academicGrade?: string;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  school?: {
    id: string;
    name: string;
  };
}

export interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'student' | 'teacher' | 'school_admin' | 'teacher_admin';
  schoolId?: string;
  academicGrade?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UserFilters {
  schoolId?: string;
  academicGrade?: string;
  status?: string;
  role?: string;
}

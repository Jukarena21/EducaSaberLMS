export interface LiveClassData {
  id: string;
  title: string;
  description?: string;
  meetingUrl: string;
  provider?: 'zoom' | 'meet' | 'teams' | 'webex' | 'other';
  startDateTime: Date | string;
  endDateTime?: Date | string;
  academicGrade?: string; // 'sexto', 'septimo', etc.
  competencyId?: string;
  moduleId?: string;
  lessonId?: string;
  schoolId?: string;
  createdById: string;
  competency?: {
    id: string;
    name: string;
    displayName?: string;
    colorHex?: string;
  };
  module?: {
    id: string;
    title: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
  school?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  invitations?: {
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      email?: string;
    };
  }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LiveClassFormData {
  title: string;
  description?: string;
  meetingUrl: string;
  provider?: 'zoom' | 'meet' | 'teams' | 'webex' | 'other';
  startDateTime: string; // ISO string
  endDateTime?: string; // ISO string
  academicGrade?: string; // 'sexto', 'septimo', etc.
  competencyId?: string;
  moduleId?: string;
  lessonId?: string;
  schoolId?: string;
}

export interface LiveClassFilters {
  search?: string;
  schoolId?: string;
  competencyId?: string;
  moduleId?: string;
  lessonId?: string;
  provider?: string;
  startDateFrom?: string;
  startDateTo?: string;
}


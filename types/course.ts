export interface CourseData {
  id: string;
  title: string;
  description: string;
  year: number; // año escolar (6, 7, 8, 9, 10, 11)
  competencyId: string;
  competency?: {
    id: string;
    name: string;
    displayName?: string;
  };
  isIcfesCourse?: boolean;
  schoolIds?: string[];
  schoolId?: string; // Deprecated: usar schools en su lugar
  school?: {
    id: string;
    name: string;
  };
  schools?: {
    id: string;
    name: string;
    type: string;
  }[];
  courseSchools?: {
    id: string;
    school: {
      id: string;
      name: string;
      type: string;
    };
  }[];
  modules?: {
    id: string;
    title: string;
    orderIndex: number;
    createdBy?: {
      id: string;
      name: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseFormData {
  title: string;
  description: string;
  year: number;
  competencyId: string;
  isIcfesCourse: boolean;
  schoolIds?: string[]; // Array de IDs de colegios/entidades (puede estar vacío para curso general)
  moduleIds: string[]; // IDs de los módulos a asociar
}

export interface CourseFilters {
  search?: string;
  schoolId?: string;
  competencyId?: string;
  year?: number;
  isIcfesCourse?: boolean;
} 
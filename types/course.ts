export interface CourseData {
  id: string;
  title: string;
  description: string;
  year: number; // año escolar (6, 7, 8, 9, 10, 11)
  competencyId: string;
  competency?: {
    id: string;
    name: string;
  };
  schoolId: string;
  school?: {
    id: string;
    name: string;
  };
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
  schoolId: string;
  moduleIds: string[]; // IDs de los módulos a asociar
}

export interface CourseFilters {
  search?: string;
  schoolId?: string;
  competencyId?: string;
  year?: number;
} 
export interface ModuleData {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // en minutos
  orderIndex: number;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  competencyId?: string;
  competency?: {
    id: string;
    name: string;
    displayName: string;
    colorHex?: string;
  };
  isIcfesModule?: boolean;
  academicGrade?: string; // 'sexto', 'septimo', etc.
  lessons?: {
    id: string;
    title: string;
    orderIndex: number;
  }[];
  courses?: {
    id: string;
    title: string;
    school?: {
      id: string;
      name: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleFormData {
  title: string;
  description: string;
  estimatedTime: number;
  competencyId?: string;
  isIcfesModule?: boolean;
  year?: number; // Año escolar (6-11) solo para módulos ICFES
  selectedLessons: Array<{
    lessonId: string;
    orderIndex: number;
  }>;
}

export interface ModuleFilters {
  search?: string;
  createdById?: string;
  competencyId?: string;
  isIcfesModule?: boolean;
} 
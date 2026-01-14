export interface LessonData {
  academicGrade?: string; // 'sexto', 'septimo', etc. (opcional, solo para lecciones ICFES)
  year?: number; // Año escolar (6-11) solo para lecciones ICFES (convertido desde academicGrade)
  id: string;
  title: string;
  description: string;
  estimatedTimeMinutes: number; // en minutos
  videoUrl?: string;
  videoDescription?: string;
  theoryContent: string; // teoría en texto
  isPublished: boolean;
  competencyId?: string | null;
  competency?: { id: string; name: string; displayName?: string } | null;
  isIcfesCourse?: boolean;
  modules: Array<{
    moduleId: string;
    moduleTitle: string;
    orderIndex: number;
    course?: {
      id: string;
      title: string;
      competency?: {
        id: string;
        name: string;
      };
    };
    competency?: {
      id: string;
      name: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonFormData {
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  videoUrl?: string;
  videoDescription?: string;
  theoryContent: string;
  competencyId?: string | null;
  isIcfesLesson?: boolean;
  year?: number; // Año escolar (6-11) solo para lecciones ICFES
}

export interface LessonFilters {
  search?: string;
  moduleId?: string;
  competencyId?: string;
  isIcfesCourse?: boolean;
}

// Tipo para lecciones en el contexto de un módulo específico
export interface ModuleLessonData {
  id: string;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  videoUrl?: string;
  videoDescription?: string;
  theoryContent: string;
  isPublished: boolean;
  orderIndex: number; // Orden específico en este módulo
  createdAt: Date;
} 
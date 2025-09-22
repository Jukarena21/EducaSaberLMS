-- =====================================================
-- ESQUEMA DE BASE DE DATOS - EDUCASABER LMS
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMERACIONES
-- =====================================================

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('student', 'school_admin', 'teacher_admin');

-- Competencias ICFES
CREATE TYPE icfes_competency AS ENUM ('lectura_critica', 'matematicas', 'sociales_ciudadanas', 'ciencias_naturales', 'ingles');

-- Grados académicos
CREATE TYPE academic_grade AS ENUM ('sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once');

-- Tipos de institución
CREATE TYPE institution_type AS ENUM ('publica', 'privada', 'otro');

-- Calendario académico
CREATE TYPE academic_calendar AS ENUM ('diurno', 'nocturno', 'ambos');

-- Tipos de examen
CREATE TYPE exam_type AS ENUM ('simulacro_completo', 'por_competencia', 'por_modulo', 'personalizado', 'diagnostico');

-- Niveles de dificultad
CREATE TYPE difficulty_level AS ENUM ('facil', 'intermedio', 'dificil');

-- Tipos de contenido
CREATE TYPE content_type AS ENUM ('video', 'teoria', 'ejercicios');

-- Estados de progreso
CREATE TYPE progress_status AS ENUM ('no_iniciado', 'en_progreso', 'completado');

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('student', 'school_admin', 'teacher_admin');

-- Competencias ICFES
CREATE TYPE icfes_competency AS ENUM ('lectura_critica', 'matematicas', 'sociales_ciudadanas', 'ciencias_naturales', 'ingles');

-- Grados académicos
CREATE TYPE academic_grade AS ENUM ('sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once');

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Usuarios (estudiantes, administradores de colegio, profesores)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    
    -- Información personal (opcional)
    date_of_birth DATE,
    gender VARCHAR(20),
    document_type VARCHAR(10),
    document_number VARCHAR(20),
    address TEXT,
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    socioeconomic_stratum INTEGER CHECK (socioeconomic_stratum BETWEEN 1 AND 6),
    housing_type VARCHAR(50),
    
    -- Información educativa (opcional)
    school_entry_year INTEGER,
    academic_average DECIMAL(3,2),
    areas_of_difficulty TEXT[], -- Array de áreas
    areas_of_strength TEXT[], -- Array de áreas
    repetition_history BOOLEAN DEFAULT FALSE,
    school_schedule VARCHAR(50),
    
    -- Condiciones especiales (opcional)
    disabilities TEXT[], -- Array de discapacidades
    special_educational_needs TEXT,
    medical_conditions TEXT,
    home_technology_access BOOLEAN,
    home_internet_access BOOLEAN,
    
    -- Métricas de plataforma
    total_platform_time_minutes INTEGER DEFAULT 0,
    sessions_started INTEGER DEFAULT 0,
    last_session_at TIMESTAMP,
    preferred_device VARCHAR(50),
    preferred_browser VARCHAR(100),
    average_session_time_minutes INTEGER DEFAULT 0,
    
    -- Relaciones
    school_id UUID, -- NULL para profesores admin
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Colegios/Instituciones
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    dane_code VARCHAR(20) UNIQUE,
    institution_type institution_type NOT NULL,
    academic_calendar academic_calendar NOT NULL,
    total_students INTEGER,
    number_of_campuses INTEGER DEFAULT 1,
    years_of_operation INTEGER,
    quality_certifications TEXT[],
    
    -- Información de ubicación
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),
    address TEXT,
    
    -- Métricas de uso
    active_students_count INTEGER DEFAULT 0,
    average_student_usage_minutes INTEGER DEFAULT 0,
    average_progress_by_competency JSONB, -- {competencia: porcentaje}
    student_retention_rate DECIMAL(5,2),
    
    -- Información de contacto
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Competencias ICFES
CREATE TABLE competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name icfes_competency UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7),
    icon_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cursos
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    competency_id UUID REFERENCES competencies(id) NOT NULL,
    academic_grade academic_grade NOT NULL,
    duration_hours INTEGER,
    difficulty_level difficulty_level DEFAULT 'intermedio',
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    
    -- Progreso calculado
    total_modules INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(competency_id, academic_grade)
);

-- Módulos
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_time_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    
    -- Progreso calculado
    total_lessons INTEGER DEFAULT 0,
    completed_lessons_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(course_id, order_index)
);

-- Lecciones
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_time_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    
    -- Contenido
    video_url VARCHAR(500),
    video_description TEXT,
    theory_content TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(module_id, order_index)
);

-- Preguntas de lección
CREATE TABLE lesson_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    order_index INTEGER NOT NULL,
    difficulty_level difficulty_level DEFAULT 'intermedio',
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(lesson_id, order_index)
);

-- Exámenes
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_type exam_type NOT NULL,
    course_id UUID REFERENCES courses(id),
    competency_id UUID REFERENCES competencies(id),
    time_limit_minutes INTEGER,
    passing_score INTEGER DEFAULT 70,
    difficulty_level difficulty_level DEFAULT 'intermedio',
    is_adaptive BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    
    -- Configuración de módulos (para exámenes personalizados)
    included_modules UUID[], -- Array de module_ids
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Preguntas de examen
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    difficulty_level difficulty_level DEFAULT 'intermedio',
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    
    -- Referencia a la lección donde se aprende
    lesson_id UUID REFERENCES lessons(id),
    lesson_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(exam_id, order_index)
);

-- =====================================================
-- TABLAS DE PROGRESO Y RESULTADOS
-- =====================================================

-- Progreso de contenido por estudiante
CREATE TABLE student_content_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    content_type content_type NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, lesson_id, content_type)
);

-- Progreso de lecciones por estudiante
CREATE TABLE student_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    status progress_status DEFAULT 'no_iniciado',
    video_completed BOOLEAN DEFAULT FALSE,
    theory_completed BOOLEAN DEFAULT FALSE,
    exercises_completed BOOLEAN DEFAULT FALSE,
    total_time_minutes INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, lesson_id)
);

-- Progreso de módulos por estudiante
CREATE TABLE student_module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    completed_lessons_count INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, module_id)
);

-- Progreso de cursos por estudiante
CREATE TABLE student_course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    completed_modules_count INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, course_id)
);

-- Resultados de exámenes
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    incorrect_answers INTEGER NOT NULL,
    time_taken_minutes INTEGER,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    is_passed BOOLEAN,
    
    -- Métricas de detección de trampa
    average_time_per_question DECIMAL(5,2),
    questions_with_very_fast_answers INTEGER DEFAULT 0,
    questions_with_identical_timing INTEGER DEFAULT 0,
    fraud_risk_score DECIMAL(3,2) DEFAULT 0,
    
    -- Resultados por competencia (para simulacros completos)
    results_by_competency JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Respuestas detalladas de exámenes
CREATE TABLE exam_question_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_result_id UUID REFERENCES exam_results(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES exam_questions(id) NOT NULL,
    selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    feedback_viewed BOOLEAN DEFAULT FALSE,
    feedback_viewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLAS DE REPORTES Y ANALÍTICAS
-- =====================================================

-- Reportes automáticos para colegios
CREATE TABLE school_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    sent_to_email VARCHAR(255)
);

-- Cache de reportes para optimización
CREATE TABLE report_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    report_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_neighborhood ON users(neighborhood);
CREATE INDEX idx_users_socioeconomic_stratum ON users(socioeconomic_stratum);

-- Índices para colegios
CREATE INDEX idx_schools_city ON schools(city);
CREATE INDEX idx_schools_institution_type ON schools(institution_type);
CREATE INDEX idx_schools_dane_code ON schools(dane_code);

-- Índices para cursos y contenido
CREATE INDEX idx_courses_competency_grade ON courses(competency_id, academic_grade);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lesson_questions_lesson_id ON lesson_questions(lesson_id);

-- Índices para exámenes
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_lesson_id ON exam_questions(lesson_id);

-- Índices para progreso
CREATE INDEX idx_student_content_progress_user_lesson ON student_content_progress(user_id, lesson_id);
CREATE INDEX idx_student_lesson_progress_user_lesson ON student_lesson_progress(user_id, lesson_id);
CREATE INDEX idx_student_module_progress_user_module ON student_module_progress(user_id, module_id);
CREATE INDEX idx_student_course_progress_user_course ON student_course_progress(user_id, course_id);

-- Índices para resultados
CREATE INDEX idx_exam_results_user_exam ON exam_results(user_id, exam_id);
CREATE INDEX idx_exam_results_completed_at ON exam_results(completed_at);
CREATE INDEX idx_exam_question_answers_result_id ON exam_question_answers(exam_result_id);

-- Índices para reportes
CREATE INDEX idx_school_reports_school_period ON school_reports(school_id, report_period_start, report_period_end);
CREATE INDEX idx_report_cache_expires ON report_cache(expires_at);

-- Índices de texto para búsquedas
CREATE INDEX idx_users_name_search ON users USING gin(to_tsvector('spanish', first_name || ' ' || last_name));
CREATE INDEX idx_courses_title_search ON courses USING gin(to_tsvector('spanish', title));
CREATE INDEX idx_lessons_title_search ON lessons USING gin(to_tsvector('spanish', title));

-- =====================================================
-- TRIGGERS Y FUNCIONES
-- =====================================================

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers de updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_content_progress_updated_at BEFORE UPDATE ON student_content_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_lesson_progress_updated_at BEFORE UPDATE ON student_lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_module_progress_updated_at BEFORE UPDATE ON student_module_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_course_progress_updated_at BEFORE UPDATE ON student_course_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar competencias ICFES
INSERT INTO competencies (name, display_name, description, color_hex, icon_name) VALUES
('lectura_critica', 'Lectura Crítica', 'Comprensión y análisis de textos', '#3B82F6', 'book-open'),
('matematicas', 'Matemáticas', 'Razonamiento cuantitativo', '#EF4444', 'calculator'),
('sociales_ciudadanas', 'Sociales y Ciudadanas', 'Ciencias sociales y competencias ciudadanas', '#10B981', 'users'),
('ciencias_naturales', 'Ciencias Naturales', 'Ciencias naturales y del medio ambiente', '#8B5CF6', 'microscope'),
('ingles', 'Inglés', 'Comprensión de lectura en inglés', '#F59E0B', 'globe');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para progreso general de estudiantes
CREATE VIEW student_overall_progress AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    s.name as school_name,
    COUNT(DISTINCT scp.course_id) as courses_enrolled,
    AVG(scp.progress_percentage) as average_progress,
    SUM(scp.total_time_minutes) as total_study_time,
    COUNT(DISTINCT er.id) as exams_taken,
    AVG(er.score) as average_exam_score
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN student_course_progress scp ON u.id = scp.user_id
LEFT JOIN exam_results er ON u.id = er.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.first_name, u.last_name, u.email, s.name;

-- Vista para métricas de colegios
CREATE VIEW school_metrics AS
SELECT 
    s.id,
    s.name,
    s.city,
    s.institution_type,
    COUNT(u.id) as total_students,
    COUNT(CASE WHEN u.last_session_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_students,
    AVG(scp.progress_percentage) as average_progress,
    AVG(er.score) as average_exam_score,
    COUNT(DISTINCT er.id) as total_exams_taken
FROM schools s
LEFT JOIN users u ON s.id = u.school_id AND u.role = 'student'
LEFT JOIN student_course_progress scp ON u.id = scp.user_id
LEFT JOIN exam_results er ON u.id = er.user_id
GROUP BY s.id, s.name, s.city, s.institution_type; 
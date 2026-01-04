// Export all instructor-related types
import type {
    Instructor,
    InstructorProfile,
    ScheduleInstructor
} from './instructor';

export type { Instructor, InstructorProfile, ScheduleInstructor };

// Class and Schedule related types
export interface ClassType {
    id: string;
    name: string;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'all';
    price?: number;
    description?: string;
    duration_minutes?: number;
}

export interface ClassSchedule {
    id: string;
    name?: string;
    day_of_week: number;
    start_time: string;
    duration_minutes: number;
    max_participants: number;
    instructor_id: string;
    instructor: ScheduleInstructor;
    class_type: ClassType;
    created_at?: string;
    updated_at?: string;
}

// Booking related types
export interface Booking {
    id: string;
    user_id: string;
    class_name: string;
    instructor: string;
    class_date: string;
    class_time: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    experience_level: string;
    special_requests?: string;
    emergency_contact?: string;
    emergency_phone?: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    created_at?: string;
}

// Modal and UI related types
export interface InstructorModalProps {
    instructor: Instructor | null;
    isOpen: boolean;
    onClose: () => void;
}

export interface InstructorLinkProps {
    instructor: Instructor;
    onOpenModal: () => void;
    className?: string;
}

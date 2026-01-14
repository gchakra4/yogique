import { supabase } from '@/shared/lib/supabase';
import { AssignmentService } from './assignment.service';
import { CapacityService } from './capacity.service';
import { ContainerService } from './container.service';
import { PackageService } from './package.service';
import { ValidationService } from './validation.service';

export const containerService = new ContainerService(supabase);
export const packageService = new PackageService(supabase);
export const assignmentService = new AssignmentService(supabase);
export const capacityService = new CapacityService(supabase);
export const validationService = new ValidationService(supabase);

export {
    AssignmentService,
    CapacityService, ContainerService,
    PackageService, ValidationService
};


/**
 * CapacityService
 * Service skeleton for capacity and availability calculations.
 */
export class CapacityService {
  async checkCapacity(assignmentId: string): Promise<{ available: boolean; remaining: number }> {
    // TODO: compute capacity based on assignment, bookings, and packages
    throw new Error('Not implemented');
  }

  async reserveSpots(assignmentId: string, count: number): Promise<void> {
    // TODO: reserve spots atomically (transactions)
    throw new Error('Not implemented');
  }

  async releaseSpots(assignmentId: string, count: number): Promise<void> {
    // TODO: release reserved spots
    throw new Error('Not implemented');
  }
}

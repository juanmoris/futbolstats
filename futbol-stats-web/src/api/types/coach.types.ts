export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  currentTeamId: string | null;
  currentTeamName: string | null;
}

export interface CoachDetail extends Omit<Coach, 'currentTeamId' | 'currentTeamName'> {
  createdAt: string;
  updatedAt: string;
  teamHistory: CoachTeamHistory[];
}

export interface CoachTeamHistory {
  id: string;
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  startDate: string;
  endDate: string | null;
}

export interface CreateCoachRequest {
  firstName: string;
  lastName: string;
  nationality?: string;
  photoUrl?: string;
  birthDate?: string;
}

export interface UpdateCoachRequest {
  firstName: string;
  lastName: string;
  nationality?: string;
  photoUrl?: string;
  birthDate?: string;
}

export interface AssignCoachToTeamRequest {
  teamId: string;
  startDate: string;
}

export interface EndAssignmentRequest {
  endDate: string;
}

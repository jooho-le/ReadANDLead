import { apiFetch, ENDPOINTS } from './config';

export type AgencyTrip = {
  id: string;
  title: string;
  operator: string;
  phone?: string;
  link?: string;
  cover?: string;
  intro?: string;
  author_note?: string;
  itinerary?: string[];
};

export async function listAgencyTrips(): Promise<AgencyTrip[]> {
  return apiFetch<AgencyTrip[]>(ENDPOINTS.agencyTrips);
}


import { api } from "./client";
import type { SchoolProfile, SchoolType, SchoolLevel, SchoolCurriculum } from "@/lib/mock/schools";

export interface GetSchoolsParams {
  search?:     string;
  type?:       SchoolType;
  level?:      SchoolLevel;
  curriculum?: SchoolCurriculum;
  city?:       string;
  page?:       number;
  page_size?:  number;
}

export interface PaginatedSchools {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  SchoolProfile[];
}

export async function getSchoolsFromApi(params: GetSchoolsParams = {}): Promise<PaginatedSchools> {
  return api.get<PaginatedSchools>("/api/v1/schools/", {
    params: params as Record<string, string | number | undefined | null>,
  });
}

export async function getSchoolFromApi(id: string): Promise<SchoolProfile> {
  return api.get<SchoolProfile>(`/api/v1/schools/${id}/`);
}

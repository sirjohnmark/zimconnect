export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  username: string;
  phone?: string;
  location: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: import("./profile").Profile | null;
}

/** Returned by every server action. `null` = initial state (no submission yet). */
export interface ActionResult {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  /** Non-error message to surface to the user (e.g. "Check your email"). */
  message?: string;
}

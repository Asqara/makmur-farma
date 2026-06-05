"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { eden } from "@/lib/eden";
import type {
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from "@/zod-schemas";

export const AUTH_QUERY_KEY = ["auth", "session"] as const;

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as Record<string, unknown>;

  if (typeof candidate.status === "number") {
    return candidate.status;
  }

  if (typeof candidate.code === "number") {
    return candidate.code;
  }

  for (const value of Object.values(candidate)) {
    if (!value || typeof value !== "object") continue;
    const nested = value as Record<string, unknown>;

    if (typeof nested.status === "number") {
      return nested.status;
    }

    if (typeof nested.code === "number") {
      return nested.code;
    }
  }

  return null;
}

/**
 * Checks whether an Eden error means the session is missing or expired.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}

/**
 * Current authenticated user/session query.
 */
export function useAuth() {
  return useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.auth.session.get();

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
    queryKey: AUTH_QUERY_KEY,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        return false;
      }

      return failureCount < 1;
    },
  });
}

/**
 * Login mutation.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await eden.api.v1.auth.login.post(input);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}

/**
 * Customer registration mutation.
 */
export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const response = await eden.api.v1.auth.register.post(input);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
  });
}

/**
 * Email verification mutation.
 */
export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (input: VerifyEmailInput) => {
      const response = await eden.api.v1.auth["verify-email"].post(input);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
  });
}

/**
 * Resend verification email mutation.
 */
export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: async (input: ResendVerificationInput) => {
      const response = await eden.api.v1.auth["resend-verification"].post(input);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
  });
}

/**
 * Logout mutation.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.auth.logout.post({});

      // 401 means the session was already expired — treat as already logged out.
      if (response.error && !isUnauthorizedError(response.error)) {
        throw response.error;
      }
    },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}

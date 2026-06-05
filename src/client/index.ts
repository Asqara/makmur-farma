import "server-only";

import { AuthClient } from "./auth";

/**
 * Makmur Farma server-side business logic entry point.
 */
export class Client {
  auth = new AuthClient();
}

export const client = new Client();

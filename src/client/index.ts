import "server-only";

import { AuthClient } from "./auth";
import { AuditLogsClient } from "./audit-logs";
import { CartClient } from "./cart";
import { CustomersClient } from "./customers";
import { DashboardClient } from "./dashboard";
import { ImportsClient } from "./imports";
import { JobsClient } from "./jobs";
import { MedicinesClient } from "./medicines";
import { NotificationsClient } from "./notifications";
import { OrdersClient } from "./orders";
import { QrisSimulatorClient } from "./qris-simulator";
import { ReportsClient } from "./reports";

/**
 * Makmur Farma server-side business logic entry point.
 */
export class Client {
  auditLogs = new AuditLogsClient();
  auth = new AuthClient();
  cart = new CartClient();
  customers = new CustomersClient();
  dashboard = new DashboardClient();
  imports = new ImportsClient();
  jobs = new JobsClient();
  medicines = new MedicinesClient();
  notifications = new NotificationsClient();
  orders = new OrdersClient();
  qrisSimulator = new QrisSimulatorClient();
  reports = new ReportsClient();
}

export const client = new Client();

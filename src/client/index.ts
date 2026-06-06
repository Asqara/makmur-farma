import "server-only";

import { AuthClient } from "./auth";
import { AuditLogsClient } from "./audit-logs";
import { CartClient } from "./cart";
import { CustomersClient } from "./customers";
import { DashboardClient } from "./dashboard";
import { ImportsClient } from "./imports";
import { InventoryWorkflowClient } from "./inventory";
import { JobsClient } from "./jobs";
import { MedicinesClient } from "./medicines";
import { NotificationsClient } from "./notifications";
import { OrdersClient } from "./orders";
import { QrisSimulatorClient } from "./qris-simulator";
import { ReportsClient } from "./reports";
import { UsersClient } from "./users";

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
  inventory = new InventoryWorkflowClient();
  jobs = new JobsClient();
  medicines = new MedicinesClient();
  notifications = new NotificationsClient();
  orders = new OrdersClient();
  qrisSimulator = new QrisSimulatorClient();
  reports = new ReportsClient();
  users = new UsersClient();
}

export const client = new Client();

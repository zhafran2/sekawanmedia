export type Role = "admin" | "approver";

export type User = {
  id: string;
  name: string;
  role: Role;
  level?: number;
  region: string;
};

export type Approval = {
  level: number;
  approverId: string;
  approverName: string;
  status: "waiting" | "approved" | "rejected";
  note?: string;
  actedAt?: string;
};

export type Booking = {
  id: string;
  region: string;
  requester: string;
  vehicleId: string;
  vehicleName: string;
  driver: string;
  type: "Angkutan Orang" | "Angkutan Barang";
  purpose: string;
  startDate: string;
  endDate: string;
  fuelPlan: number;
  kmEstimate: number;
  approvers: Approval[];
  status: "draft" | "waiting" | "approved" | "rejected";
};

export type Vehicle = {
  id: string;
  name: string;
  type: Booking["type"];
  plate: string;
  fuelPer100Km: number;
  region: string;
  ownership: "Milik Perusahaan" | "Sewa";
};

export type LogEntry = {
  id: string;
  actor: string;
  action: string;
  bookingId?: string;
  detail?: string;
  at: string;
};


import type { User, Vehicle, Booking } from "@/types/models";

export const users: User[] = [
  { id: "admin-01", name: "Aulia (Admin)", role: "admin", region: "HQ" },
  {
    id: "apr-01",
    name: "Pak Bima (Level 1)",
    role: "approver",
    level: 1,
    region: "HQ",
  },
  {
    id: "apr-02",
    name: "Bu Chandra (Level 2)",
    role: "approver",
    level: 2,
    region: "HQ",
  },
  {
    id: "apr-03",
    name: "Pak Dani (Region Sulawesi)",
    role: "approver",
    level: 1,
    region: "Sulawesi",
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "VEH-01",
    name: "Hilux 4x4",
    type: "Angkutan Barang",
    plate: "DD 8899 AA",
    fuelPer100Km: 12,
    region: "Sulawesi",
    ownership: "Milik Perusahaan",
  },
  {
    id: "VEH-02",
    name: "HiAce Commuter",
    type: "Angkutan Orang",
    plate: "B 1234 XY",
    fuelPer100Km: 10,
    region: "HQ",
    ownership: "Sewa",
  },
  {
    id: "VEH-03",
    name: "Dump Truck",
    type: "Angkutan Barang",
    plate: "DN 5555 ZZ",
    fuelPer100Km: 30,
    region: "Kalimantan",
    ownership: "Milik Perusahaan",
  },
  {
    id: "VEH-04",
    name: "SUV Operasional",
    type: "Angkutan Orang",
    plate: "DT 7788 QQ",
    fuelPer100Km: 11,
    region: "Sulawesi",
    ownership: "Milik Perusahaan",
  },
  {
    id: "VEH-05",
    name: "Pickup L300",
    type: "Angkutan Barang",
    plate: "B 7781 AO",
    fuelPer100Km: 14,
    region: "HQ",
    ownership: "Sewa",
  },
  {
    id: "VEH-06",
    name: "Minibus Cabang",
    type: "Angkutan Orang",
    plate: "L 1010 LK",
    fuelPer100Km: 9,
    region: "Jawa",
    ownership: "Milik Perusahaan",
  },
];

export const initialBookings: Booking[] = [
  {
    id: "BK-2025-001",
    region: "Sulawesi",
    requester: "User Tambang",
    vehicleId: "VEH-01",
    vehicleName: "Hilux 4x4",
    driver: "Herman",
    type: "Angkutan Barang",
    purpose: "Distribusi spare part ke pit selatan",
    startDate: "2025-12-15",
    endDate: "2025-12-16",
    fuelPlan: 60,
    kmEstimate: 150,
    approvers: [
      {
        level: 1,
        approverId: "apr-03",
        approverName: "Pak Dani (Region Sulawesi)",
        status: "approved",
        note: "Jadwalkan ulang jika hujan",
        actedAt: "2025-12-14T10:00:00Z",
      },
      {
        level: 2,
        approverId: "apr-02",
        approverName: "Bu Chandra (Level 2)",
        status: "waiting",
      },
    ],
    status: "waiting",
  },
  {
    id: "BK-2025-002",
    region: "HQ",
    requester: "Tim Finance",
    vehicleId: "VEH-02",
    vehicleName: "HiAce Commuter",
    driver: "Surya",
    type: "Angkutan Orang",
    purpose: "Kunjungan vendor",
    startDate: "2025-12-18",
    endDate: "2025-12-18",
    fuelPlan: 20,
    kmEstimate: 60,
    approvers: [
      {
        level: 1,
        approverId: "apr-01",
        approverName: "Pak Bima (Level 1)",
        status: "waiting",
      },
      {
        level: 2,
        approverId: "apr-02",
        approverName: "Bu Chandra (Level 2)",
        status: "waiting",
      },
    ],
    status: "waiting",
  },
];

export const usageByMonth = [
  { month: "Jul", trips: 12 },
  { month: "Aug", trips: 18 },
  { month: "Sep", trips: 21 },
  { month: "Oct", trips: 17 },
  { month: "Nov", trips: 24 },
  { month: "Dec", trips: 14 },
];


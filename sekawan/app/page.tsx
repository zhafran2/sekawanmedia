"use client";

import { useMemo, useState } from "react";
import type { User, Booking, LogEntry } from "@/types/models";
import { DateDisplay } from "@/components/DateDisplay";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { users, vehicles, initialBookings, usageByMonth } from "@/data/mockData";

const todayIso = new Date().toISOString().slice(0, 10);

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log-1",
      actor: "System",
      action: "Inisialisasi data demo",
      detail: "2 pemesanan, 6 kendaraan",
      at: new Date().toISOString(),
    },
  ]);
  const [period, setPeriod] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id ?? "",
    driver: "Sopir Pool",
    purpose: "Mobilisasi internal",
    startDate: todayIso,
    endDate: todayIso,
    fuelPlan: 20,
    kmEstimate: 50,
    approverL1: "apr-01",
    approverL2: "apr-02",
  });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);

  const vehicleById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [],
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (period.from && b.startDate < period.from) return false;
      if (period.to && b.endDate > period.to) return false;
      return true;
    });
  }, [bookings, period]);

  // Hitung statistik langsung dari bookings untuk memastikan selalu terupdate
  const stats = {
    approved: bookings.filter((b) => b.status === "approved").length,
    waiting: bookings.filter((b) => b.status === "waiting").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
    fuel: bookings.reduce((sum, b) => sum + b.fuelPlan, 0),
  };

  const logAction = async (entry: Omit<LogEntry, "id" | "at">) => {
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };
    setLogs((prev) => [newEntry, ...prev].slice(0, 30));

    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
    } catch (error) {
      console.error("log store skipped", error);
    }
  };

  const nextId = (count: number) =>
    `BK-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const createBooking = () => {
    if (!currentUser) return;
    const vehicle = vehicleById[form.vehicleId];
    if (!vehicle) return;
    const id = nextId(bookings.length);
    const newBooking: Booking = {
      id,
      region: vehicle.region,
      requester: currentUser.name,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      driver: form.driver,
      type: vehicle.type,
      purpose: form.purpose,
      startDate: form.startDate,
      endDate: form.endDate,
      fuelPlan: form.fuelPlan,
      kmEstimate: form.kmEstimate,
      approvers: [
        {
          level: 1,
          approverId: form.approverL1,
          approverName:
            users.find((u) => u.id === form.approverL1)?.name ?? "Level 1",
          status: "waiting",
        },
        {
          level: 2,
          approverId: form.approverL2,
          approverName:
            users.find((u) => u.id === form.approverL2)?.name ?? "Level 2",
          status: "waiting",
        },
      ],
      status: "waiting",
    };
    setBookings((prev) => [newBooking, ...prev]);
    logAction({
      actor: currentUser.name,
      action: "Input pemesanan",
      bookingId: id,
      detail: `${vehicle.name} oleh ${form.driver}`,
    });
  };

  const approverCanAct = (booking: Booking) => {
    if (!currentUser || currentUser.role !== "approver" || !currentUser.level)
      return false;
    const currentLevel = booking.approvers.find(
      (a) => a.level === currentUser.level,
    );
    if (!currentLevel || currentLevel.status !== "waiting") return false;
    // ensure previous levels approved
    return booking.approvers
      .filter((a) => a.level < currentUser.level!)
      .every((a) => a.status === "approved");
  };

  const handleDecision = (
    bookingId: string,
    decision: "approved" | "rejected",
  ) => {
    if (!currentUser) return;
    setBookings((prev) => {
      // Buat array baru untuk memastikan React mendeteksi perubahan
      const updated = prev.map((b) => {
        if (b.id !== bookingId) return b;
        
        // Update approver status untuk level yang sesuai
        const updatedApprovers = b.approvers.map((a) =>
          a.level === currentUser.level
            ? {
                ...a,
                status: decision,
                note: decision === "approved" ? "OK" : "Butuh revisi",
                actedAt: new Date().toISOString(),
              }
            : a,
        );
        
        // Hitung status booking berdasarkan semua approvers
        const hasRejected = updatedApprovers.some(
          (a) => a.status === "rejected",
        );
        const hasWaiting = updatedApprovers.some(
          (a) => a.status === "waiting",
        );
        
        // Tentukan status akhir booking
        let finalStatus: Booking["status"];
        if (hasRejected) {
          finalStatus = "rejected";
        } else if (hasWaiting) {
          finalStatus = "waiting";
        } else {
          // Semua approvers sudah approve
          finalStatus = "approved";
        }

        // Return booking baru dengan status yang sudah diupdate
        return {
          ...b,
          approvers: updatedApprovers,
          status: finalStatus,
        };
      });
      
      // Return array baru untuk memastikan React mendeteksi perubahan
      return [...updated];
    });
    
    logAction({
      actor: currentUser.name,
      action: decision === "approved" ? "Menyetujui" : "Menolak",
      bookingId,
      detail: `Level ${currentUser.level}`,
    });
  };

  const exportReport = () => {
    const headers = [
      "ID",
      "Region",
      "Kendaraan",
      "Driver",
      "Mulai",
      "Selesai",
      "BBM (L)",
      "KM Est.",
      "Status",
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.region,
      b.vehicleName,
      b.driver,
      b.startDate,
      b.endDate,
      b.fuelPlan,
      b.kmEstimate,
      b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-pemesanan-${Date.now()}.xls`;
    link.click();
  };

  const handleLogin = () => {
    const found = users.find(
      (u) =>
        u.id === loginForm.username.trim() &&
        u.password === loginForm.password.trim(),
    );
    if (!found) {
      setLoginError("Username atau password salah");
      return;
    }
    setCurrentUser(found);
    setLoginError(null);
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        actor: found.name,
        action: "Login aplikasi",
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Fleet Monitoring & Booking
            </p>
            <h1 className="text-xl font-bold text-slate-900">Login</h1>
            <p className="text-sm text-slate-600">
              Masuk dengan username (ID) dan password. Role: admin atau approver
              level 1/2.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Username (ID)
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="mis. admin-01 / apr-01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="admin123 / apr01 / apr02 / apr03"
              />
            </div>
            {loginError && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                {loginError}
              </div>
            )}
            <button
              className="w-full cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              onClick={handleLogin}
            >
              Masuk
            </button>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Demo akun: admin-01 / admin123, apr-01 / apr01, apr-02 / apr02,
            apr-03 / apr03
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <header className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Fleet Monitoring & Booking
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Pemesanan Kendaraan Tambang Nikel
          </h1>
            <p className="text-sm text-slate-600">
              Persetujuan berjenjang, log audit, export Excel, dashboard
              pemakaian.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <label className="text-xs font-semibold text-slate-500">
              Logged in sebagai
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                {currentUser.name} — {currentUser.role}
                {currentUser.level ? ` L${currentUser.level}` : ""} (
                {currentUser.region})
              </span>
              <button
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Menunggu" value={stats.waiting} tone="amber" />
          <SummaryCard label="Disetujui" value={stats.approved} tone="emerald" />
          <SummaryCard label="Ditolak" value={stats.rejected} tone="rose" />
          <SummaryCard label="Rencana BBM (L)" value={stats.fuel} tone="blue" />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Form Pemesanan (Admin)</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Wajib 2 level approval
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Kendaraan
                </label>
                <select
                  className="cursor-pointer w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehicleId: e.target.value }))
                  }
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.plate} · {v.region} · {v.ownership}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Driver
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={form.driver}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, driver: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Keperluan
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={form.purpose}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purpose: e.target.value }))
                  }
                  placeholder="Distribusi material, inspeksi, dll"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Mulai
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Selesai
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Rencana BBM (L)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.fuelPlan}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fuelPlan: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Estimasi KM
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.kmEstimate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        kmEstimate: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Approver Level 1
                </label>
                <select
                  className="cursor-pointer w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={form.approverL1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, approverL1: e.target.value }))
                  }
                >
                  {users
                    .filter((u) => u.role === "approver" && u.level === 1)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.region})
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Approver Level 2
                </label>
                <select
                  className="cursor-pointer w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={form.approverL2}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, approverL2: e.target.value }))
                  }
                >
                  {users
                    .filter((u) => u.role === "approver" && u.level === 2)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.region})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Kendaraan: {vehicles.length} • Region: HQ, Cabang, 6 Tambang
              </div>
              <button
                className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={createBooking}
                disabled={!currentUser || currentUser.role !== "admin"}
              >
                {currentUser?.role === "admin"
                  ? "Simpan Pemesanan"
                  : "Login sebagai admin untuk input"}
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold">Dashboard Pemakaian</h2>
            <div className="space-y-4">
              {usageByMonth.map((item) => {
                const max = Math.max(...usageByMonth.map((d) => d.trips));
                const width = Math.round((item.trips / max) * 100);
                return (
                  <div key={item.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{item.month}</span>
                      <span>{item.trips} trip</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
              Physical Data Model (ringkas):
              <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed">
{`[vehicle] 1---* [booking] *---* [approval]
[vehicle_log] mencatat BBM, KM, service
booking.region mengacu ke lokasi tambang/kantor`}
              </pre>
              Activity (pemesanan):
              <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed">
{`Admin -> input -> set driver & approver
Level 1 -> approve/reject -> log
Level 2 -> approve/reject -> log
Jika semua approve -> status approved`}
              </pre>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Daftar Pemesanan</h2>
              <p className="text-sm text-slate-600">
                Persetujuan berjenjang minimal 2 level. Approver hanya bisa
                bertindak saat level sebelumnya selesai.
          </p>
        </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                value={period.from}
                onChange={(e) =>
                  setPeriod((p) => ({ ...p, from: e.target.value }))
                }
                placeholder="From"
              />
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                value={period.to}
                onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
                placeholder="To"
              />
              <button
                onClick={exportReport}
                className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-500"
              >
                Export Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="py-2">ID</th>
                  <th>Kendaraan</th>
                  <th>Driver</th>
                  <th>Periode</th>
                  <th>BBM</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-slate-100 align-top hover:bg-slate-50/60"
                  >
                    <td className="py-3 font-semibold text-slate-900">{b.id}</td>
                    <td className="py-3">
                      <div className="font-medium">{b.vehicleName}</div>
                      <div className="text-xs text-slate-500">
                        {b.type} · {b.region}
                      </div>
                      <div className="text-xs text-slate-500">{b.purpose}</div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium">{b.driver}</div>
                      <div className="text-xs text-slate-500">
                        {b.requester} (requester)
                      </div>
                    </td>
                    <td className="py-3 text-xs text-slate-600">
                      {b.startDate} → {b.endDate}
                    </td>
                    <td className="py-3 text-xs text-slate-600">
                      {b.fuelPlan} L <br />
                      Est {b.kmEstimate} km
                    </td>
                    <td className="py-3">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="py-3 text-xs text-slate-700">
                      {b.approvers.map((a) => (
                        <div key={`${b.id}-approver-${a.level}`} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">
                            L{a.level}
                          </span>
                          <span>{a.approverName}</span>
                          <StatusPill status={a.status} />
                        </div>
                      ))}
                    </td>
                    <td className="py-3 text-right">
                      {approverCanAct(b) ? (
                        <div className="flex justify-end gap-2">
                          <button
                            className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                            onClick={() => handleDecision(b.id, "approved")}
                          >
                            Setujui
                          </button>
                          <button
                            className="cursor-pointer rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                            onClick={() => handleDecision(b.id, "rejected")}
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Tidak ada aksi
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold">Log Aplikasi</h2>
            <p className="text-xs text-slate-600">
              Setiap proses tercatat dan bisa disinkronkan ke MongoDB (endpoint
              /api/audit).
            </p>
            <div className="mt-3 flex flex-col gap-3 text-sm">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <DateDisplay isoString={log.at} />
                    <span className="font-semibold text-slate-600">
                      {log.actor}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{log.action}</div>
                  <div className="text-xs text-slate-600">
                    {log.bookingId ? `Booking ${log.bookingId} · ` : ""}
                    {log.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold">Ringkasan Unit</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{v.name}</div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                      {v.region}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {v.type} · {v.plate}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-600">
                    <span>BBM {v.fuelPer100Km} L/100km</span>
                    <span>{v.ownership}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </div>
    </div>
  );
}


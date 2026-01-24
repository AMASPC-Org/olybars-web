import React from "react";
import { Venue } from "../../../types/venue";
import { ReservoirGauge } from "./ReservoirGauge";
import { RefillSettings } from "./RefillSettings";

interface TreasuryManagementTabProps {
  venue: Venue;
  onUpdate: (data: Partial<Venue>) => Promise<void>;
}

export const TreasuryManagementTab: React.FC<TreasuryManagementTabProps> = ({
  venue,
  onUpdate,
}) => {
  // Mock Audit Log Data
  const auditLogs = [
    {
      id: 1,
      action: "Flash Bounty: Double Points",
      cost: -500,
      time: "12 mins ago",
    },
    {
      id: 2,
      action: "User Redemption: Free Drink",
      cost: -150,
      time: "45 mins ago",
    },
    { id: 3, action: "Manual Injection", cost: +1000, time: "2 hours ago" },
    { id: 4, action: "Weekly Allowance", cost: +500, time: "1 day ago" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          The Vault
        </h2>
        <p className="text-slate-400 text-sm">
          Manage your operational point reservoir. Points fuel your scheduled
          deals and gamification features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: The Gauge */}
        <ReservoirGauge venue={venue} />

        {/* Right Column: Settings */}
        <RefillSettings venue={venue} onUpdate={onUpdate} />
      </div>

      {/* Bottom Range: Audit Log */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Transaction Ledger</h3>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            View All
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950 font-medium">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Flow
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {auditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="bg-slate-900/50 hover:bg-slate-800/80 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-500 sm:hidden">
                        {log.time}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">{log.time}</td>
                  <td
                    className={`px-6 py-4 text-right font-mono font-bold ${log.cost > 0 ? "text-emerald-400" : "text-amber-500"}`}
                  >
                    {log.cost > 0 ? "+" : ""}
                    {log.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600 italic">
            Transactions older than 30 days are archived.
          </p>
        </div>
      </div>
    </div>
  );
};

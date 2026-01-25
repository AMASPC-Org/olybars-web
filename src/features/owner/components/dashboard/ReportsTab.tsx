import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { FormatCurrency } from "../../../../utils/formatCurrency";
import { useToast } from "../../../../components/ui/BrandedToast";
import { Venue } from "../../../../types";

interface ReportsTabProps {
  venue: Venue;
}

export default function ReportsTab({ venue }: ReportsTabProps) {
  const [selectedReportDate, setSelectedReportDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [hourlyReport, setHourlyReport] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchHourlyReport();
  }, [selectedReportDate, venue.id]);

  const fetchHourlyReport = async () => {
    const { fetchPartnerHourlyReport } =
      await import("../../../../services/userService");
    try {
      const data = await fetchPartnerHourlyReport(
        venue.id,
        new Date(selectedReportDate).getTime(),
      );
      setHourlyReport(data);
    } catch (e) {
      showToast("FAILED TO FETCH HOURLY REPORT", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white uppercase font-league leading-none">
            HOURLY ACTIVITY
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
            Heatmap of point-earning actions
          </p>
        </div>
        <input
          type="date"
          value={selectedReportDate}
          onChange={(e) => setSelectedReportDate(e.target.value)}
          className="bg-black border border-white/10 rounded-lg p-2 text-xs font-bold text-primary outline-none"
        />
      </header>

      <div className="bg-surface p-6 border border-white/10 rounded-2xl shadow-xl">
        {hourlyReport ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black mb-1">
                  Total Clock Ins
                </p>
                <p className="text-xl font-black text-white">
                  {(Object.values(hourlyReport.hourly) as any[]).reduce(
                    (acc: number, h: any) => acc + (h.clockins || 0),
                    0,
                  )}
                </p>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black mb-1">
                  Drops Allocated
                </p>
                <p className="text-xl font-black text-amber-500">
                  <FormatCurrency
                    amount={(
                      Object.values(hourlyReport.hourly) as any[]
                    ).reduce((acc: number, h: any) => acc + (h.points || 0), 0)}
                  />
                </p>
              </div>
            </div>

            {/* Simple Hourly Visualizer */}
            <div className="h-48 flex items-end gap-1 px-2 border-b border-white/10 pb-2">
              {Object.entries(hourlyReport.hourly).map(
                ([hour, data]: [string, any]) => {
                  const max = Math.max(
                    ...Object.values(hourlyReport.hourly).map(
                      (h: any) => h.clockins || 0,
                    ),
                    1,
                  );
                  const height = ((data.clockins || 0) / max) * 100;
                  return (
                    <div
                      key={hour}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      <div className="absolute -top-10 bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {data.clockins || 0} hits
                      </div>
                      <div
                        className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <span className="text-[8px] text-slate-600 mt-2 font-mono">
                        {hour}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
            <p className="text-center text-[9px] text-slate-600 italic">
              X-Axis: Hour (0-23) | Y-Axis: Live Clock Ins
            </p>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 uppercase font-black animate-pulse">
              Running Data Core...
            </p>
          </div>
        )}
      </div>

      {/* Activity Type Ledger */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          Activity Breakdown
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {hourlyReport &&
            Object.entries(hourlyReport.hourly)
              .filter(
                ([_, data]: [string, any]) =>
                  (data.clockins || 0) > 0 || (data.vibeReports || 0) > 0,
              )
              .map(([hour, data]: [string, any]) => (
                <div
                  key={hour}
                  className="bg-black/40 p-4 rounded-xl flex items-center justify-between border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-primary font-mono">
                      {hour.padStart(2, "0")}:00
                    </span>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black">
                          Clock Ins
                        </p>
                        <p className="text-sm font-black text-white">
                          {data.clockins || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black">
                          Vibes
                        </p>
                        <p className="text-sm font-black text-white">
                          {data.vibeReports || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase font-black">
                      Bonus Drops
                    </p>
                    <FormatCurrency
                      amount={data.points || 0}
                      variant="highlight"
                    />
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

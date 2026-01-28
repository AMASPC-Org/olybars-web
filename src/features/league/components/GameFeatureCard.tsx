import React from "react";
import { CheckCircle, Flame, Snowflake, Trophy } from "lucide-react";
import { Venue, GameFeature } from "../../../types";

interface GameFeatureCardProps {
  venue: Venue;
  gameFeature: GameFeature;
  onClockIn: (venueId: string, featureId: string) => void;
}

export const GameFeatureCard: React.FC<GameFeatureCardProps> = ({
  venue,
  gameFeature,
  onClockIn,
}) => {
  const isBuzzing =
    venue.status === "gushing" ||
    venue.status === "flooded" ||
    (venue.currentBuzz?.score || 0) > 70;

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-2xl border border-white/10 p-4 hover:border-primary/30 transition-all group mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-black text-white font-league uppercase leading-none mb-1 group-hover:text-primary transition-colors">
            {venue.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${isBuzzing
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-blue-500/20 text-blue-400"
                }`}
            >
              {isBuzzing ? <Flame size={10} /> : <Snowflake size={10} />}
              {venue.status.toUpperCase()}
            </span>
            {gameFeature.isLeaguePartner && (
              <span className="text-[9px] font-black bg-primary text-black px-2 py-0.5 rounded flex items-center gap-1">
                <Trophy size={10} /> LEAGUE POINTS AVAILABLE
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white leading-none font-league">
            {gameFeature.count}
          </span>
          <p className="text-[8px] text-slate-500 font-bold uppercase">Units</p>
        </div>
      </div>

      <button
        onClick={() => onClockIn(venue.id, gameFeature.id)}
        className="w-full bg-slate-900 border border-white/10 hover:border-primary/50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group/btn shadow-lg"
      >
        <span className="text-[10px] uppercase tracking-widest font-league">
          Clock In to this {gameFeature.name}
        </span>
        <CheckCircle
          size={14}
          className="text-slate-500 group-hover/btn:text-primary transition-colors"
        />
      </button>
    </div>
  );
};

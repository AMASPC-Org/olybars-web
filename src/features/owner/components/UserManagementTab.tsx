import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Trash2,
  Plus,
  Users,
  Mail,
  Clock,
  XCircle,
} from "lucide-react";
import {
  isVenueOwner,
  isSystemAdmin,
  VenueRole,
} from "../../../types/auth_schema";
import { Venue, UserProfile, VenueInvite } from "../../../types";
import {
  fetchVenueMembers,
  removeVenueMember,
} from "../../../services/venueService";
import { InviteStaffModal } from "./InviteStaffModal";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface UserManagementTabProps {
  venue: Venue;

  onUpdate: (updates: Partial<Venue>) => Promise<void>;
  currentUser: UserProfile;
}

interface VenueMember {
  uid: string;
  email: string;
  displayName?: string;
  role: VenueRole;
  photoURL?: string;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
  venue,
  onUpdate,
  currentUser,
}) => {
  const [members, setMembers] = useState<VenueMember[]>([]);
  const [invites, setInvites] = useState<VenueInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Permission Check: Strictly enforce Owner Access
  const isOwner =
    isVenueOwner(currentUser, venue.id) || isSystemAdmin(currentUser);

  useEffect(() => {
    if (!isOwner) return;

    loadMembers();

    // Subscribe to Invites
    const invitesRef = collection(db, "venues", venue.id, "invites");
    const q = query(invitesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invitesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as VenueInvite[];
        setInvites(invitesData);
      },
      (err) => {
        console.error("Error fetching invites:", err);
      },
    );

    return () => unsubscribe();
  }, [venue.id, isOwner]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchVenueMembers(venue.id);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${memberEmail} from the team?`,
      )
    )
      return;

    try {
      await removeVenueMember(venue.id, memberId);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!window.confirm("Revoke this invite? The link will no longer work."))
      return;
    try {
      await deleteDoc(doc(db, "venues", venue.id, "invites", inviteId));
    } catch (err) {
      console.error("Failed to revoke invite", err);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 rounded-2xl border border-white/5">
        <Shield className="w-12 h-12 text-slate-700 mb-4" />
        <h3 className="text-white font-bold text-lg">Access Restricted</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-md">
          Only the Venue Owner can manage team permissions and invites. Please
          contact the owner if you require changes to the team structure.
        </p>
      </div>
    );
  }

  if (isLoading && members.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
            Team & Permissions
          </h2>
          <p className="text-slate-400 text-sm">
            Manage access control for {venue.name}
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Invite New Staff
        </button>
      </div>

      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-500 px-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              Pending Invites ({invites.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-0.5">
                      {invite.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          invite.role === "manager"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {invite.role}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Expires in 48h
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Revoke Invite"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Team Section */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest">
              Active Roster
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
            {members.length} Users
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {members.map((member) => (
            <div
              key={member.uid}
              className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  {member.role === "owner" && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-black p-1 rounded-full border-2 border-slate-900">
                      <Shield className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-tight mb-1">
                    {member.displayName || member.email.split("@")[0]}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-500 font-medium">
                      {member.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    member.role === "owner"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : member.role === "manager"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}
                >
                  {member.role}
                </div>

                {member.role !== "owner" && member.uid !== currentUser.uid && (
                  <button
                    onClick={() => handleRemoveMember(member.uid, member.email)}
                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {member.role === "owner" && (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-700" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <InviteStaffModal
        venueId={venue.id}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        currentUserEmail={currentUser.email || undefined}
      />
    </div>
  );
};

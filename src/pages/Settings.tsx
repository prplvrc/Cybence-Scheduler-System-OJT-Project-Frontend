import { useEffect, useState, type FormEvent } from "react";
import { User, Bell, Shield, CheckCircle2, AlertCircle, Save, Key } from "lucide-react";
import { getUserProfile, updateProfile, updatePassword, updateNotifications } from "../api/user.api";

type Tab = "profile" | "notifications" | "security";

type SettingsProps = {
  currentUser: { id: string | number; name: string; role?: string };
  onUserUpdate?: (updatedUser: { name: string; email: string }) => void;
};

export default function Settings({ currentUser, onUserUpdate }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [profile, setProfile] = useState({
    fullName: currentUser.name,
    role: currentUser.role ?? "Employee",
    email: "",
  });

  const [notifications, setNotifications] = useState({
    push: false,
    weeklyDigest: true,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const initials = profile.fullName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await getUserProfile(currentUser.id);
        if (res.success && res.user) {
          setProfile({
            fullName: res.user.name || currentUser.name, // Fixed: Map res.user.name
            role: res.user.role || currentUser.role || "Employee",
            email: res.user.email || "",
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    if (currentUser?.id) {
      loadUserData();
    }
  }, [currentUser]);

  const showFeedback = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await updateProfile(currentUser.id, profile);
      showFeedback("Profile details updated successfully!");

      // Update parent or local state immediately
      if (res.user && onUserUpdate) {
        onUserUpdate({ name: res.user.name, email: res.user.email });
      }
    } catch (err: any) {
      showFeedback(err.response?.data?.message || "Failed to update profile.", "error");
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      showFeedback("New passwords do not match.", "error");
      return;
    }
    if (security.newPassword.length < 6) {
      showFeedback("Password must be at least 6 characters long.", "error");
      return;
    }

    try {
      await updatePassword(currentUser.id, {
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });
      showFeedback("Password changed successfully!");
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      showFeedback(err.response?.data?.message || "Failed to update password.", "error");
    }
  };

  const toggleNotification = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await updateNotifications(currentUser.id, updated);
      showFeedback("Notification preference updated!");
    } catch (err) {
      showFeedback("Failed to update notification settings.", "error");
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Password & Security", icon: Shield },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-32px)] p-6 sm:p-8 flex flex-col font-sans text-slate-800">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 font-medium">Manage your personal details, credentials, and alerts.</p>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-[#106fb8] border border-blue-100"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-[#106fb8] text-white flex items-center justify-center font-bold text-lg">
                {initials}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{profile.fullName}</h3>
                <p className="text-xs text-slate-500">{profile.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-[#106fb8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-[#106fb8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">System Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#106fb8] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0d5ca0] transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div
              onClick={() => toggleNotification("push")}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">Browser Push Notifications</p>
                <p className="text-xs text-slate-500">Get alerts for upcoming tasks and request status updates.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={() => toggleNotification("push")}
                className="w-5 h-5 accent-[#106fb8]"
              />
            </div>

            <div
              onClick={() => toggleNotification("weeklyDigest")}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">Weekly Summary Email</p>
                <p className="text-xs text-slate-500">Receive a weekly digest of completed work and schedules.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={() => toggleNotification("weeklyDigest")}
                className="w-5 h-5 accent-[#106fb8]"
              />
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                value={security.currentPassword}
                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-[#106fb8] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-[#106fb8] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                value={security.confirmPassword}
                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-[#106fb8] focus:bg-white transition"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#106fb8] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0d5ca0] transition cursor-pointer"
              >
                <Key className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
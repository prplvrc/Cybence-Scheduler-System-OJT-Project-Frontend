import { useEffect, useState, type ChangeEvent } from "react";
import {
  BadgeCheck,
  Briefcase,
  Edit3,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Save,
  X,
  Camera,
} from "lucide-react";

type ProfileFormState = {
  name: string;
  title: string;
  about: string;
  email: string;
  phone: string;
  department: string;
};

type ProfilePageProps = {
  currentUser: { id: string; name: string; role?: string };
};

const getInitialProfile = (currentUser: ProfilePageProps['currentUser']): ProfileFormState => {
  if (currentUser.role === 'Admin') {
    return {
      name: currentUser.name,
      title: 'Administrator • Cybence IT Solutions',
      about:
        'As system administrator, this account manages users, audits logs, and monitors operations across the scheduler platform.',
      email: 'admin@cybence.com',
      phone: '+63 900 123 4567',
      department: 'Administration',
    };
  }

  return {
    name: currentUser.name,
    title: 'Intern • Cybence Operations',
    about:
      `${currentUser.name} is responsible for organizing schedules, ensuring smooth coordination across teams, and maintaining reliable communication with clients. They enjoy creating order out of busy workflows and helping others stay on track.`,
    email: `${currentUser.name.toLowerCase().replace(/\s+/g, '.')}@cybence.com`,
    phone: '+63 912 345 6789',
    department: 'Operations & Scheduling',
  };
};

const stats = [
  { label: "Assignments", value: "12" },
  { label: "Attendance", value: "98%" },
  { label: "Upcoming Tasks", value: "4" },
];

export default function ProfilePage({ currentUser }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormState>(() => getInitialProfile(currentUser));
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Sync state during render if currentUser changes dynamically without unmounting
  const [prevUser, setPrevUser] = useState(currentUser);
  if (prevUser !== currentUser) {
    setPrevUser(currentUser);
    setProfileData(getInitialProfile(currentUser));
  }

  // Properly structured useEffect for cleaning up object URLs
  useEffect(() => {
    return () => {
      if (profileImage?.startsWith("blob:")) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  const initials = profileData.name
    .split(" ")
    .map((word) => word[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleFieldChange = (field: keyof ProfileFormState, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfileData(getInitialProfile(currentUser));
    setProfileImage(null);
    setIsEditing(false);
  };

  return (
    <div className="w-full min-h-[calc(100vh-32px)] p-6 sm:p-8 flex flex-col font-sans text-slate-800">
      
      {/* Main Profile Content Container */}
      <div className="flex-1 space-y-6">
        
        {/* User Identity Banner Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#106fb8] to-sky-400" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* Left side: Avatar and Basic Details */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 text-[#106fb8] flex items-center justify-center font-bold text-2xl overflow-hidden shadow-sm">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 p-1.5 bg-[#106fb8] text-white rounded-lg shadow-md cursor-pointer hover:bg-[#0d5ca0] transition">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      value={profileData.name}
                      onChange={(event) => handleFieldChange("name", event.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xl font-bold text-slate-900 outline-none focus:border-[#106fb8] focus:bg-white"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      {profileData.name}
                      <BadgeCheck className="w-5 h-5 text-[#106fb8]" />
                    </h2>
                  )}
                </div>

                {isEditing ? (
                  <input
                    value={profileData.title}
                    onChange={(event) => handleFieldChange("title", event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1 text-sm font-medium text-slate-600 outline-none focus:border-[#106fb8] focus:bg-white"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-500">{profileData.title}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-0.5 text-xs font-semibold text-[#106fb8]">
                    Active
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600">
                    Available for support
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#106fb8] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#106fb8]/30 hover:bg-[#0d5ca0] transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#106fb8]" />
                  Edit Profile
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: About & Contact Information */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">About Me</h3>
                  <p className="text-xs text-slate-500">Professional overview and account summary.</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </div>
              </div>

              {isEditing ? (
                <textarea
                  value={profileData.about}
                  onChange={(event) => handleFieldChange("about", event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm leading-relaxed text-slate-700 outline-none focus:border-[#106fb8] focus:bg-white transition resize-none"
                />
              ) : (
                <p className="text-sm leading-relaxed text-slate-600">{profileData.about}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Contact Information</h3>
                <p className="text-xs text-slate-500">Communication details and organizational team.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Email", value: profileData.email, icon: Mail, field: "email" as const },
                  { label: "Phone", value: profileData.phone, icon: Phone, field: "phone" as const },
                  { label: "Department", value: profileData.department, icon: Briefcase, field: "department" as const },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Icon className="w-3.5 h-3.5 text-[#106fb8]" />
                        {item.label}
                      </div>

                      {isEditing ? (
                        <input
                          value={item.value}
                          onChange={(event) => handleFieldChange(item.field, event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-[#106fb8]"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-800 truncate">{item.value}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Performance Snapshot Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Performance Snapshot</h3>
                <Sparkles className="w-4 h-4 text-[#106fb8]" />
              </div>

              <div className="space-y-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50"
                  >
                    <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
                    <span className="text-base font-extrabold text-slate-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
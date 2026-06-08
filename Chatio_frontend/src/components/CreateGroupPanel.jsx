import { useState } from "react";
import { ArrowLeft, Camera, Check, SearchIcon, Users } from "lucide-react";
import assets from "../assets/assets";

const CreateGroupPanel = ({ onBack, onCreate, contacts = [] }) => {
  const [step, setStep] = useState("members");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleMember = (user) => {
    setSelectedMembers((current) =>
      current.some((member) => member._id === user._id)
        ? current.filter((member) => member._id !== user._id)
        : [...current, user],
    );
  };

  const createGroup = () => {
    if (!groupName.trim()) return;
    onCreate({
      name: groupName.trim(),
      members: selectedMembers.map((member) => member._id),
      image: assets.logo_icon,
    });
  };

  const filteredContacts = searchTerm.trim()
    ? contacts.filter((contact) =>
        (contact.name || contact.fullName || "").toLowerCase().includes(searchTerm.trim().toLowerCase()),
      )
    : contacts;

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="h-16 bg-[#075e54] text-white flex items-center gap-4 px-4">
        <button type="button" onClick={step === "details" ? () => setStep("members") : onBack} title="Back" className="h-10 w-10 rounded-full grid place-items-center hover:bg-white/10">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <p className="font-semibold">New group</p>
          <p className="text-xs text-white/80">{selectedMembers.length} selected</p>
        </div>
      </div>

      {step === "members" ? (
        <>
          <div className="p-4 border-b border-emerald-100">
            <div className="rounded-full bg-[#f0f2f5] flex items-center gap-2 px-4 py-3">
              <SearchIcon className="size-4 text-[#075e54]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none text-sm flex-1"
                placeholder="Search contacts"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map((user) => {
              const selected = selectedMembers.some((member) => member._id === user._id);
              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => toggleMember(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f0f2f5]"
                >
                  <img src={user.image || user.profilePic || assets.avatar_icon} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{user.name || user.fullName}</span>
                    <span className="block text-xs text-slate-500 truncate">{user.bio}</span>
                  </span>
                  <span className={`h-5 w-5 rounded-full border grid place-items-center ${selected ? "bg-[#00a884] border-[#00a884] text-white" : "border-slate-300"}`}>
                    {selected && <Check className="size-3.5" />}
                  </span>
                </button>
              );
            })}
            {!filteredContacts.length && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No contacts found
              </div>
            )}
          </div>
          <div className="p-4">
            <button
              type="button"
              disabled={!selectedMembers.length}
              onClick={() => setStep("details")}
              className="w-full rounded-full bg-[#00a884] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" className="h-16 w-16 rounded-full bg-[#e9edef] text-[#075e54] grid place-items-center">
              <Camera className="size-6" />
            </button>
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              autoFocus
              className="flex-1 border-b border-emerald-200 py-3 outline-none focus:border-[#00a884]"
              placeholder="Group subject"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="size-4" />
            {selectedMembers.length} members selected
          </div>
          <button
            type="button"
            onClick={createGroup}
            disabled={!groupName.trim()}
            className="w-full rounded-full bg-[#00a884] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create group
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateGroupPanel;

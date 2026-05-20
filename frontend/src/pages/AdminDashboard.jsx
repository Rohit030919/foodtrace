import { useState } from "react";
import toast from "react-hot-toast";

const BASE_URL = "https://foodtrace-backend.onrender.com";

// Role-specific field definitions
const roleFields = {
  farmer: [
    { key: "farmerName",   label: "Full Name",      type: "text" },
    { key: "contact",      label: "Contact Number", type: "text" },
    { key: "aadharNo",     label: "Aadhar Number",  type: "text" },
    { key: "farmLocation", label: "Farm Location",  type: "text" },
    { key: "village",      label: "Village / Town", type: "text" },
  ],
  transporter: [
    { key: "transporterName",  label: "Full Name",          type: "text" },
    { key: "transporterPhone", label: "Phone Number",       type: "text" },
    { key: "vehicleNumber",    label: "Vehicle Number",     type: "text" },
    { key: "licenseNumber",    label: "License Number",     type: "text" },
    { key: "companyName",      label: "Company / Agency",   type: "text" },
    { key: "vehicleType",      label: "Vehicle Type",       type: "select",
      options: ["Truck", "Tempo", "Refrigerated Van", "Mini Truck", "Other"] },
  ],
  retailer: [
    { key: "retailerName",  label: "Full Name",    type: "text" },
    { key: "shopName",      label: "Shop Name",    type: "text" },
    { key: "shopAddress",   label: "Shop Address", type: "text" },
    { key: "city",          label: "City",         type: "text" },
    { key: "state",         label: "State",        type: "text" },
    { key: "retailerPhone", label: "Phone Number", type: "text" },
    { key: "gstin",         label: "GSTIN (optional)", type: "text" },
  ],
};

export default function AdminDashboard() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "farmer",
  });

  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle main form fields
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm({ ...form, [field]: value });

    // Reset profile fields when role changes
    if (field === "role") {
      setProfile({});
    }
  };

  // Handle profile fields
  const handleProfileChange = (field) => (e) => {
    setProfile({ ...profile, [field]: e.target.value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate username and password
    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!form.password.trim()) {
      toast.error("Password is required");
      return;
    }

    // Validate all role-specific fields
    const currentFields = roleFields[form.role] || [];
    for (const field of currentFields) {
      if (field.key === "gstin") continue; // GSTIN is optional
      const value = profile[field.key];
      if (!value || !value.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/addUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, profile }),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg);
        return;
      }

      toast.success("User added successfully ✅");
      setForm({ username: "", password: "", role: "farmer" });
      setProfile({});

    } catch (err) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const currentFields = roleFields[form.role] || [];

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="glass-card p-6">
        <h2 className="text-lg mb-4">Add New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Basic fields */}
          <input
            type="text"
            placeholder="Username"
            className="input-field w-full"
            value={form.username}
            onChange={handleChange("username")}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field w-full"
            value={form.password}
            onChange={handleChange("password")}
            required
          />
          <select
            className="input-field w-full"
            value={form.role}
            onChange={handleChange("role")}
          >
            <option value="farmer">Farmer</option>
            <option value="transporter">Transporter</option>
            <option value="retailer">Retailer</option>
          </select>

          {/* Divider */}
          <div className="border-t border-white/20 pt-4">
            <p className="text-sm text-white/60 mb-3">
              {form.role.charAt(0).toUpperCase() + form.role.slice(1)} Details
            </p>

            {/* Dynamic role-specific fields */}
            {currentFields.map((field) =>
              field.type === "select" ? (
                <select
                  key={field.key}
                  className="input-field w-full mb-4"
                  value={profile[field.key] || ""}
                  onChange={handleProfileChange(field.key)}
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  key={field.key}
                  type={field.type}
                  placeholder={field.label}
                  className="input-field w-full mb-4"
                  value={profile[field.key] || ""}
                  onChange={handleProfileChange(field.key)}
                />
              )
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add User"}
          </button>
        </form>
      </div>
    </div>
  );
}
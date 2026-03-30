import { useState } from "react";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "farmer",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/admin/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg);
        return;
      }

      toast.success("User added successfully ✅");

      setForm({
        username: "",
        password: "",
        role: "farmer",
      });

    } catch (err) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="glass-card p-6">
        <h2 className="text-lg mb-4">Add New User</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Username"
            className="input-field w-full"
            value={form.username}
            onChange={handleChange("username")}
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field w-full"
            value={form.password}
            onChange={handleChange("password")}
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

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-lg"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add User"}
          </button>

        </form>
      </div>
    </div>
  );
}
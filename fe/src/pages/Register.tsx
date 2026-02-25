import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const pass = formData.password;
  const passReqs = {
    uppercase: /[A-Z]/.test(pass),
    lowercase: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    symbol: /[^A-Za-z0-9]/.test(pass),
    length: pass.length >= 8,
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const hasStartedEmail = formData.email.length > 0;
  const isPhoneValid = /^[0-9]{11,}$/.test(formData.phone);
  const doPasswordsMatch = formData.password === formData.confirmPassword;
  const hasStartedConfirming = formData.confirmPassword.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isEmailValid) {
      setError("Invalid email address format.");
      return;
    }

    if (!isPhoneValid) {
      setError("Invalid phone number. It must contain a minimum of 11 digits.");
      return;
    }

    if (
      !passReqs.uppercase ||
      !passReqs.lowercase ||
      !passReqs.number ||
      !passReqs.symbol ||
      !passReqs.length
    ) {
      setError("Please satisfy all password requirements before registering.");
      return;
    }

    if (!doPasswordsMatch) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/members/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setSuccess("Account successfully created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const zodErrors = err.response.data.errors;
        const firstErrorKey = Object.keys(zodErrors)[0];
        let zErrMsg = zodErrors[firstErrorKey][0];

        if (zErrMsg.includes("Required") || zErrMsg.includes("undefined")) {
          zErrMsg = `Please provide a valid ${firstErrorKey.replace("_", " ")}.`;
        }
        setError(`Backend Error: ${zErrMsg}`);
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please check your information.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl border border-white/60 bg-white/75 p-6 shadow-2xl shadow-orange-200/70 ring-1 ring-white/60 backdrop-blur-2xl sm:p-8">
        <div className="mb-6 text-center sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Become a member
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Register for City Archive
          </h1>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            One account for borrowing books, tracking fines, and viewing your full
            history.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">
            {success}
          </div>
        )}

        <form
          onSubmit={handleRegister}
          className="grid gap-4 sm:grid-cols-2 sm:gap-5"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 sm:text-sm">
              First name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 sm:text-sm">
              Last name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 sm:text-sm">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
              placeholder="you@example.com"
            />
            {hasStartedEmail && (
              <p
                className={`mt-1 text-[11px] font-semibold sm:text-xs ${
                  isEmailValid ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {isEmailValid ? "Valid email format ✓" : "Invalid email format"}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 sm:text-sm">
                Phone number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="e.g. 09123456789"
                className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
              />
              <p
                className={`mt-1 text-[11px] sm:text-xs ${
                  isPhoneValid ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {isPhoneValid ? "✓ 11+ digits" : "Minimum 11 digits, numbers only"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 sm:text-sm">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
              placeholder="Create a strong password"
            />

            <div className="mt-2 space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-[11px] text-slate-600 shadow-inner sm:p-4 sm:text-xs">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
                Password rules
              </p>
              <ul className="space-y-0.5">
                <li className={passReqs.length ? "text-emerald-600" : ""}>
                  {passReqs.length ? "✓" : "•"} At least 8 characters
                </li>
                <li className={passReqs.uppercase ? "text-emerald-600" : ""}>
                  {passReqs.uppercase ? "✓" : "•"} One uppercase letter
                </li>
                <li className={passReqs.lowercase ? "text-emerald-600" : ""}>
                  {passReqs.lowercase ? "✓" : "•"} One lowercase letter
                </li>
                <li className={passReqs.number ? "text-emerald-600" : ""}>
                  {passReqs.number ? "✓" : "•"} One number
                </li>
                <li className={passReqs.symbol ? "text-emerald-600" : ""}>
                  {passReqs.symbol ? "✓" : "•"} One symbol (e.g. @, #, !)
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 sm:text-sm">
              Confirm password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
              placeholder="Re-enter password"
            />
            {hasStartedConfirming && (
              <p
                className={`mt-1 text-[11px] font-semibold sm:text-xs ${
                  doPasswordsMatch ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {doPasswordsMatch
                  ? "Passwords match ✓"
                  : "Passwords do not match"}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-amber-50 shadow-lg shadow-slate-900/20 transition duration-150 ease-out hover:bg-slate-800 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {loading ? "Registering..." : "Create member account"}
            </button>
          </div>
        </form>

        <div className="mt-5 text-center text-xs text-slate-600 sm:mt-6 sm:text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

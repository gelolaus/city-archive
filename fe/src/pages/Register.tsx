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
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // --- REAL-TIME VALIDATION STATES ---
  const pass = formData.password;
  const passReqs = {
    uppercase: /[A-Z]/.test(pass),
    lowercase: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    symbol: /[^A-Za-z0-9]/.test(pass),
    length: pass.length >= 8
  };
  
  // Regex strictly enforces format: text@text.text
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const hasStartedEmail = formData.email.length > 0;

  const isPhoneValid = /^[0-9]{11,}$/.test(formData.phone);
  
  const doPasswordsMatch = formData.password === formData.confirmPassword;
  const hasStartedConfirming = formData.confirmPassword.length > 0;

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // --- FRONTEND GUARDRAILS ---
    if (!isEmailValid) {
      return setError("Invalid email address format.");
    }

    if (!isPhoneValid) {
      return setError("Invalid phone number. It must contain a minimum of 11 digits.");
    }

    if (!passReqs.uppercase || !passReqs.lowercase || !passReqs.number || !passReqs.symbol || !passReqs.length) {
      return setError("Please satisfy all password requirements before registering.");
    }

    if (!doPasswordsMatch) {
      return setError("Passwords do not match. Please try again.");
    }

    // --- BACKEND EXECUTION ---
    setLoading(true);
    try {
        await api.post("/members/register", {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });

      setSuccess("Account successfully created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const zodErrors = err.response.data.errors;
        const firstErrorKey = Object.keys(zodErrors)[0];
        let zErrMsg = zodErrors[firstErrorKey][0];
        
        if (zErrMsg.includes("Required") || zErrMsg.includes("undefined")) {
          zErrMsg = `Please provide a valid ${firstErrorKey.replace('_', ' ')}.`;
        }
        setError(`Backend Error: ${zErrMsg}`);
      } else {
        setError(err.response?.data?.message || "Registration failed. Please check your information.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center' }}>Member Registration</h2>
      
      {error && <div style={{ color: '#b91c1c', marginBottom: '15px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', fontSize: '14px', lineHeight: '1.4' }}>{error}</div>}
      {success && <div style={{ color: '#15803d', marginBottom: '15px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', fontSize: '14px', lineHeight: '1.4' }}>{success}</div>}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          {/* REAL-TIME EMAIL CHECK */}
          {hasStartedEmail && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: isEmailValid ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
              {isEmailValid ? '✅ Valid email format' : '❌ Invalid email format'}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Phone Number</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required placeholder="e.g. 09123456789" style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          {/* REAL-TIME PHONE CHECK */}
          <div style={{ marginTop: '4px', fontSize: '12px', color: isPhoneValid ? '#15803d' : '#64748b' }}>
            {isPhoneValid ? '✅' : '❌'} Minimum 11 digits (numbers only)
          </div>
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          
          {/* REAL-TIME PASSWORD CHECKLIST */}
          <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: passReqs.length ? '#15803d' : '#64748b' }}>{passReqs.length ? '✅' : '❌'} At least 8 characters</div>
            <div style={{ color: passReqs.uppercase ? '#15803d' : '#64748b' }}>{passReqs.uppercase ? '✅' : '❌'} One uppercase letter</div>
            <div style={{ color: passReqs.lowercase ? '#15803d' : '#64748b' }}>{passReqs.lowercase ? '✅' : '❌'} One lowercase letter</div>
            <div style={{ color: passReqs.number ? '#15803d' : '#64748b' }}>{passReqs.number ? '✅' : '❌'} One number</div>
            <div style={{ color: passReqs.symbol ? '#15803d' : '#64748b' }}>{passReqs.symbol ? '✅' : '❌'} One symbol (e.g. @, #, !)</div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          {/* REAL-TIME MATCH CHECK */}
          {hasStartedConfirming && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: doPasswordsMatch ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
              {doPasswordsMatch ? '✅ Passwords match' : '❌ Passwords do not match'}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', marginTop: '10px' }}>
          {loading ? "Registering..." : "Create Account"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
        Already have an account? <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>Login here</Link>
      </div>
    </div>
  );
}
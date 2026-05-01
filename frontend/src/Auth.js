import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";
import bg from "./bg.png";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [verificationFile, setVerificationFile] = useState(null);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    location: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && form.password !== confirmPassword) {
  alert("Passwords do not match");
  return;
}
    if (!isLogin && form.role === "specialist" && !verificationFile) {
  alert("Please upload a certificate or proof file.");
  return;
}
    try {
      const url = isLogin
        ? "http://localhost:5000/login"
        : "http://localhost:5000/register";

      let res;

if (isLogin) {
  res = await axios.post(url, form);
} else {
  const data = new FormData();

  Object.keys(form).forEach((key) => {
    data.append(key, form[key]);
  });

  if (verificationFile) {
    data.append("verificationFile", verificationFile);
  }

  res = await axios.post(url, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (res.data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        alert(res.data);
      }
    } catch (err) {
      console.log("FULL ERROR:", err);
      console.log("BACKEND RESPONSE:", err.response);

      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Something went wrong";

      alert(msg);
    }
  };

  return (
    <div className="app" style={{ backgroundImage: `url(${bg})` }}>
      <div className="overlay">
        <div className="card">
          <div className="tabs">
            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>

            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <h2>{isLogin ? "Login" : "Register"}</h2>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                {form.role === "specialist" && (
                       <input
                       type="file"
                       accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setVerificationFile(e.target.files[0])}
                       required
                        />
                      )}

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="parent">Parent</option>
                  <option value="specialist">Specialist</option>
                </select>

                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={form.location}
                  onChange={handleChange}
                />
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {!isLogin && (
  <>
    <input
      type="password"
      placeholder="Retype Password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      required
    />

    {confirmPassword && (
      <p style={{ 
        color: form.password === confirmPassword ? "green" : "red",
        fontSize: "13px",
        marginTop: "-10px",
        marginBottom: "10px"
      }}>
        {form.password === confirmPassword
          ? "Passwords match ✔️"
          : "Passwords do not match ❌"}
      </p>
    )}
  </>
)}

            <button type="submit" className="login-btn">
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? " Register" : " Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
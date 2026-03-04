import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL + "/api";
    axios.defaults.headers.common["Accept"] = "application/json";

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }

    // ✅ Add response interceptor to handle 401 errors (expired tokens)
    const interceptor = axios.interceptors.response.use(
      (response) => response, // Pass through successful responses
      (error) => {
        // If we get a 401 Unauthorized, token has expired
        if (error.response && error.response.status === 401) {
          console.warn("Token expired or invalid - logging out automatically");

          // Clear all auth data
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("name");
          localStorage.removeItem("staff_id");

          setToken(null);
          setUser(null);

          // Redirect to login page
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }
    );

    // Cleanup: Remove interceptor when component unmounts or token changes
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("/me");
        setUser(res.data);
      } catch (err) {
        console.error("Invalid or expired token — logging out");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", user.role);
    localStorage.setItem("name", user.name);

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";
import EmailDetail from "./pages/EmailDetail";

import type { User } from "./types/user";

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser =
      localStorage.getItem("reachinbox_user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser) as User;
    } catch {
      localStorage.removeItem("reachinbox_user");
      return null;
    }
  });

  /*
   * Keep localStorage and React state synchronized.
   */
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser =
        localStorage.getItem("reachinbox_user");

      if (!savedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(savedUser) as User);
      } catch {
        localStorage.removeItem("reachinbox_user");
        setUser(null);
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  /*
   * Called after successful Google authentication.
   */
  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem(
      "reachinbox_user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);
  };

  /*
   * Logout.
   */
  const handleLogout = () => {
    localStorage.removeItem("reachinbox_user");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard
                user={user}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
  path="/emails/:id"
  element={
    user ? (
      <EmailDetail user={user} />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>

        {/* COMPOSE */}
        <Route
          path="/compose"
          element={
            user ? (
              <Compose user={user} />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* DEFAULT */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
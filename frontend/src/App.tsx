import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SignupCleanPage } from "./pages/SignupCleanPage";
import { useAuthStore } from "./store/useAuthStore";

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const user = useAuthStore((state) => state.user);
  const preferences = useAuthStore((state) => state.preferences);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const dashboardRoute = user ? (
    <DashboardPage
      onEditPreferences={() => navigate("/onboarding")}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
    />
  ) : (
    <Navigate replace to="/login" />
  );

  return (
    <Routes>
      <Route
        element={
          <LoginPage
            onSignup={() => navigate("/signup")}
            onSuccess={() => navigate("/dashboard")}
          />
        }
        path="/login"
      />
      <Route
        element={
          <SignupCleanPage
            onLogin={() => navigate("/login")}
            onSuccess={() => navigate("/onboarding")}
          />
        }
        path="/signup"
      />
      <Route
        element={
          user ? (
            <OnboardingPage
              editing={Boolean(preferences)}
              onBack={() => navigate("/dashboard")}
              onComplete={() => navigate("/dashboard")}
            />
          ) : (
            <Navigate replace to="/login" />
          )
        }
        path="/onboarding"
      />
      <Route element={dashboardRoute} path="/dashboard" />
      <Route
        element={
          <Navigate
            replace
            to={user ? (preferences ? "/dashboard" : "/onboarding") : "/login"}
          />
        }
        path="*"
      />
    </Routes>
  );
}

export default App;

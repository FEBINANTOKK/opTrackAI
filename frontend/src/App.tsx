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

  const isAuth = Boolean(user);
  const hasPreferences = Boolean(preferences);

  return (
    <Routes>
      <Route
        element={
          isAuth ? (
            <Navigate replace to={hasPreferences ? "/dashboard" : "/onboarding"} />
          ) : (
            <LoginPage
              onSignup={() => navigate("/signup")}
              onSuccess={() => navigate("/onboarding")}
            />
          )
        }
        path="/login"
      />
      <Route
        element={
          isAuth ? (
            <Navigate replace to={hasPreferences ? "/dashboard" : "/onboarding"} />
          ) : (
            <SignupCleanPage
              onLogin={() => navigate("/login")}
              onSuccess={() => navigate("/onboarding")}
            />
          )
        }
        path="/signup"
      />
      <Route
        element={
          isAuth ? (
            <OnboardingPage
              editing={hasPreferences}
              onBack={() => navigate("/dashboard")}
              onComplete={() => navigate("/dashboard")}
            />
          ) : (
            <Navigate replace to="/login" />
          )
        }
        path="/onboarding"
      />
      <Route
        element={
          isAuth ? (
            hasPreferences ? (
              <DashboardPage
                onEditPreferences={() => navigate("/onboarding")}
                onLogout={() => {
                  logout();
                  navigate("/login");
                }}
              />
            ) : (
              <Navigate replace to="/onboarding" />
            )
          ) : (
            <Navigate replace to="/login" />
          )
        }
        path="/dashboard"
      />
      <Route
        element={
          <Navigate
            replace
            to={isAuth ? (hasPreferences ? "/dashboard" : "/onboarding") : "/login"}
          />
        }
        path="*"
      />
    </Routes>
  );
}

export default App;

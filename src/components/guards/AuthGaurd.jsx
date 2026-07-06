import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function AuthGuard({ children }) {
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  // Wait until Redux initializes
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Wait for Redux to load values at least once
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // Only redirect after Redux is initialized
    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [initialized, token, user, navigate]);

  // While loading or before initialization, show nothing
  if (!initialized || !token || !user) {
    return null;
  }

  return children;
}

export default AuthGuard;

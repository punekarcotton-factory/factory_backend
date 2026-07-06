import { useRoutes } from "react-router";
import routes from "./routes";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUserFromStorage } from "./Slice/authSlice";
import SnackbarMessage from "./components/Snackabar";
import { LoadingProvider, useLoading } from "./components/hooks/useLoading";
import Loader from "./components/Loader";
import "../src/App.css";

const AppContent = () => {
  const dispatch = useDispatch();
  const { loading } = useLoading();

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  const content = useRoutes(routes);

  return (
    <>
      {loading && <Loader />}
      {content}
      <SnackbarMessage />
    </>
  );
};

const App = () => {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};

export default App;

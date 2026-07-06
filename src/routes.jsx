
import { Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import LoginProcessingPage from "./pages/LoginProcessingPage";
import AuthGuard from "./components/guards/AuthGaurd";
import Users from "./components/Users";
import DeliveryMemo from "./components/DeliveryMemo";
import CreateDeliveryMemoStage from "./components/DeliveryMemoStages/CreateDeliveryMemoStage";
import CuttingStage from "./components/DeliveryMemoStages/CuttingStage";
import PreStitcherStage from "./components/DeliveryMemoStages/PreStitcherStage";
import ReturnFabricManagement from "./components/ReturnFabricManagement";
import AdminAssignTailorStage from "./components/DeliveryMemoStages/AdminAssignTailorStage";
import KanchButtonStage from "./components/DeliveryMemoStages/KanchButtonStage";

const routes = [
  {
    path: "/login",
    element: <LoginProcessingPage />,
  },

  {
    path: "/",
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/delivery-memo",
        element: <DeliveryMemo />,
      },

      {
        path: "/delivery-memo/create-delivery-memo",
        element: <CreateDeliveryMemoStage />,
      },
      {
        path: "/delivery-memo/cutting",
        element: <CuttingStage />,
      },
      {
        path: "/delivery-memo/assign-pre-stitcher",
        element: <PreStitcherStage />,
      },
      {
        path: "/delivery-memo/admin-assign-tailor",
        element: <AdminAssignTailorStage />,
      },
      {
        path: "/delivery-memo/kanch-button",
        element: <KanchButtonStage />,
      },
        {
        path: "/returns",
        element: <ReturnFabricManagement />,
      },
    ],
  },


  {
    path: "/unauthorized",
    element: <div>Unauthorized</div>,
  },


  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
];

export default routes;

import { Box } from "@mui/material";
import { useState } from "react";
import DeliveryMemoSidebar from "./Sidebar/DeliverMemoSidebar";
import { DELIVERY_MEMO_STAGES } from "../utils/deliveryMemo";
import CreateDeliveryMemoStage from "./DeliveryMemoStages/CreateDeliveryMemoStage";
import CuttingStage from "./DeliveryMemoStages/CuttingStage";
import PreStitcherStage from "./DeliveryMemoStages/PreStitcherStage";

const DeliveryMemo = () => {
  const [activeStage, setActiveStage] = useState(
    DELIVERY_MEMO_STAGES.CREATE_DELIVERY_MEMO.key
  );

  const renderStageContent = () => {
    switch (activeStage) {
      case DELIVERY_MEMO_STAGES.CREATE_DELIVERY_MEMO.key:
        return <CreateDeliveryMemoStage />;
      case DELIVERY_MEMO_STAGES.CUTTING.key:
        return <CuttingStage />;
      case DELIVERY_MEMO_STAGES.ASSIGN_PRE_STITCHER.key:
        return <PreStitcherStage />;
      case DELIVERY_MEMO_STAGES.ADMIN_ASSIGN_TAILOR.key:
        return <Box>Admin Assign Tailor Stage - Coming Soon</Box>;
      case DELIVERY_MEMO_STAGES.KANCH_BUTTON.key:
        return <Box>Kanch Button Stage - Coming Soon</Box>;
      case DELIVERY_MEMO_STAGES.FINAL_INSPECTION.key:
        return <Box>Final Inspection Stage - Coming Soon</Box>;
      default:
        return <CreateDeliveryMemoStage />;
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >

      <DeliveryMemoSidebar
        activeStage={activeStage}
        onStageChange={setActiveStage}
      />


      <Box
        sx={{
          flex: 1,
          p: 1.5,
          overflowY: "auto",
        }}
      >
        {renderStageContent()}
      </Box>
    </Box>
  );
};

export default DeliveryMemo;

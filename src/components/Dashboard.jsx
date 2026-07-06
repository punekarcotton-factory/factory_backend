import {
  ArrowBack,
  ArrowForward,
  LocalShipping,
  Checkroom,
  RadioButtonChecked,
  Link as LinkIcon,
  ContentCut,
  Straighten,
  History,
  Inventory2Outlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Stack,
  Typography,
} from "@mui/material";
import axiosInstance from "../utils/axiosInstance";
import DeliveryMemoHistory from "../Modals/DeliveryMemoHistory";
import PrestitcherHistory from "../Modals/PrestitcherHistory";
import TailorHistory from "../Modals/TailorHistory";
import KanchButtonHistory from "../Modals/KanchButtonHistory";
import LinkFabricShirtModal from "../Modals/LinkFabricShirtModal";
import ClosedDeliveryMemoHistory from "../Modals/ClosedDeliveryMemoHistory";
import FabricReportHistory from "../Modals/FabricReportHistory";
import { useEffect, useState } from "react";
import CuttingHistory from "../Modals/Cuttinghistory";
import { useLoading } from "./hooks/useLoading";

export default function Dashboard() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const { setLoading } = useLoading();
  const [stats, setStats] = useState({
    CUTTING: { active: 0, completed: 0 },
    PRESTITCHER: { active: 0, completed: 0 },
    TAILOR: { active: 0, completed: 0 },
    KANCH_BUTTON: { active: 0, completed: 0 },
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          "/delivery-memos/stats/summary",
        );
        setStats(response.data?.data || {});
      } catch (error) {
        console.error("Failed to fetch memo stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedReport, setLoading]);

  const reportCards = [
    {
      id: "delivery-memos",
      title: "Delivery Memos",
      description: "View all delivery memos and their current stages",
      icon: LocalShipping,
    },
    {
      id: "cutting-summary",
      title: "Cutting Summary",
      description: "View cutting stage work and history",
      icon: ContentCut,
      active: stats["CUTTING"]?.active || 0,
      completed: stats["CUTTING"]?.completed || 0,
    },
    {
      id: "prestitcher-summary",
      title: "Prestitcher Summary",
      description: "View prestitcher repair history and performance",
      icon: Straighten,
      active: stats["PRESTITCHER"]?.active || 0,
      completed: stats["PRESTITCHER"]?.completed || 0,
    },
    {
      id: "tailor-summary",
      title: "Tailor Summary",
      description: "View Tailor repair history and performance",
      icon: Checkroom,
      active: stats["TAILOR"]?.active || 0,
      completed: stats["TAILOR"]?.completed || 0,
    },
    {
      id: "kanchButton-Summary",
      title: "KanchButton Summary",
      description: "View KanchButton repair history and performance",
      icon: RadioButtonChecked,
      active: stats["KANCH_BUTTON"]?.active || 0,
      completed: stats["KANCH_BUTTON"]?.completed || 0,
    },
    {
      id: "History",
      title: "History",
      description: "View all history of reports",
      icon: History,
    },
    {
      id: "fabric-reports",
      title: "Fabric Reports",
      description: "View fabric inventory, usage, damage and returns",
      icon: Inventory2Outlined,
    },
  ];

  const handleLinkSuccess = () => {
    console.log("Mapping created successfully!");
    // You can add additional logic here, like showing a success notification
  };

  if (selectedReport) {
    const currentReport = reportCards.find((r) => r.id === selectedReport);
    const IconComponent = currentReport.icon;

    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            bgcolor: "white",
            borderBottom: "1px solid #e5e7eb",
            px: 2,
            py: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              onClick={() => setSelectedReport(null)}
              startIcon={<ArrowBack />}
              sx={{ textTransform: "none", color: "#667eea" }}
            >
              Back
            </Button>

            <Box sx={{ width: "1px", height: 24, bgcolor: "#e5e7eb" }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconComponent sx={{ color: "#667eea" }} />
              <Typography variant="h6" fontWeight={600}>
                {currentReport.title}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {selectedReport === "delivery-memos" && <DeliveryMemoHistory />}
          {selectedReport === "cutting-summary" && <CuttingHistory />}
          {selectedReport === "prestitcher-summary" && <PrestitcherHistory />}
          {selectedReport === "tailor-summary" && <TailorHistory />}
          {selectedReport === "kanchButton-Summary" && <KanchButtonHistory />}
          {selectedReport === "History" && <ClosedDeliveryMemoHistory />}
          {selectedReport === "fabric-reports" && <FabricReportHistory />}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh", p: 2 }}>
      {/* Header with Link Button */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and analyze your delivery data
          </Typography>
        </Box>

        {/* Link Fabric to Shirt Button */}
        <Button
          variant="contained"
          startIcon={<LinkIcon />}
          onClick={() => setLinkModalOpen(true)}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "#667eea",
            "&:hover": {
              backgroundColor: "#5568d3",
            },
            borderRadius: "8px",
            px: 2.5,
            py: 1,
          }}
        >
          Link Fabric to Shirt
        </Button>
      </Box>

      <Stack spacing={2}>
        {reportCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card key={card.id} variant="outlined">
              <CardActionArea
                onClick={() => setSelectedReport(card.id)}
                sx={{ p: 2.5 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <IconComponent sx={{ color: "#667eea" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>{card.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </Box>

                  {card.active !== undefined && (
                    <Box sx={{ textAlign: "right", mr: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ color: "#3b82f6", lineHeight: 1 }}
                      >
                        {card.active}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "10px", textTransform: "uppercase" }}
                      >
                        Active
                      </Typography>
                    </Box>
                  )}

                  {card.completed !== undefined && (
                    <Box sx={{ textAlign: "right", mr: 2 }}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ color: "#10b981", lineHeight: 1 }}
                      >
                        {card.completed}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "10px", textTransform: "uppercase" }}
                      >
                        Closed
                      </Typography>
                    </Box>
                  )}

                  <ArrowForward sx={{ color: "#667eea" }} />
                </Box>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>

      {/* Link Fabric to Shirt Modal */}
      <LinkFabricShirtModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onSuccess={handleLinkSuccess}
      />
    </Box>
  );
}

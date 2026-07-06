import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Grid,
  Skeleton,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import { Person, Phone, Assignment } from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";
import NoResponsePage from "../pages/NoResponsePage";
import PreStitcherOpenPassesModal from "./PreStitcherOpenPassesModal";
import { CreateButton } from "../components/Styled";

export default function PrestitcherHistory() {
  const [prestitchers, setPrestitchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrestitcher, setSelectedPrestitcher] = useState(null);
  const [openPasses, setOpenPasses] = useState([]);
  const [passesLoading, setPassesLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchPrestitchers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/pre-stitchers", {
          params: { role: "PRESTITCHER" },
        });
        setPrestitchers(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch prestitchers:", error);
        setPrestitchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrestitchers();
  }, []);

  const handleViewOpenPasses = async (prestitcher) => {
    setSelectedPrestitcher(prestitcher);
    setModalOpen(true);
    try {
      setPassesLoading(true);
      const response = await axiosInstance.get(
        `/pre-stitchers/${prestitcher._id}/all-memos`
      );
      setOpenPasses(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch open passes:", error);
      setOpenPasses([]);
    } finally {
      setPassesLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPrestitcher(null);
    setOpenPasses([]);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton 
                variant="rectangular" 
                height={200} 
                sx={{ borderRadius: "12px" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!prestitchers.length) {
    return (
      <Box sx={{ p: 2 }}>
        <NoResponsePage />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2.5} mt={2}>
          {prestitchers.map((prestitcher) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={prestitcher.employeeId}>
              <Card
                sx={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  height: "100%",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box sx={{ p: 2.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "16px", mb: 1 }}>
                    {prestitcher.firstName} {prestitcher.lastName}
                    {prestitcher.isActive === false && (
                      <Chip
                        label="Deactivated"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "10px",
                          ml: 1,
                          bgcolor: "#fee2e2",
                          color: "#ef4444",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Typography>

                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: "8px",
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
                      <Person sx={{ fontSize: 16, color: "#6b7280" }} />
                      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                        {prestitcher.email}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Phone sx={{ fontSize: 16, color: "#6b7280" }} />
                      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                        {prestitcher.phone}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Assignment sx={{ fontSize: 18 }} />}
                    onClick={() => handleViewOpenPasses(prestitcher)}
                    sx={{
                      mt: 1,
                      textTransform: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                      py: 1,
                    }}
                  >
                    View Memos
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <PreStitcherOpenPassesModal
        modalOpen={modalOpen}
        handleCloseModal={handleCloseModal}
        selectedPrestitcher={selectedPrestitcher}
        openPasses={openPasses}
        passesLoading={passesLoading}
      />
    </>
  );
}
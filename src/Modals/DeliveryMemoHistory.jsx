import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Grid,
  Skeleton,
  Typography,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
import { InfoOutlined, Palette } from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";
import NoResponsePage from "../pages/NoResponsePage";
import ViewInfoModal from "./ViewInfoModal";

export default function DeliveryMemoHistory() {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/delivery-memos");
        setMemos(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch delivery memos:", error);
        setMemos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, []);

  const handleOpenModal = (memo) => {
    setSelectedMemo(memo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMemo(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton
                variant="rectangular"
                height={220}
                sx={{ borderRadius: "8px" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!memos.length) {
    return (
      <Box sx={{ p: 3 }}>
        <NoResponsePage />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {memos.map((memo) => {
            const uniqueColors = [
              ...new Set(memo.items?.map((item) => item.fabricColor) || []),
            ];
            const itemCount = memo.items?.length || 0;
            const totalAllocated = (
              memo.items?.reduce((sum, item) => {
                const dhap = parseFloat(item.dhap) || 0;
                const fold = parseFloat(item.fold) || 0;
                return sum + dhap * fold;
              }, 0) ?? 0
            ).toFixed(2);

            return (
              <Grid item xs={12} sm={6} md={4} lg={4} key={memo.deliveryMemoId}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    backgroundColor: "#ffffff",
                    minWidth: "280px",
                    minHeight: "320px",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        mb: 1,
                        pb: 1,
                        borderBottom: "2px solid #e5e7eb",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "15px",
                            color: "#111827",
                          }}
                        >
                          {memo.items?.[0]?.fabricSKU || "N/A"} - {memo.items?.[0]?.fabricTitle|| "N/A"}
                        </Typography>
                        <Chip
                          label={
                            itemCount === 1 ? "1 Item" : `${itemCount} Items`
                          }
                          size="small"
                          sx={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            fontWeight: 600,
                            fontSize: "11px",
                            height: "22px",
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "#6b7280",
                        }}
                      >
                        {new Date(memo.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Typography>
                    </Box>

                    {/* Content Section */}
                    <Box
                      sx={{
                        mb: 2,
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Colors */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: "#6b7280",
                            fontWeight: 600,
                            mb: 0.5,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Colors
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          {uniqueColors.slice(0, 3).map((color, idx) => (
                            <Chip
                              key={idx}
                              icon={<Palette sx={{ fontSize: 14 }} />}
                              label={color}
                              size="small"
                              sx={{
                                fontSize: "11px",
                                height: "22px",
                                backgroundColor: "#f3f4f6",
                                "& .MuiChip-icon": {
                                  fontSize: 14,
                                },
                              }}
                            />
                          ))}
                          {uniqueColors.length > 3 && (
                            <Chip
                              label={`+${uniqueColors.length - 3}`}
                              size="small"
                              sx={{
                                fontSize: "11px",
                                height: "22px",
                                backgroundColor: "#f3f4f6",
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Memo Information */}
                      <Box
                        sx={{
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          p: 1.5,
                          flexGrow: 1,
                        }}
                      >
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "#6b7280",
                              fontWeight: 600,
                              mb: 0.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Total Allocated
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#059669",
                            }}
                          >
                            {totalAllocated} m
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "#6b7280",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              mb: 0.5,
                            }}
                          >
                            Stage
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {memo.stage?.replace(/_/g, " ") || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Action Button */}
                    <Box
                      sx={{
                        flexShrink: 0,
                      }}
                    >
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleOpenModal(memo)}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          height: "32px",
                          py: 0.5,
                          borderColor: "#667eea",
                          color: "#667eea",
                          "&:hover": {
                            borderColor: "#667eea",
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                          },
                        }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <ViewInfoModal
        open={modalOpen}
        onClose={handleCloseModal}
        selectedMemo={selectedMemo}
      />
    </>
  );
}

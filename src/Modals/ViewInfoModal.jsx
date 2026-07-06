import { Close } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Modal,
  Typography,
  Divider,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { resolveImageUrl } from "../config";

export default function ViewInfoModal({ open, onClose, selectedMemo }) {
  const [stageHistory, setStageHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStageHistory = async () => {
      if (!selectedMemo?.deliveryMemoId || !open) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/delivery-memo-stage-history/${selectedMemo.deliveryMemoId}`,
        );

        setStageHistory(response.data?.data || response.data || []);
      } catch (error) {
        console.error("Error fetching stage history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStageHistory();
  }, [selectedMemo?.deliveryMemoId, open]);

  const formatStageLabel = (stage) => {
    return stage.replace(/_/g, " ");
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Helper function to check if metadata has meaningful content
  const hasMetadataContent = (metadata, stage) => {
    if (!metadata || Object.keys(metadata).length === 0) return false;

    if (stage === "CREATE_DELIVERY_MEMO") {
      return (
        metadata.itemCount ||
        metadata.memoTotalDhapFold ||
        (metadata.items && metadata.items.length > 0)
      );
    }

    if (stage === "PRE_STITCHER_ASSIGNED") {
      return metadata.assignments && metadata.assignments.length > 0;
    }

    if (stage === "CUTTING" || stage === "ASSIGN_PRE_STITCHER") {
      return metadata.itemCount || metadata.previousStage;
    }

    if (stage === "SHIRT_DETAILS_ADDED" || stage === "SHIRT_DETAILS_UPDATED") {
      return metadata.shirtDetails || metadata.changes;
    }

    if (stage === "TAILOR_WORK_COMPLETED") {
      return metadata.tailorName || metadata.tailorPhone || metadata.itemCount;
    }

    if (stage === "KANCH_BUTTON") {
      return (
        metadata.previousStage || metadata.tailorName || metadata.itemCount
      );
    }

    // ADD THESE NEW CASES FOR PARTIAL COMPLETION
    if (stage === "PRE_STITCHER_PARTIAL_HANDOVER") {
      return (
        metadata.completedItems ||
        metadata.totalShirtsHandedOver ||
        metadata.preStitcherName
      );
    }

    if (stage === "PRE_STITCHER_COMPLETED") {
      return (
        metadata.completedItems ||
        metadata.totalShirtsHandedOver ||
        metadata.optionProgress
      );
    }

    if (stage === "PRE_STITCHER_HANDOVER_RECEIVED") {
      return metadata.totalShirtsReceived || metadata.notes;
    }

    return false;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", sm: "90%", md: "85%" },
          maxWidth: 1100,
          bgcolor: "background.paper",
          boxShadow:
            "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
          borderRadius: "12px",
          maxHeight: { xs: "95vh", sm: "90vh" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography
              sx={{
                fontSize: { xs: "16px", sm: "20px" },
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Delivery Memo Details
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              bgcolor: "#f9fafb",
              "&:hover": { bgcolor: "#f3f4f6" },
              flexShrink: 0,
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {selectedMemo && (
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              overflow: "auto",
              flex: 1,
            }}
          >
            {selectedMemo.items?.map((item, idx) => (
              <Box key={idx}>
                {/* Item Header with Image */}
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    {/* Image on Left */}
                    {item.imageUrl && (
                      <Grid item xs={12} sm={4} md={3}>
                        <Box
                          component="img"
                          src={resolveImageUrl(item.imageUrl)}
                          alt={item.fabricTitle}
                          sx={{
                            width: "100%",
                            height: { xs: 180, sm: 200 },
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      </Grid>
                    )}

                    {/* Details on Right */}
                    <Grid
                      item
                      xs={12}
                      sm={item.imageUrl ? 8 : 12}
                      md={item.imageUrl ? 9 : 12}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: { xs: "18px", sm: "22px" },
                            fontWeight: 600,
                            color: "#111827",
                            mb: 1,
                          }}
                        >
                          {item.fabricTitle}
                        </Typography>

                        {/* Quick Info Cards */}
                        <Grid container spacing={1.5}>
                          <Grid item xs={6} sm={3}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "#f9fafb",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "10px",
                                  color: "#6b7280",
                                  mb: 0.5,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                SKU
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: { xs: "11px", sm: "12px" },
                                  fontWeight: 600,
                                  color: "#111827",
                                  fontFamily: "monospace",
                                }}
                              >
                                {item.fabricSKU}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "#f9fafb",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "10px",
                                  color: "#6b7280",
                                  mb: 0.5,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Color
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: { xs: "11px", sm: "12px" },
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
                                {item.fabricColor}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "#f9fafb",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "10px",
                                  color: "#6b7280",
                                  mb: 0.5,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Dhap
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: { xs: "11px", sm: "12px" },
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
                                {item.dhap}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "#f9fafb",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "10px",
                                  color: "#6b7280",
                                  mb: 0.5,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Fold
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: { xs: "11px", sm: "12px" },
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
                                {item.fold}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Current Stage & Created Info */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#f0f9ff",
                        borderRadius: "8px",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "#0369a1",
                          mb: 0.5,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontWeight: 600,
                        }}
                      >
                        Current Stage
                      </Typography>
                      <Chip
                        label={formatStageLabel(selectedMemo.stage || "N/A")}
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          bgcolor: "#0284c7",
                          color: "#ffffff",
                          textTransform: "capitalize",
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "#6b7280",
                          mb: 0.5,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontWeight: 600,
                        }}
                      >
                        Created
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {selectedMemo.createdAt
                          ? formatDateTime(selectedMemo.createdAt).date +
                            " at " +
                            formatDateTime(selectedMemo.createdAt).time
                          : "N/A"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3 }} />

                {/* Stage Timeline */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                      mb: 2,
                    }}
                  >
                    📋 Stage Timeline
                  </Typography>

                  {loading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 4,
                      }}
                    >
                      <CircularProgress size={32} sx={{ color: "#6b7280" }} />
                    </Box>
                  ) : stageHistory.length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: { xs: 1.5, sm: 2 },
                      }}
                    >
                      {stageHistory.map((stage, index) => {
                        const dateTime = formatDateTime(stage.enteredAt);
                        const metadata = stage.metadata;
                        const showMetadata = hasMetadataContent(
                          metadata,
                          stage.stage,
                        );

                        return (
                          <Box
                            key={index}
                            sx={{
                              position: "relative",
                              pl: { xs: 3, sm: 4 },
                              pb:
                                index < stageHistory.length - 1
                                  ? { xs: 1, sm: 1.5 }
                                  : 0,
                              borderLeft:
                                index < stageHistory.length - 1
                                  ? "2px solid #e5e7eb"
                                  : "none",
                            }}
                          >
                            {/* Timeline Dot */}
                            <Box
                              sx={{
                                position: "absolute",
                                left: { xs: "-7px", sm: "-8px" },
                                top: { xs: "3px", sm: "4px" },
                                width: { xs: "12px", sm: "14px" },
                                height: { xs: "12px", sm: "14px" },
                                borderRadius: "50%",
                                bgcolor: "#111827",
                                border: "3px solid #ffffff",
                                boxShadow: "0 0 0 2px #e5e7eb",
                              }}
                            />

                            {/* Stage Content Card */}
                            <Box
                              sx={{
                                p: { xs: 1.5, sm: 2 },
                                bgcolor: "#ffffff",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                },
                              }}
                            >
                              {/* Stage Header */}
                              <Box
                                sx={{
                                  mb: showMetadata ? { xs: 1, sm: 1.5 } : 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: { xs: "13px", sm: "14px" },
                                    fontWeight: 600,
                                    color: "#111827",
                                    textTransform: "capitalize",
                                    mb: 0.5,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {formatStageLabel(stage.stage)}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: { xs: "11px", sm: "12px" },
                                    color: "#6b7280",
                                    mb: 0.5,
                                  }}
                                >
                                  {dateTime.date} at {dateTime.time}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: { xs: "10px", sm: "11px" },
                                    color: "#9ca3af",
                                  }}
                                >
                                  By:{" "}
                                  {stage.performedByName ||
                                    stage.performedBy ||
                                    "Unknown"}
                                </Typography>
                              </Box>

                              {/* Metadata Section */}
                              {showMetadata && (
                                <Box
                                  sx={{
                                    mt: { xs: 1, sm: 1.5 },
                                    pt: { xs: 1, sm: 1.5 },
                                    borderTop: "1px solid #f3f4f6",
                                  }}
                                >
                                  {/* CREATE_DELIVERY_MEMO metadata */}
                                  {stage.stage === "CREATE_DELIVERY_MEMO" && (
                                    <Box>
                                      <Grid container spacing={1.5}>
                                        {metadata.itemCount && (
                                          <Grid item xs={6} sm={4}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Item Count
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: {
                                                  xs: "12px",
                                                  sm: "13px",
                                                },
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.itemCount}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.memoTotalDhapFold && (
                                          <Grid item xs={6} sm={4}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Total Dhap × Fold
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: {
                                                  xs: "12px",
                                                  sm: "13px",
                                                },
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.memoTotalDhapFold} m
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>
                                      {metadata.items &&
                                        metadata.items.length > 0 && (
                                          <Box sx={{ mt: 1.5 }}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 1,
                                              }}
                                            >
                                              Item Details
                                            </Typography>
                                            {metadata.items.map((item, i) => (
                                              <Box
                                                key={i}
                                                sx={{
                                                  p: 1.5,
                                                  bgcolor: "#f9fafb",
                                                  borderRadius: "4px",
                                                  mb: 1,
                                                }}
                                              >
                                                <Grid container spacing={1}>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      SKU
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        fontFamily: "monospace",
                                                      }}
                                                    >
                                                      {item.fabricSKU}
                                                    </Typography>
                                                  </Grid>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Dhap
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.dhap}
                                                    </Typography>
                                                  </Grid>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Fold
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.fold}
                                                    </Typography>
                                                  </Grid>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Total
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.totalDhapFold}
                                                    </Typography>
                                                  </Grid>
                                                </Grid>
                                              </Box>
                                            ))}
                                          </Box>
                                        )}
                                    </Box>
                                  )}
                                  {/* PRE_STITCHER_ASSIGNED metadata */}
                                  {stage.stage === "PRE_STITCHER_ASSIGNED" &&
                                    metadata.assignments && (
                                      <Box>
                                        <Grid
                                          container
                                          spacing={1.5}
                                          sx={{ mb: 1.5 }}
                                        >
                                          {metadata.assignmentType && (
                                            <Grid item xs={12} sm={6}>
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  color: "#6b7280",
                                                  mb: 0.5,
                                                }}
                                              >
                                                Assignment Type
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "12px",
                                                  fontWeight: 600,
                                                  color: "#111827",
                                                  textTransform: "capitalize",
                                                }}
                                              >
                                                {metadata.assignmentType?.replace(
                                                  /_/g,
                                                  " ",
                                                )}
                                              </Typography>
                                            </Grid>
                                          )}
                                          {metadata.totalShirtQuantity && (
                                            <Grid item xs={12} sm={6}>
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  color: "#6b7280",
                                                  mb: 0.5,
                                                }}
                                              >
                                                Total Shirts
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "12px",
                                                  fontWeight: 600,
                                                  color: "#111827",
                                                }}
                                              >
                                                {metadata.totalShirtQuantity}
                                              </Typography>
                                            </Grid>
                                          )}
                                        </Grid>

                                        <Typography
                                          sx={{
                                            fontSize: "10px",
                                            color: "#6b7280",
                                            mb: 1,
                                          }}
                                        >
                                          Assignments
                                        </Typography>
                                        {metadata.assignments.map(
                                          (assignment, i) => (
                                            <Box
                                              key={i}
                                              sx={{
                                                p: 1.5,
                                                bgcolor: "#f9fafb",
                                                borderRadius: "4px",
                                                mb: 1,
                                              }}
                                            >
                                              {assignment.options &&
                                                assignment.options.length >
                                                  0 && (
                                                  <Box sx={{ mb: 1 }}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                        mb: 0.5,
                                                      }}
                                                    >
                                                      Options:
                                                    </Typography>
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 0.75,
                                                      }}
                                                    >
                                                      {assignment.options.map(
                                                        (opt, j) => (
                                                          <Box
                                                            key={j}
                                                            sx={{
                                                              px: 1.5,
                                                              py: 0.5,
                                                              bgcolor:
                                                                "#ffffff",
                                                              borderRadius:
                                                                "4px",
                                                              border:
                                                                "1px solid #e5e7eb",
                                                            }}
                                                          >
                                                            <Typography
                                                              sx={{
                                                                fontSize:
                                                                  "11px",
                                                                fontWeight: 600,
                                                              }}
                                                            >
                                                              {opt.option}:{" "}
                                                              {opt.quantity}
                                                            </Typography>
                                                          </Box>
                                                        ),
                                                      )}
                                                    </Box>
                                                  </Box>
                                                )}
                                            </Box>
                                          ),
                                        )}
                                      </Box>
                                    )}

                                  {/* PRE_STITCHER_PARTIAL_HANDOVER metadata */}
                                  {stage.stage ===
                                    "PRE_STITCHER_PARTIAL_HANDOVER" && (
                                    <Box>
                                      <Grid
                                        container
                                        spacing={1.5}
                                        sx={{ mb: 2 }}
                                      >
                                        {metadata.preStitcherName && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Pre-Stitcher
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.preStitcherName}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.handoverNumber && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Handover #
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.handoverNumber}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {/* Completed Items */}
                                      {metadata.completedItems &&
                                        metadata.completedItems.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 1,
                                              }}
                                            >
                                              Items Handed Over
                                            </Typography>
                                            <Box
                                              sx={{
                                                p: 1.5,
                                                bgcolor: "#fef3c7",
                                                borderRadius: "4px",
                                                border: "1px solid #fbbf24",
                                              }}
                                            >
                                              {metadata.completedItems.map(
                                                (item, i) => (
                                                  <Box
                                                    key={i}
                                                    sx={{
                                                      display: "flex",
                                                      justifyContent:
                                                        "space-between",
                                                      mb:
                                                        i <
                                                        metadata.completedItems
                                                          .length -
                                                          1
                                                          ? 1
                                                          : 0,
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: "#92400e",
                                                      }}
                                                    >
                                                      {item.option}
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: "#92400e",
                                                      }}
                                                    >
                                                      {item.completedQuantity}{" "}
                                                      shirts
                                                    </Typography>
                                                  </Box>
                                                ),
                                              )}
                                            </Box>
                                          </Box>
                                        )}

                                      {/* Total Handed Over */}
                                      <Box
                                        sx={{
                                          p: 1.5,
                                          bgcolor: "#eff6ff",
                                          borderRadius: "4px",
                                          border: "1px solid #bfdbfe",
                                          mb: 2,
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontSize: "10px",
                                            color: "#1e40af",
                                            mb: 0.5,
                                          }}
                                        >
                                          Total Shirts Handed Over
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontSize: "16px",
                                            fontWeight: 700,
                                            color: "#1e40af",
                                          }}
                                        >
                                          {metadata.totalShirtsHandedOver}
                                        </Typography>
                                      </Box>

                                      {/* Progress Status */}
                                      {metadata.optionProgress &&
                                        metadata.optionProgress.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 1,
                                              }}
                                            >
                                              Current Progress
                                            </Typography>
                                            {metadata.optionProgress.map(
                                              (progress, i) => (
                                                <Box
                                                  key={i}
                                                  sx={{
                                                    p: 1.5,
                                                    bgcolor: "#f9fafb",
                                                    borderRadius: "4px",
                                                    mb: 1,
                                                    border: "1px solid #e5e7eb",
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontSize: "11px",
                                                      fontWeight: 600,
                                                      mb: 0.5,
                                                    }}
                                                  >
                                                    {progress.option}
                                                  </Typography>
                                                  <Grid container spacing={1}>
                                                    <Grid item xs={4}>
                                                      <Typography
                                                        sx={{
                                                          fontSize: "9px",
                                                          color: "#6b7280",
                                                        }}
                                                      >
                                                        Completed
                                                      </Typography>
                                                      <Typography
                                                        sx={{
                                                          fontSize: "11px",
                                                          fontWeight: 600,
                                                          color: "#16a34a",
                                                        }}
                                                      >
                                                        {
                                                          progress.completedQuantity
                                                        }
                                                        /
                                                        {progress.totalQuantity}
                                                      </Typography>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                      <Typography
                                                        sx={{
                                                          fontSize: "9px",
                                                          color: "#6b7280",
                                                        }}
                                                      >
                                                        In Progress
                                                      </Typography>
                                                      <Typography
                                                        sx={{
                                                          fontSize: "11px",
                                                          fontWeight: 600,
                                                          color: "#ea580c",
                                                        }}
                                                      >
                                                        {
                                                          progress.inProgressQuantity
                                                        }
                                                      </Typography>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                      <Typography
                                                        sx={{
                                                          fontSize: "9px",
                                                          color: "#6b7280",
                                                        }}
                                                      >
                                                        Progress
                                                      </Typography>
                                                      <Typography
                                                        sx={{
                                                          fontSize: "11px",
                                                          fontWeight: 600,
                                                        }}
                                                      >
                                                        {Math.round(
                                                          (progress.completedQuantity /
                                                            progress.totalQuantity) *
                                                            100,
                                                        )}
                                                        %
                                                      </Typography>
                                                    </Grid>
                                                  </Grid>
                                                </Box>
                                              ),
                                            )}
                                          </Box>
                                        )}

                                      {/* Assignment Summary */}
                                      <Grid container spacing={1.5}>
                                        {metadata.assignmentStatus && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Assignment Status
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: "#111827",
                                                textTransform: "capitalize",
                                              }}
                                            >
                                              {metadata.assignmentStatus.replace(
                                                /_/g,
                                                " ",
                                              )}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.hasRemainingWork !==
                                          undefined && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Remaining Work
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: metadata.hasRemainingWork
                                                  ? "#ea580c"
                                                  : "#16a34a",
                                              }}
                                            >
                                              {metadata.hasRemainingWork
                                                ? "Yes"
                                                : "None"}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {metadata.notes && (
                                        <Box
                                          sx={{
                                            mt: 2,
                                            p: 1.5,
                                            bgcolor: "#f9fafb",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 0.5,
                                            }}
                                          >
                                            Notes
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: "11px",
                                              color: "#111827",
                                            }}
                                          >
                                            {metadata.notes}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                  {/* PRE_STITCHER_COMPLETED metadata */}
                                  {stage.stage === "PRE_STITCHER_COMPLETED" && (
                                    <Box>
                                      <Box
                                        sx={{
                                          p: 2,
                                          bgcolor: "#f0fdf4",
                                          borderRadius: "8px",
                                          border: "2px solid #86efac",
                                          mb: 2,
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontSize: "11px",
                                            color: "#15803d",
                                            fontWeight: 700,
                                            mb: 0.5,
                                          }}
                                        >
                                          ✓ ALL WORK COMPLETED
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontSize: "10px",
                                            color: "#166534",
                                          }}
                                        >
                                          All pre-stitching assignments have
                                          been completed
                                        </Typography>
                                      </Box>

                                      <Grid
                                        container
                                        spacing={1.5}
                                        sx={{ mb: 2 }}
                                      >
                                        {metadata.preStitcherName && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Final Handover By
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.preStitcherName}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.totalShirtsHandedOver && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Total Shirts
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.totalShirtsHandedOver}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {/* Completed Items */}
                                      {metadata.completedItems &&
                                        metadata.completedItems.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 1,
                                              }}
                                            >
                                              Final Items
                                            </Typography>
                                            <Box
                                              sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 0.75,
                                              }}
                                            >
                                              {metadata.completedItems.map(
                                                (item, i) => (
                                                  <Box
                                                    key={i}
                                                    sx={{
                                                      px: 1.5,
                                                      py: 0.75,
                                                      bgcolor: "#ffffff",
                                                      borderRadius: "4px",
                                                      border:
                                                        "1px solid #e5e7eb",
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.option}:{" "}
                                                      {item.completedQuantity}
                                                    </Typography>
                                                  </Box>
                                                ),
                                              )}
                                            </Box>
                                          </Box>
                                        )}

                                      {/* Final Progress */}
                                      {metadata.optionProgress &&
                                        metadata.optionProgress.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 1,
                                              }}
                                            >
                                              Final Progress
                                            </Typography>
                                            {metadata.optionProgress.map(
                                              (progress, i) => (
                                                <Box
                                                  key={i}
                                                  sx={{
                                                    display: "flex",
                                                    justifyContent:
                                                      "space-between",
                                                    alignItems: "center",
                                                    p: 1,
                                                    bgcolor:
                                                      progress.completedQuantity ===
                                                      progress.totalQuantity
                                                        ? "#f0fdf4"
                                                        : "#f9fafb",
                                                    borderRadius: "4px",
                                                    mb: 0.75,
                                                    border:
                                                      progress.completedQuantity ===
                                                      progress.totalQuantity
                                                        ? "1px solid #bbf7d0"
                                                        : "1px solid #e5e7eb",
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontSize: "11px",
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    {progress.option}
                                                  </Typography>
                                                  <Typography
                                                    sx={{
                                                      fontSize: "11px",
                                                      fontWeight: 600,
                                                      color:
                                                        progress.completedQuantity ===
                                                        progress.totalQuantity
                                                          ? "#16a34a"
                                                          : "#111827",
                                                    }}
                                                  >
                                                    {progress.completedQuantity}
                                                    /{progress.totalQuantity} ✓
                                                  </Typography>
                                                </Box>
                                              ),
                                            )}
                                          </Box>
                                        )}

                                      {/* Summary Stats */}
                                      <Grid container spacing={1.5}>
                                        {metadata.totalAssignments && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Total Assignments
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.totalAssignments}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.completedAssignments && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Completed
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#16a34a",
                                              }}
                                            >
                                              {metadata.completedAssignments}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {metadata.notes && (
                                        <Box
                                          sx={{
                                            mt: 2,
                                            p: 1.5,
                                            bgcolor: "#f9fafb",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 0.5,
                                            }}
                                          >
                                            Notes
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: "11px",
                                              color: "#111827",
                                            }}
                                          >
                                            {metadata.notes}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                  {/* PRE_STITCHER_HANDOVER_RECEIVED metadata */}
                                  {stage.stage ===
                                    "PRE_STITCHER_HANDOVER_RECEIVED" && (
                                    <Box>
                                      <Box
                                        sx={{
                                          p: 1.5,
                                          bgcolor: "#eff6ff",
                                          borderRadius: "8px",
                                          border: "1px solid #bfdbfe",
                                          mb: 2,
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontSize: "11px",
                                            color: "#1e40af",
                                            fontWeight: 700,
                                          }}
                                        >
                                          ✓ Handover Received
                                        </Typography>
                                      </Box>

                                      <Grid container spacing={1.5}>
                                        {metadata.totalShirtsReceived && (
                                          <Grid item xs={12}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Shirts Received
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.totalShirtsReceived}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {metadata.notes && (
                                        <Box
                                          sx={{
                                            mt: 2,
                                            p: 1.5,
                                            bgcolor: "#f9fafb",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 0.5,
                                            }}
                                          >
                                            Notes
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: "11px",
                                              color: "#111827",
                                            }}
                                          >
                                            {metadata.notes}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                  {/* CUTTING metadata */}
                                  {stage.stage === "CUTTING" && (
                                    <Box>
                                      <Grid container spacing={1.5}>
                                        {metadata.itemCount && (
                                          <Grid item xs={6} sm={4}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Item Count
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.itemCount}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.totalDhapFold && (
                                          <Grid item xs={6} sm={4}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Total Allocated
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.totalDhapFold} m
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.previousStage && (
                                          <Grid item xs={12} sm={4}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Previous Stage
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: "#111827",
                                                textTransform: "capitalize",
                                              }}
                                            >
                                              {formatStageLabel(
                                                metadata.previousStage,
                                              )}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>
                                      {metadata.items &&
                                        metadata.items.length > 0 && (
                                          <Box sx={{ mt: 1.5 }}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 1,
                                              }}
                                            >
                                              Items
                                            </Typography>
                                            {metadata.items.map((item, i) => (
                                              <Box
                                                key={i}
                                                sx={{
                                                  p: 1.5,
                                                  bgcolor: "#f9fafb",
                                                  borderRadius: "4px",
                                                  mb: 1,
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    mb: 0.5,
                                                  }}
                                                >
                                                  {item.fabricTitle ||
                                                    item.fabricSKU}
                                                </Typography>
                                                <Grid container spacing={1}>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Color
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.fabricColor}
                                                    </Typography>
                                                  </Grid>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Dhap
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.dhap}
                                                    </Typography>
                                                  </Grid>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Fold
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.fold}
                                                    </Typography>
                                                  </Grid>
                                                  <Grid item xs={6} sm={3}>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "10px",
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Total
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      {item.totalDhapFold}
                                                    </Typography>
                                                  </Grid>
                                                </Grid>
                                              </Box>
                                            ))}
                                          </Box>
                                        )}
                                    </Box>
                                  )}
                                  {/* ASSIGN_PRE_STITCHER metadata */}
                                  {stage.stage === "ASSIGN_PRE_STITCHER" && (
                                    <Grid container spacing={1.5}>
                                      {metadata.itemCount && (
                                        <Grid item xs={6}>
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 0.5,
                                            }}
                                          >
                                            Item Count
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: "12px",
                                              fontWeight: 600,
                                              color: "#111827",
                                            }}
                                          >
                                            {metadata.itemCount}
                                          </Typography>
                                        </Grid>
                                      )}
                                      {metadata.previousStage && (
                                        <Grid item xs={6}>
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 0.5,
                                            }}
                                          >
                                            Previous Stage
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              color: "#111827",
                                              textTransform: "capitalize",
                                            }}
                                          >
                                            {formatStageLabel(
                                              metadata.previousStage,
                                            )}
                                          </Typography>
                                        </Grid>
                                      )}
                                    </Grid>
                                  )}
                                  {/* SHIRT_DETAILS_ADDED/UPDATED metadata */}
                                  {(stage.stage === "SHIRT_DETAILS_ADDED" ||
                                    stage.stage ===
                                      "SHIRT_DETAILS_UPDATED") && (
                                    <Box>
                                      <Grid
                                        container
                                        spacing={1.5}
                                        sx={{ mb: 1.5 }}
                                      >
                                        <Grid item xs={12} sm={6}>
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 0.5,
                                            }}
                                          >
                                            Action
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: "12px",
                                              fontWeight: 600,
                                              color: "#111827",
                                              textTransform: "capitalize",
                                            }}
                                          >
                                            {metadata.action?.replace(
                                              /_/g,
                                              " ",
                                            )}
                                          </Typography>
                                        </Grid>
                                        {metadata.fabricTitle && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Fabric
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.fabricTitle} •{" "}
                                              {metadata.fabricColor}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {metadata.shirtDetails && (
                                        <Box
                                          sx={{
                                            mb: metadata.changes ? 1.5 : 0,
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 1,
                                            }}
                                          >
                                            Shirt Details
                                          </Typography>
                                          <Box
                                            sx={{
                                              p: 1.5,
                                              bgcolor: "#f0f9ff",
                                              borderRadius: "4px",
                                              border: "1px solid #bae6fd",
                                            }}
                                          >
                                            <Grid container spacing={1}>
                                              <Grid item xs={6}>
                                                <Typography
                                                  sx={{
                                                    fontSize: "10px",
                                                    color: "#0369a1",
                                                  }}
                                                >
                                                  Shirt SKU
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    fontFamily: "monospace",
                                                  }}
                                                >
                                                  {
                                                    metadata.shirtDetails
                                                      .shirtSKUs?.map(s => typeof s === 'string' ? s : `${s.sku} (${s.quantity})`).join(', ') || "None"
                                                  }
                                                </Typography>
                                              </Grid>
                                              <Grid item xs={6}>
                                                <Typography
                                                  sx={{
                                                    fontSize: "10px",
                                                    color: "#0369a1",
                                                  }}
                                                >
                                                  Quantity
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  {
                                                    metadata.shirtDetails
                                                      .shirtQuantity
                                                  }
                                                </Typography>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Box>
                                      )}

                                      {metadata.changes && (
                                        <Box>
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 1,
                                            }}
                                          >
                                            Changes Made
                                          </Typography>
                                          {metadata.changes.shirtSKUs && (
                                            <Box
                                              sx={{
                                                p: 1.5,
                                                bgcolor: "#fef3c7",
                                                borderRadius: "4px",
                                                mb: 1,
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  color: "#92400e",
                                                  mb: 0.5,
                                                }}
                                              >
                                                Shirt SKUs
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "11px",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {metadata.changes.shirtSKUs
                                                  .old?.map(s => typeof s === 'string' ? s : `${s.sku} (${s.quantity})`).join(', ') || "None"}{" "}
                                                →{" "}
                                                {metadata.changes.shirtSKUs.new?.map(s => typeof s === 'string' ? s : `${s.sku} (${s.quantity})`).join(', ') || "None"}
                                              </Typography>
                                            </Box>
                                          )}
                                          {metadata.changes.shirtQuantity && (
                                            <Box
                                              sx={{
                                                p: 1.5,
                                                bgcolor: "#fef3c7",
                                                borderRadius: "4px",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  color: "#92400e",
                                                  mb: 0.5,
                                                }}
                                              >
                                                Quantity
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "11px",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {metadata.changes.shirtQuantity
                                                  .old || "None"}{" "}
                                                →{" "}
                                                {
                                                  metadata.changes.shirtQuantity
                                                    .new
                                                }
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                  {stage.stage === "TAILOR_WORK_COMPLETED" && (
                                    <Box>
                                      <Grid
                                        container
                                        spacing={1.5}
                                        sx={{ mb: 2 }}
                                      >
                                        {metadata.tailorName && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Tailor Name
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.tailorName}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.tailorPhone && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Phone Number
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                                fontFamily: "monospace",
                                              }}
                                            >
                                              {metadata.tailorPhone}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {/* Work Details */}
                                      <Box sx={{ mb: 2 }}>
                                        <Typography
                                          sx={{
                                            fontSize: "10px",
                                            color: "#6b7280",
                                            mb: 1,
                                          }}
                                        >
                                          Work Completed
                                        </Typography>
                                        <Box
                                          sx={{
                                            p: 1.5,
                                            bgcolor: "#f0fdf4",
                                            borderRadius: "4px",
                                            border: "1px solid #bbf7d0",
                                          }}
                                        >
                                          <Grid container spacing={1}>
                                            <Grid item xs={4}>
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  color: "#15803d",
                                                  mb: 0.5,
                                                }}
                                              >
                                                Cuff
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "11px",
                                                  fontWeight: 600,
                                                  color: metadata.cuff
                                                    ? "#16a34a"
                                                    : "#6b7280",
                                                }}
                                              >
                                                {metadata.cuff
                                                  ? "✓ Yes"
                                                  : "✗ No"}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  color: "#15803d",
                                                  mb: 0.5,
                                                }}
                                              >
                                                Ghera
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "11px",
                                                  fontWeight: 600,
                                                  color: metadata.ghera
                                                    ? "#16a34a"
                                                    : "#6b7280",
                                                }}
                                              >
                                                {metadata.ghera
                                                  ? "✓ Yes"
                                                  : "✗ No"}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  color: "#15803d",
                                                  mb: 0.5,
                                                }}
                                              >
                                                Collar
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "11px",
                                                  fontWeight: 600,
                                                  color: metadata.collar
                                                    ? "#16a34a"
                                                    : "#6b7280",
                                                }}
                                              >
                                                {metadata.collar
                                                  ? "✓ Yes"
                                                  : "✗ No"}
                                              </Typography>
                                            </Grid>
                                          </Grid>
                                        </Box>
                                      </Box>

                                      {/* Summary */}
                                      <Grid container spacing={1.5}>
                                        {metadata.itemCount && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Items
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.itemCount}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.totalDhapFold && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Total Fabric
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.totalDhapFold} m
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>
                                    </Box>
                                  )}
                                  {/* KANCH_BUTTON metadata */}
                                  {stage.stage === "KANCH_BUTTON" && (
                                    <Box>
                                      <Grid
                                        container
                                        spacing={1.5}
                                        sx={{ mb: 2 }}
                                      >
                                        {metadata.previousStage && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Previous Stage
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: "#111827",
                                                textTransform: "capitalize",
                                              }}
                                            >
                                              {formatStageLabel(
                                                metadata.previousStage,
                                              )}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.tailorName && (
                                          <Grid item xs={12} sm={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Tailor
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.tailorName}
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>

                                      {/* Tailor Work Summary */}
                                      {metadata.tailorWork && (
                                        <Box sx={{ mb: 2 }}>
                                          <Typography
                                            sx={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                              mb: 1,
                                            }}
                                          >
                                            Completed Work
                                          </Typography>
                                          <Box
                                            sx={{
                                              p: 1.5,
                                              bgcolor: "#eff6ff",
                                              borderRadius: "4px",
                                              border: "1px solid #bfdbfe",
                                            }}
                                          >
                                            <Grid container spacing={1}>
                                              <Grid item xs={4}>
                                                <Typography
                                                  sx={{
                                                    fontSize: "10px",
                                                    color: "#1e40af",
                                                  }}
                                                >
                                                  Cuff:{" "}
                                                  {metadata.tailorWork.cuff
                                                    ? "✓"
                                                    : "✗"}
                                                </Typography>
                                              </Grid>
                                              <Grid item xs={4}>
                                                <Typography
                                                  sx={{
                                                    fontSize: "10px",
                                                    color: "#1e40af",
                                                  }}
                                                >
                                                  Ghera:{" "}
                                                  {metadata.tailorWork.ghera
                                                    ? "✓"
                                                    : "✗"}
                                                </Typography>
                                              </Grid>
                                              <Grid item xs={4}>
                                                <Typography
                                                  sx={{
                                                    fontSize: "10px",
                                                    color: "#1e40af",
                                                  }}
                                                >
                                                  Collar:{" "}
                                                  {metadata.tailorWork.collar
                                                    ? "✓"
                                                    : "✗"}
                                                </Typography>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Box>
                                      )}

                                      <Grid container spacing={1.5}>
                                        {metadata.itemCount && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Items
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.itemCount}
                                            </Typography>
                                          </Grid>
                                        )}
                                        {metadata.totalDhapFold && (
                                          <Grid item xs={6}>
                                            <Typography
                                              sx={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                mb: 0.5,
                                              }}
                                            >
                                              Total Fabric
                                            </Typography>
                                            <Typography
                                              sx={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              {metadata.totalDhapFold} m
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: "center",
                        bgcolor: "#f9fafb",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        No stage history available
                      </Typography>
                    </Box>
                  )}
                </Box>

                {idx < selectedMemo.items.length - 1 && (
                  <Divider sx={{ my: 3 }} />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Modal>
  );
}

import { Close, Edit, TrendingUp } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import TailorAssignmentProgressModal from "../Modals/TailorAssignmentProgressModal";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";

const TailorAssignmentsDrawer = ({ open, onClose, memo, onUpdate }) => {
  const dispatch = useDispatch();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    if (open && memo) {
      fetchSummary();
    }
  }, [open, memo]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/assign-tailor/${memo._id}/assignment-summary`,
      );
      setSummary(response.data.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Failed to load assignment details",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const openProgressModal = (assignment) => {
    // Guard: only open if optionProgress is populated
    if (!assignment?.optionProgress?.length) {
      fetchSummary(); // refetch, then let re-render handle it
      return;
    }
    setSelectedAssignment(assignment);
    setProgressModalOpen(true);
  };

  const closeProgressModal = () => {
    setProgressModalOpen(false);
    setSelectedAssignment(null);
  };

  const handleProgressUpdate = () => {
    fetchSummary();
    if (onUpdate) onUpdate();
  };

  const getOverallProgress = () => {
    if (!summary?.optionSummary || summary.optionSummary.length === 0) return 0;

    const totalAssigned = summary.optionSummary.reduce(
      (sum, opt) => sum + opt.assigned,
      0,
    );
    const totalCompleted = summary.optionSummary.reduce(
      (sum, opt) => sum + opt.completed,
      0,
    );

    return totalAssigned > 0
      ? Math.round((totalCompleted / totalAssigned) * 100)
      : 0;
  };

  const getOptionLabel = (optionKey) => {
    const labels = {
      cuff: "Cuff",
      ghera: "Ghera",
      collar: "Collar",
    };
    return labels[optionKey] || optionKey;
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 500 },
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box
            sx={{
              p: 3,
              borderBottom: "1px solid #e5e7eb",
              bgcolor: "#f9fafb",
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
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Tailor Assignments
                </Typography>
                {/* <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  {memo?.deliveryMemoId || memo?._id}
                </Typography> */}
              </Box>
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
            {loading ? (
              <Box sx={{ py: 2 }}>
                <LinearProgress />
              </Box>
            ) : !summary ? (
              <Alert severity="info">No assignment data available</Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Overall Progress */}
                <Card
                  sx={{
                    p: 2,
                    bgcolor: "#f0f9ff",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TrendingUp sx={{ fontSize: 20, color: "#3b82f6" }} />
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#1e40af",
                        }}
                      >
                        Overall Progress
                      </Typography>
                    </Box>
                    <Chip
                      label={`${getOverallProgress()}%`}
                      size="small"
                      sx={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={getOverallProgress()}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 1.5,
                      backgroundColor: "#dbeafe",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#3b82f6",
                      },
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#1e40af",
                      fontWeight: 600,
                    }}
                  >
                    Total Shirts: {summary.totalShirtQuantity}
                  </Typography>
                </Card>

                {/* By Option Progress */}
                {/* {summary.optionSummary && summary.optionSummary.length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#111827",
                        mb: 2,
                      }}
                    >
                      Progress by Operation
                    </Typography>
                    {summary.optionSummary.map((opt, idx) => {
                      const percentage =
                        opt.assigned > 0
                          ? Math.round((opt.completed / opt.assigned) * 100)
                          : 0;

                      return (
                        <Card
                          key={idx}
                          sx={{
                            p: 1.5,
                            mb: 1.5,
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "13px",
                                fontWeight: 600,
                                textTransform: "capitalize",
                              }}
                            >
                              {getOptionLabel(opt.option)}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#3b82f6",
                              }}
                            >
                              {opt.completed}/{opt.assigned}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor:
                                  opt.completed === opt.assigned
                                    ? "#16a34a"
                                    : "#3b82f6",
                              },
                            }}
                          />
                        </Card>
                      );
                    })}
                  </Box>
                )} */}

                <Divider />

                {/* Individual Assignments */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#111827",
                      mb: 2,
                    }}
                  >
                    Tailor Assignments ({summary.assignments?.length || 0})
                  </Typography>

                  {summary.assignments && summary.assignments.length > 0 ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {summary.assignments.map((assignment, idx) => (
                        <Card
                          key={idx}
                          sx={{
                            p: 2,
                            border: "2px solid",
                            borderColor:
                              assignment.status === "COMPLETED"
                                ? "#86efac"
                                : assignment.status === "IN_PROGRESS"
                                  ? "#fdba74"
                                  : "#93c5fd",
                            bgcolor:
                              assignment.status === "COMPLETED"
                                ? "#f0fdf4"
                                : assignment.status === "IN_PROGRESS"
                                  ? "#fff7ed"
                                  : "#eff6ff",
                          }}
                        >
                          {/* Header */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1.5,
                            }}
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: "#111827",
                                }}
                              >
                                {assignment.tailor.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                }}
                              >
                                {assignment.tailor.phoneNumber}
                              </Typography>
                            </Box>
                            <Chip
                              label={assignment.status?.replace(/_/g, " ")}
                              size="small"
                              sx={{
                                fontSize: "10px",
                                height: "20px",
                                fontWeight: 700,
                                backgroundColor:
                                  assignment.status === "COMPLETED"
                                    ? "#16a34a"
                                    : assignment.status === "IN_PROGRESS"
                                      ? "#ea580c"
                                      : "#3b82f6",
                                color: "white",
                              }}
                            />
                          </Box>

                          {/* Options */}
                          <Box sx={{ mb: 1.5 }}>
                            <Typography
                              sx={{
                                fontSize: "11px",
                                color: "#6b7280",
                                mb: 0.5,
                                fontWeight: 600,
                              }}
                            >
                              Assigned Operations:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              {assignment.options.map((opt, i) => (
                                <Chip
                                  key={i}
                                  label={`${getOptionLabel(opt.option)}: ${opt.quantity}`}
                                  size="small"
                                  sx={{
                                    fontSize: "10px",
                                    height: "22px",
                                    backgroundColor: "#f3f4f6",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>

                          {/* Progress Details */}
                          {assignment.optionProgress &&
                            assignment.optionProgress.length > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography
                                  sx={{
                                    fontSize: "11px",
                                    color: "#6b7280",
                                    mb: 1,
                                    fontWeight: 600,
                                  }}
                                >
                                  Progress:
                                </Typography>
                                {assignment.optionProgress.map(
                                  (progress, i) => {
                                    const percentage =
                                      progress.totalQuantity > 0
                                        ? (progress.completedQuantity /
                                            progress.totalQuantity) *
                                          100
                                        : 0;

                                    return (
                                      <Box key={i} sx={{ mb: 1 }}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            mb: 0.5,
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              textTransform: "capitalize",
                                            }}
                                          >
                                            {getOptionLabel(progress.option)}
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: "11px",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {progress.completedQuantity}/
                                            {progress.totalQuantity}
                                          </Typography>
                                        </Box>
                                        <LinearProgress
                                          variant="determinate"
                                          value={percentage}
                                          sx={{
                                            height: 5,
                                            borderRadius: 2.5,
                                            backgroundColor: "#e5e7eb",
                                            "& .MuiLinearProgress-bar": {
                                              backgroundColor:
                                                progress.completedQuantity ===
                                                progress.totalQuantity
                                                  ? "#16a34a"
                                                  : "#3b82f6",
                                            },
                                          }}
                                        />
                                        {progress.inProgressQuantity > 0 && (
                                          <Typography
                                            sx={{
                                              fontSize: "9px",
                                              color: "#ea580c",
                                              mt: 0.25,
                                            }}
                                          >
                                            {progress.inProgressQuantity} in
                                            progress
                                          </Typography>
                                        )}
                                      </Box>
                                    );
                                  },
                                )}
                              </Box>
                            )}

                          {/* Action Button */}
                          {assignment.status !== "COMPLETED" && (
                            <Button
                              variant="contained"
                              fullWidth
                              size="small"
                              startIcon={<Edit />}
                              onClick={() => openProgressModal(assignment)}
                              sx={{
                                textTransform: "none",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              Update Progress
                            </Button>
                          )}

                          {/* Timestamps */}
                          <Box
                            sx={{
                              mt: 1.5,
                              pt: 1.5,
                              borderTop: "1px solid rgba(0,0,0,0.1)",
                            }}
                          >
                            <Typography
                              sx={{ fontSize: "9px", color: "#6b7280" }}
                            >
                              Assigned:{" "}
                              {new Date(assignment.createdAt).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </Typography>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info">No assignments yet</Alert>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Progress Update Modal */}
      <TailorAssignmentProgressModal
        open={progressModalOpen}
        onClose={closeProgressModal}
        assignment={selectedAssignment}
        onSuccess={handleProgressUpdate}
      />
    </>
  );
};

export default TailorAssignmentsDrawer;

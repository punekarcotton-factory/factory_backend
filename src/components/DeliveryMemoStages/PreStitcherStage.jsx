import {
  CheckCircle,
  Edit,
  ExpandMore,
  Notes,
  Palette,
  Schedule,
  TrendingUp,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resolveImageUrl } from "../../config";
import AssignPreStitcherModal from "../../Modals/AssignPreStitcherModal";
import DamageModal from "../../Modals/DamageModal";
import ImagePreviewModal from "../../Modals/ImagePreviewModal";
import MemoDetailDrawer from "../../Modals/MemoDetailDrawer";
import { showSnackbar } from "../../Slice/snackbarSlice";
import axiosInstance from "../../utils/axiosInstance";
import { useDamage } from "../hooks/useDamage";
import { getMemoTitle } from "../../utils/deliveryMemo";

import "../../App.css";
import NoResponsePage from "../../pages/NoResponsePage";
import { CreateButton } from "../Styled";
import moment from "moment";

const PreStitcherStage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeMemoId, setActiveMemoId] = useState(null);
  const [options, setOptions] = useState([]);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedMemoForDetails, setSelectedMemoForDetails] = useState(null);

  const fetchPreStitchMemos = async () => {
    try {
      setLoading(true);

      const [notAssignedRes, assignedRes, completedRes] = await Promise.all([
        axiosInstance.get("/delivery-memos/by-stage", {
          params: { stage: "ASSIGN_PRE_STITCHER" },
        }),
        axiosInstance.get("/delivery-memos/by-stage", {
          params: { stage: "PRE_STITCHER_ASSIGNED" },
        }),
        axiosInstance.get("/delivery-memos/by-stage", {
          params: { stage: "PRE_STITCHER_COMPLETED" },
        }),
      ]);

      setMemos([
        ...(notAssignedRes.data.data || []),
        ...(assignedRes.data.data || []),
        ...(completedRes.data.data || []),
      ]);
    } catch (error) {
      console.error(error);
      setMemos([]);
    } finally {
      setLoading(false);
    }
  };

  // Damage modal states
  const {
    damageModalOpen,
    setDamageModalOpen,
    damageItem,
    damageQuantity,
    setDamageQuantity,
    damageNotes,
    setDamageNotes,
    damageLoading,
    openDamageModal,
    handleMarkDamage,
  } = useDamage("PRE_STITCHER_ASSIGNED", fetchPreStitchMemos);

  const getUniqueColors = (items) => {
    return [...new Set(items.map((item) => item.fabricColor))];
  };

  const openDetailDrawer = (memo) => {
    setSelectedMemoForDetails(memo);
    setDetailDrawerOpen(true);
  };

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedMemoForDetails(null);
  };

  const getAssignmentSummary = (memo) => {
    if (!memo.assignments || !Array.isArray(memo.assignments)) {
      return { total: 0, completed: 0, inProgress: 0, assigned: 0 };
    }

    const total = memo.assignments.length;
    const completed = memo.assignments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const inProgress = memo.assignments.filter(
      (a) => a.status === "IN_PROGRESS",
    ).length;
    const assigned = memo.assignments.filter(
      (a) => a.status === "ASSIGNED",
    ).length;

    return { total, completed, inProgress, assigned };
  };

  const getProgressSummary = (memo) => {
    if (
      !memo.assignments ||
      !Array.isArray(memo.assignments) ||
      memo.assignments.length === 0
    ) {
      return { total: 0, completed: 0, percentage: 0, byOption: {} };
    }

    let totalShirts = 0;
    let completedShirts = 0;
    const byOption = {};

    memo.assignments.forEach((assignment) => {
      if (
        assignment.optionProgress &&
        Array.isArray(assignment.optionProgress)
      ) {
        assignment.optionProgress.forEach((progress) => {
          const optionName = progress.option;

          totalShirts += progress.totalQuantity || 0;
          completedShirts += progress.completedQuantity || 0;

          if (!byOption[optionName]) {
            byOption[optionName] = {
              total: 0,
              completed: 0,
              inProgress: 0,
            };
          }
          byOption[optionName].total += progress.totalQuantity || 0;
          byOption[optionName].completed += progress.completedQuantity || 0;
          byOption[optionName].inProgress += progress.inProgressQuantity || 0;
        });
      }
    });

    const percentage =
      totalShirts > 0 ? Math.round((completedShirts / totalShirts) * 100) : 0;

    return {
      total: totalShirts,
      completed: completedShirts,
      percentage,
      byOption,
    };
  };

  const getOptionLabel = (optionKey) => {
    const labels = {
      label: "Label",
      flacket: "Flacket",
      covering: "Covering",
      pocket: "Pocket",
      shoulder: "Shoulder",
      chockPatti: "Chock Patti",
    };
    return labels[optionKey] || optionKey;
  };

  const moveToTailorStage = async (memoId) => {
    try {
      await axiosInstance.post(
        `/assign-tailor/${memoId}/move-to-assign-tailor`,
      );

      setMemos((prev) =>
        prev.filter((m) => (m.deliveryMemoId || m._id) !== memoId),
      );

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Moved to Tailor stage successfully",
        }),
      );
    } catch (err) {
      console.error("[moveToTailorStage] Error:", err);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message:
            err.response?.data?.message || "Failed to move to tailor stage",
        }),
      );
    }
  };

  const openAssignModal = (memoId) => {
    setActiveMemoId(memoId);
    setModalOpen(true);
  };

  const handleAssignmentSuccess = () => {
    fetchPreStitchMemos();
    setModalOpen(false);
    setActiveMemoId(null);
  };

  const groupedMemos = {
    notAssigned: memos
      .filter((m) => m.stage === "ASSIGN_PRE_STITCHER")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

    assigned: memos
      .filter((m) => m.stage === "PRE_STITCHER_ASSIGNED")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

    completed: memos
      .filter((m) => m.stage === "PRE_STITCHER_COMPLETED")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };

  const getCurrentMemos = () => {
    switch (activeTab) {
      case 0:
        return groupedMemos.notAssigned;
      case 1:
        return groupedMemos.assigned;
      case 2:
        return groupedMemos.completed;
      default:
        return [];
    }
  };

  const getCurrentStatus = () => {
    switch (activeTab) {
      case 0:
        return "notAssigned";
      case 1:
        return "assigned";
      case 2:
        return "completed";
      default:
        return "notAssigned";
    }
  };

  useEffect(() => {
    if (user) fetchPreStitchMemos();
  }, [user]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axiosInstance.get("/pre-stitchers/options");
        setOptions(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching stitch options", err);
        setOptions([]);
      }
    };

    fetchOptions();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={160}
                sx={{ borderRadius: "12px" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!memos.length) {
    return <NoResponsePage />;
  }

  return (
    <>
      <Box sx={{ minHeight: "100%", pb: 4, mt: 3 }}>
        <Container maxWidth={false} disableGutters sx={{ px: 3 }}>
          <Paper
            elevation={0}
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "#ffffff",
              mb: 1,
              borderBottom: "1px solid #e3e8ee",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  minHeight: 56,
                  color: "#697386",
                  px: 3,
                  "&.Mui-selected": {
                    color: "#1a1f36",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#667eea",
                  height: 2,
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span>Pending Assignment</span>
                    <Badge
                      badgeContent={groupedMemos.notAssigned.length}
                      sx={{
                        "& .MuiBadge-badge": {
                          backgroundColor: "#fff4e5",
                          color: "#7a5b00",
                          fontWeight: 700,
                          minWidth: 20,
                          height: 20,
                          fontSize: "11px",
                        },
                      }}
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span>In Progress</span>
                    <Badge
                      badgeContent={groupedMemos.assigned.length}
                      sx={{
                        "& .MuiBadge-badge": {
                          backgroundColor: "#e3f2fd",
                          color: "#1565c0",
                          fontWeight: 700,
                          minWidth: 20,
                          height: 20,
                          fontSize: "11px",
                        },
                      }}
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span>Completed</span>
                    <Badge
                      badgeContent={groupedMemos.completed.length}
                      sx={{
                        "& .MuiBadge-badge": {
                          backgroundColor: "#e8f5e9",
                          color: "#2e7d32",
                          fontWeight: 700,
                          minWidth: 20,
                          height: 20,
                          fontSize: "11px",
                        },
                      }}
                    />
                  </Box>
                }
              />
            </Tabs>
          </Paper>

          <Box>
            {getCurrentMemos().length === 0 ? (
              <NoResponsePage />
            ) : (
              <Grid container spacing={2.5}>
                {getCurrentMemos().map((memo) => {
                  const uniqueColors = getUniqueColors(memo.items || []);
                  const shirtSKUsList =
                    memo.items
                      ?.map((item) =>
                        (item.shirtSKUs || []).map((s) =>
                          typeof s === "string" ? s : `${s.sku}:${s.quantity}`,
                        ),
                      )
                      .flat() || [];
                  const progress = getProgressSummary(memo);
                  const memoId = memo.deliveryMemoId || memo._id;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={memoId}>
                      <Card
                        sx={{
                          borderRadius: "12px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          backgroundColor: "#ffffff",
                          minHeight:
                            getCurrentStatus() === "assigned"
                              ? "500px"
                              : "320px",
                          width: "350px",
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
                          {/* Card Header */}
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
                                alignItems: "flex-start",
                                // mb: 1,
                                gap: 1,
                              }}
                            >
                              <Tooltip
                                title={getMemoTitle(memo)}
                                arrow
                                placement="top"
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    color: "#111827",
                                    cursor: "default",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    minHeight: "44px",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {getMemoTitle(memo)}
                                </Typography>
                              </Tooltip>

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  alignItems: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Chip
                                  label={
                                    memo.items?.length === 1
                                      ? "1 Item"
                                      : `${memo.items?.length || 0} Items`
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

                                {/* Only show "X shirts remaining" chip on Pending Assignment tab */}
                                {getCurrentStatus() === "notAssigned" &&
                                  (() => {
                                    const remaining = memo.items?.reduce(
                                      (sum, item) =>
                                        sum +
                                        (item.shirtSKUs?.reduce(
                                          (sSum, s) => sSum + (s.quantity || 0),
                                          0,
                                        ) || 0),
                                      0,
                                    );
                                    if (remaining > 0) {
                                      return (
                                        <Chip
                                          label={`${remaining} shirts remaining`}
                                          size="small"
                                          sx={{
                                            backgroundColor: "#fff7ed",
                                            color: "#9a3412",
                                            fontWeight: 700,
                                            fontSize: "10px",
                                            height: "20px",
                                            border: "1px solid #ffedd5",
                                          }}
                                        />
                                      );
                                    }
                                    return null;
                                  })()}
                              </Box>
                            </Box>
                            <Typography
                              sx={{
                                fontSize: "11px",
                                color: "#6b7280",
                              }}
                            >
                              {moment
                                .utc(memo.createdAt)
                                .format("DD/MM/YYYY HH:mm")}
                            </Typography>
                          </Box>

                          {/* Colors & SKUs + Info Box */}
                          <Box
                            sx={{
                              mb: 2,
                              height: "180px",
                              flexShrink: 0,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Box
                              sx={{ mb: 1.5, height: "80px", flexShrink: 0 }}
                            >
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
                                Colors & SKUs
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  flexWrap: "wrap",
                                  mb: 0.5,
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
                                      "& .MuiChip-icon": { fontSize: 14 },
                                    }}
                                  />
                                ))}
                                {uniqueColors.length > 3 && (
                                  <Tooltip
                                    title={uniqueColors.join(", ")}
                                    arrow
                                    placement="top"
                                  >
                                    <Chip
                                      label={`+${uniqueColors.length - 3}`}
                                      size="small"
                                      sx={{
                                        fontSize: "11px",
                                        height: "22px",
                                        backgroundColor: "#f3f4f6",
                                        cursor: "default",
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                {shirtSKUsList
                                  .slice(0, 3)
                                  .map((skuStr, idx) => (
                                    <Chip
                                      key={idx}
                                      label={skuStr}
                                      size="small"
                                      sx={{
                                        fontSize: "10px",
                                        height: "20px",
                                        backgroundColor: "#e0e7ff",
                                        color: "#4338ca",
                                        fontWeight: 600,
                                      }}
                                    />
                                  ))}
                                {shirtSKUsList.length > 3 && (
                                  <Tooltip
                                    title={shirtSKUsList.join(", ")}
                                    arrow
                                    placement="top"
                                  >
                                    <Chip
                                      label={`+${shirtSKUsList.length - 3}`}
                                      size="small"
                                      sx={{
                                        fontSize: "10px",
                                        height: "20px",
                                        backgroundColor: "#e0e7ff",
                                        color: "#4338ca",
                                        cursor: "default",
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>

                            <Box
                              sx={{
                                backgroundColor: "#f9fafb",
                                borderRadius: "8px",
                                p: 1.5,
                                height: "88px",
                                flexShrink: 0,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box>
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
                                  {memo.totalDhapFold || 0} m
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
                                  }}
                                >
                                  Status:{" "}
                                  {getCurrentStatus() === "notAssigned"
                                    ? "Not Assigned"
                                    : getCurrentStatus() === "assigned"
                                      ? "In Progress"
                                      : "Completed"}
                                </Typography>
                              </Box>
                              {getCurrentStatus() === "assigned" &&
                                memo.assignments?.length > 0 && (
                                  <Typography
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: "15px",
                                      color: "#111827",
                                      cursor: "default",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {getMemoTitle(memo)}
                                  </Typography>
                                )}
                              {getCurrentStatus() === "assigned" &&
                                memo.assignments?.length > 0 && (
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "#6b7280",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {"Assigned To: "}
                                    {memo.assignments
                                      .map((a) => a.preStitcherName)
                                      .join(", ")}
                                  </Typography>
                                )}
                            </Box>
                          </Box>

                          {/* Progress Section — In Progress tab only */}
                          {getCurrentStatus() === "assigned" && (
                            <Box
                              sx={{
                                mb: 2,
                                p: 2,
                                backgroundColor: "#f0f9ff",
                                borderRadius: "12px",
                                border: "2px solid #3b82f6",
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
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <TrendingUp
                                    sx={{ fontSize: 18, color: "#3b82f6" }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#1e40af",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Overall Progress
                                  </Typography>
                                </Box>
                                <Chip
                                  label={`${progress.percentage}%`}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#3b82f6",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                  }}
                                />
                              </Box>

                              <LinearProgress
                                variant="determinate"
                                value={progress.percentage}
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

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mb: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <CheckCircle
                                    sx={{ fontSize: 14, color: "#16a34a" }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "#166534",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {progress.completed} handed over
                                  </Typography>
                                </Box>
                              </Box>

                              <Divider sx={{ mb: 1.5 }} />

                              {(() => {
                                const assignmentSummary =
                                  getAssignmentSummary(memo);
                                return (
                                  <Box sx={{ mb: 1.5 }}>
                                    <Typography
                                      sx={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#1e40af",
                                        textTransform: "uppercase",
                                        mb: 1,
                                        letterSpacing: "0.5px",
                                      }}
                                    >
                                      Assignments ({assignmentSummary.total})
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 1,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      {assignmentSummary.completed > 0 && (
                                        <Chip
                                          icon={
                                            <CheckCircle
                                              sx={{ fontSize: 12 }}
                                            />
                                          }
                                          label={`${assignmentSummary.completed} Completed`}
                                          size="small"
                                          sx={{
                                            fontSize: "10px",
                                            height: "22px",
                                            backgroundColor: "#dcfce7",
                                            color: "#166534",
                                            fontWeight: 600,
                                            "& .MuiChip-icon": {
                                              fontSize: 12,
                                              color: "#16a34a",
                                            },
                                          }}
                                        />
                                      )}
                                      {assignmentSummary.inProgress > 0 && (
                                        <Chip
                                          icon={
                                            <Schedule sx={{ fontSize: 12 }} />
                                          }
                                          label={`${assignmentSummary.inProgress} In Progress`}
                                          size="small"
                                          sx={{
                                            fontSize: "10px",
                                            height: "22px",
                                            backgroundColor: "#fed7aa",
                                            color: "#9a3412",
                                            fontWeight: 600,
                                            "& .MuiChip-icon": {
                                              fontSize: 12,
                                              color: "#ea580c",
                                            },
                                          }}
                                        />
                                      )}
                                      {assignmentSummary.assigned > 0 && (
                                        <Chip
                                          icon={<Edit sx={{ fontSize: 12 }} />}
                                          label={`${assignmentSummary.assigned} Assigned`}
                                          size="small"
                                          sx={{
                                            fontSize: "10px",
                                            height: "22px",
                                            backgroundColor: "#dbeafe",
                                            color: "#1e40af",
                                            fontWeight: 600,
                                            "& .MuiChip-icon": {
                                              fontSize: 12,
                                              color: "#3b82f6",
                                            },
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                );
                              })()}

                              {Object.keys(progress.byOption).length > 0 && (
                                <Accordion
                                  defaultExpanded={false}
                                  sx={{
                                    backgroundColor: "transparent",
                                    boxShadow: "none",
                                    border: "1px solid #bae6fd",
                                    borderRadius: "8px !important",
                                    "&:before": { display: "none" },
                                    mt: 1.5,
                                  }}
                                >
                                  <AccordionSummary
                                    expandIcon={
                                      <ExpandMore
                                        sx={{ fontSize: 18, color: "#1e40af" }}
                                      />
                                    }
                                    sx={{
                                      minHeight: "36px !important",
                                      padding: "0 12px",
                                      "& .MuiAccordionSummary-content": {
                                        margin: "8px 0 !important",
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        width: "100%",
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          fontSize: "10px",
                                          fontWeight: 700,
                                          color: "#1e40af",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                        }}
                                      >
                                        By Operation (
                                        {Object.keys(progress.byOption).length})
                                      </Typography>
                                      <Chip
                                        label="View Details"
                                        size="small"
                                        sx={{
                                          fontSize: "9px",
                                          height: "18px",
                                          backgroundColor: "#dbeafe",
                                          color: "#1e40af",
                                          fontWeight: 600,
                                        }}
                                      />
                                    </Box>
                                  </AccordionSummary>

                                  <AccordionDetails
                                    sx={{ padding: "8px 12px 12px" }}
                                  >
                                    {Object.entries(progress.byOption).map(
                                      ([option, data], idx) => {
                                        const optionPercentage =
                                          data.total > 0
                                            ? (data.completed / data.total) *
                                            100
                                            : 0;
                                        return (
                                          <Box key={idx} sx={{ mb: 1 }}>
                                            <Box
                                              sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                mb: 0.5,
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  fontWeight: 600,
                                                  color: "#1e40af",
                                                }}
                                              >
                                                {getOptionLabel(option)}
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  fontSize: "10px",
                                                  fontWeight: 700,
                                                  color: "#1e40af",
                                                }}
                                              >
                                                {data.completed}/{data.total}
                                              </Typography>
                                            </Box>
                                            <LinearProgress
                                              variant="determinate"
                                              value={optionPercentage}
                                              sx={{
                                                height: 4,
                                                borderRadius: 2,
                                                backgroundColor: "#dbeafe",
                                                "& .MuiLinearProgress-bar": {
                                                  backgroundColor:
                                                    data.completed ===
                                                      data.total
                                                      ? "#16a34a"
                                                      : "#3b82f6",
                                                },
                                              }}
                                            />
                                          </Box>
                                        );
                                      },
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                              )}
                            </Box>
                          )}

                          {/* Action Buttons */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              mt: "auto",
                              flexShrink: 0,
                            }}
                          >
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => openDetailDrawer(memo)}
                              sx={{
                                textTransform: "none",
                                fontSize: "12px",
                                fontWeight: 600,
                                height: "38px",
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

                            {getCurrentStatus() === "notAssigned" && (
                              <CreateButton
                                variant="contained"
                                fullWidth
                                onClick={() => openAssignModal(memoId)}
                              >
                                Assign Pre-Stitcher
                              </CreateButton>
                            )}

                            {getCurrentStatus() === "completed" && (
                              <CreateButton
                                variant="contained"
                                fullWidth
                                onClick={() => moveToTailorStage(memoId)}
                              >
                                Move to Tailor Stage
                              </CreateButton>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Container>
      </Box>

      {/* Assign Pre-Stitcher Modal */}
      <AssignPreStitcherModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        memoId={activeMemoId}
        selectedOptions={[]}
        onAssignmentSuccess={handleAssignmentSuccess}
      />

      {/* Details Drawer */}
      <MemoDetailDrawer
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedMemoForDetails(null);
        }}
        memo={selectedMemoForDetails}
        title="Delivery Memo Details"
        onMarkDamage={(item) => openDamageModal(item)}
        notesHistory={
          selectedMemoForDetails?.stageHistory
            ?.filter((h) => h.metadata?.notes)
            .map((h) => ({
              notes: h.metadata.notes,
              timestamp: h.timestamp,
              performedBy: h.metadata.preStitcherName || "ASSIGNMENT",
            })) || []
        }
      />

      {/* Damage Modal */}
      <DamageModal
        open={damageModalOpen}
        onClose={() => setDamageModalOpen(false)}
        item={damageItem}
        quantity={damageQuantity}
        setQuantity={setDamageQuantity}
        notes={damageNotes}
        setNotes={setDamageNotes}
        loading={damageLoading}
        onConfirm={handleMarkDamage}
      />
    </>
  );
};

export default PreStitcherStage;

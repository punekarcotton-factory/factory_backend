import {
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import { Palette, ExpandMore, Notes } from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import AssignMultipleTailorsModal from "../../Modals/AssignMultipleTailorsModal";
import TailorAssignmentsDrawer from "../../components/TailorAssignmentsDrawer";
import MemoDetailDrawer from "../../Modals/MemoDetailDrawer";
import DamageModal from "../../Modals/DamageModal";
import NoResponsePage from "../../pages/NoResponsePage";
import { getMemoTitle } from "../../utils/deliveryMemo";
import axiosInstance from "../../utils/axiosInstance";
import { CreateButton } from "../Styled";
import { showSnackbar } from "../../Slice/snackbarSlice";
import { DELIVERY_MEMO_STAGES } from "../../utils/deliveryMemo";
import { useDamage } from "../hooks/useDamage";
import moment from "moment";

const AdminAssignTailorStage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedMemoForDetails, setSelectedMemoForDetails] = useState(null);
  const [assignmentSummary, setAssignmentSummary] = useState(null);

  // Multiple assignment states
  const [multipleAssignModalOpen, setMultipleAssignModalOpen] = useState(false);
  const [selectedMemoForMultiple, setSelectedMemoForMultiple] = useState(null);
  const [assignmentsDrawerOpen, setAssignmentsDrawerOpen] = useState(false);
  const [selectedMemoForAssignments, setSelectedMemoForAssignments] =
    useState(null);
  const [tailorNames, setTailorNames] = useState({});

  const fetchAssignTailorMemos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/assign-tailor/memos");
      const sorted = (response.data.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setMemos(sorted);
    } catch (err) {
      setError("Failed to load assign tailor memos");
    } finally {
      setLoading(false);
    }
  }, []);

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
  } = useDamage(
    DELIVERY_MEMO_STAGES.ADMIN_ASSIGN_TAILOR.key,
    fetchAssignTailorMemos,
  );

  useEffect(() => {
    fetchAssignTailorMemos();
  }, [fetchAssignTailorMemos]);

  useEffect(() => {
    const fetchTailorNames = async () => {
      const assignedMemos = memos.filter(
        (m) =>
          m.tailorAssignmentStatus === "ASSIGNED" ||
          m.tailorAssignmentStatus === "COMPLETED",
      );

      const names = {};
      for (const memo of assignedMemos) {
        try {
          const response = await axiosInstance.get(
            `/assign-tailor/${memo._id}/assignment-summary`,
          );
          const tailors = response.data.data.assignments?.map(
            (a) => a.tailor.name,
          );
          names[memo._id] = tailors || [];
        } catch (err) {
          console.error(`Failed to fetch tailors for memo ${memo._id}`);
        }
      }
      setTailorNames(names);
    };

    if (memos.length > 0) {
      fetchTailorNames();
    }
  }, [memos]);

  const openDetailDrawer = async (memo) => {
    setSelectedMemoForDetails(memo);
    setDetailDrawerOpen(true);
    try {
      const response = await axiosInstance.get(
        `/assign-tailor/${memo._id}/assignment-summary`,
      );
      setAssignmentSummary(response.data.data);
    } catch (err) {
      console.error("Failed to fetch assignment summary:", err);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedMemoForDetails(null);
    setAssignmentSummary(null);
  };

  // Multiple assignment handlers
  const openMultipleAssignModal = (memo) => {
    setSelectedMemoForMultiple(memo);
    setMultipleAssignModalOpen(true);
  };

  const closeMultipleAssignModal = () => {
    setMultipleAssignModalOpen(false);
    setSelectedMemoForMultiple(null);
  };

  const openAssignmentsDrawer = (memo) => {
    setSelectedMemoForAssignments(memo);
    setAssignmentsDrawerOpen(true);
  };

  const closeAssignmentsDrawer = () => {
    setAssignmentsDrawerOpen(false);
    setSelectedMemoForAssignments(null);
  };

  const handleMultipleAssignSuccess = () => {
    fetchAssignTailorMemos();
  };

  // const handleMarkDamage = async () => {
  //   if (!damageItem?._id || !damageQuantity) {
  //     dispatch(
  //       showSnackbar({
  //         open: true,
  //         severity: "error",
  //         message: "Please enter damaged quantity",
  //       }),
  //     );
  //     return;
  //   }

  //   try {
  //     setDamageLoading(true);

  //     await axiosInstance.patch(
  //       `/delivery-memos/items/${damageItem._id}/damage`,
  //       {
  //         damagedQuantity: Number(damageQuantity),
  //         notes: damageNotes,
  //         stage: DELIVERY_MEMO_STAGES.ADMIN_ASSIGN_TAILOR.key,
  //         performedBy: user?._id || user?.id,
  //       },
  //     );

  //     dispatch(
  //       showSnackbar({
  //         open: true,
  //         severity: "success",
  //         message: "Damage recorded successfully",
  //       }),
  //     );

  //     setDamageModalOpen(false);
  //     await fetchAssignTailorMemos();
  //   } catch (error) {
  //     console.error("Damage API error", error);
  //     dispatch(
  //       showSnackbar({
  //         open: true,
  //         severity: "error",
  //         message: error?.response?.data?.message || "Failed to record damage",
  //       }),
  //     );
  //   } finally {
  //     setDamageLoading(false);
  //   }
  // };

  const handleMarkComplete = async (memoId) => {
    try {
      const summaryResponse = await axiosInstance.get(
        `/assign-tailor/${memoId}/assignment-summary`,
      );

      const summary = summaryResponse.data.data;
      const incompleteAssignments = summary.assignments.filter(
        (a) => a.status !== "COMPLETED",
      );

      await axiosInstance.post(`/assign-tailor/${memoId}/complete`, {
        performedBy: user?._id || user?.id,
      });

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Tailor work marked as complete",
        }),
      );

      fetchAssignTailorMemos();
    } catch (err) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message:
            err?.response?.data?.message ||
            "Failed to mark as complete. Please try again.",
        }),
      );
    }
  };

  const handleAssignKanchButton = async (memoId) => {
    try {
      await axiosInstance.post(`/assign-tailor/${memoId}/kanch-button`, {
        performedBy: user?._id || user?.id,
      });

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Moved to Kanch Button stage successfully",
        }),
      );

      fetchAssignTailorMemos();
    } catch (err) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message:
            err?.response?.data?.message ||
            "Failed to assign kanch button. Please try again.",
        }),
      );
    }
  };

  const groupedMemos = {
    notAssigned: memos.filter(
      (m) =>
        m.stage === "ASSIGN_TAILOR" &&
        (m.tailorAssignmentStatus === "NOT_ASSIGNED" ||
          !m.tailorAssignmentStatus),
    ),

    assigned: memos.filter(
      (m) =>
        m.stage === "ASSIGN_TAILOR" && m.tailorAssignmentStatus === "ASSIGNED",
    ),

    completed: memos.filter(
      (m) =>
        m.stage === "ASSIGN_TAILOR" && m.tailorAssignmentStatus === "COMPLETED",
    ),
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

  if (loading) {
    return (
      <Box sx={{ backgroundColor: "#fafbfc", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="xl">
          <Skeleton variant="text" width={300} height={50} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={200} height={30} sx={{ mb: 4 }} />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={64}
            sx={{ borderRadius: 2, mb: 3 }}
          />
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={450}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!memos.length) {
    return <NoResponsePage />;
  }

  return (
    <>
      <Box sx={{ minHeight: "100vh", pb: 4, mt: 3 }}>
        <Container maxWidth={false} disableGutters sx={{ px: 3 }}>
          {/* Tabs */}
          <Paper
            elevation={0}
            sx={{
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

          {/* ✅ FIX: Wrapped in Grid container so cards lay out horizontally */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {getCurrentMemos().length === 0 ? (
              <Grid item xs={12}>
                <NoResponsePage />
              </Grid>
            ) : (
              getCurrentMemos().map((memo) => {
                const firstItem = memo.items?.[0];
                const hasMultipleItems = memo.items?.length > 1;
                const uniqueColors = [
                  ...new Set(memo.items?.map((item) => item.fabricColor) || []),
                ];
                const shirtSKUsList =
                  memo.items
                    ?.map((item) =>
                      (item.shirtSKUs || []).map(
                        (s) =>
                          `${typeof s === "string" ? s : `${s.sku}:${s.quantity}`}`,
                      ),
                    )
                    .flat() || [];

                return (
                  <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={memo._id}>
                    <Card
                      sx={{
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        backgroundColor: "#ffffff",
                        minHeight: "430px",
                        width: "320px",
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
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
                              alignItems: "flex-start",
                              mb: 1,
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

                        {/* Content Section */}
                        <Box
                          sx={{
                            mb: 2,
                            height: "170px",
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box sx={{ mb: 1.5, height: "80px", flexShrink: 0 }}>
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
                                    "& .MuiChip-icon": {
                                      fontSize: 14,
                                    },
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
                              {shirtSKUsList.slice(0, 3).map((skuStr, idx) => (
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

                          {/* Memo Information */}
                          <Box
                            sx={{
                              backgroundColor: "#f9fafb",
                              borderRadius: "8px",
                              p: 1,
                              height: "80px",
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
                                  color: "#466d61",
                                }}
                              >
                                {memo.totalDhapFold || 0} m
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            mb: 1,
                            flexShrink: 0,
                            borderRadius: "8px",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "#6b7280",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Assigned To:
                          </Typography>

                          {memo.tailorAssignmentStatus === "ASSIGNED" ||
                          memo.tailorAssignmentStatus === "COMPLETED" ? (
                            <Typography
                              sx={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#466d61",
                              }}
                            >
                              {tailorNames[memo._id]?.length > 0
                                ? tailorNames[memo._id]
                                    .map(
                                      (name) =>
                                        name.charAt(0).toUpperCase() +
                                        name.slice(1),
                                    )
                                    .join(", ")
                                : "Tailors Assigned"}
                            </Typography>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: "10px",
                                color: "#dc2626",
                                fontWeight: 500,
                              }}
                            >
                              No tailors assigned
                            </Typography>
                          )}
                        </Box>

                        {/* Action Buttons */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.75,
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
                              fontSize: "11px",
                              fontWeight: 600,
                              height: "32px",
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
                              onClick={() => openMultipleAssignModal(memo)}
                            >
                              Assign Tailors
                            </CreateButton>
                          )}

                          {getCurrentStatus() === "assigned" && (
                            <>
                              <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => openAssignmentsDrawer(memo)}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  height: "32px",
                                  borderColor: "#3b82f6",
                                  color: "#3b82f6",
                                  "&:hover": {
                                    borderColor: "#3b82f6",
                                    backgroundColor: "rgba(59, 130, 246, 0.04)",
                                  },
                                }}
                              >
                                Update Progress
                              </Button>
                              <CreateButton
                                variant="contained"
                                fullWidth
                                onClick={() => handleMarkComplete(memo._id)}
                              >
                                Mark Complete
                              </CreateButton>
                            </>
                          )}

                          {getCurrentStatus() === "completed" && (
                            <CreateButton
                              variant="contained"
                              fullWidth
                              onClick={() => handleAssignKanchButton(memo._id)}
                            >
                              Assign Kanch Button
                            </CreateButton>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Container>
      </Box>

      {/* Multiple Tailor Assignment Modal */}
      <AssignMultipleTailorsModal
        open={multipleAssignModalOpen}
        onClose={closeMultipleAssignModal}
        memo={selectedMemoForMultiple}
        onSuccess={handleMultipleAssignSuccess}
      />

      {/* Tailor Assignments Drawer */}
      <TailorAssignmentsDrawer
        open={assignmentsDrawerOpen}
        onClose={closeAssignmentsDrawer}
        memo={selectedMemoForAssignments}
        onUpdate={fetchAssignTailorMemos}
      />

      {/* Detail Drawer */}
      <MemoDetailDrawer
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        memo={selectedMemoForDetails}
        title="Delivery Memo Details"
        onMarkDamage={openDamageModal}
        notesHistory={
          assignmentSummary?.assignments?.flatMap(
            (a) => a.progressEntries?.filter((p) => p.notes) || [],
          ) || []
        }
      />

      {/* Damage Modal Drawer */}
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

export default AdminAssignTailorStage;

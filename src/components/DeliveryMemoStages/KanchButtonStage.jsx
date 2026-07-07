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
import { Palette, Person, Phone, ExpandMore, Notes } from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { getMemoTitle } from "../../utils/deliveryMemo";
import { useSelector, useDispatch } from "react-redux";
import AssignKanchButtonDialog from "../../Modals/AssignKanchButtonDialog";
import KanchButtonProgressModal from "../../Modals/KanchButtonProgressModal";
import MemoDetailDrawer from "../../Modals/MemoDetailDrawer";
import DamageModal from "../../Modals/DamageModal";
import NoResponsePage from "../../pages/NoResponsePage";
import axiosInstance from "../../utils/axiosInstance";
import { CreateButton } from "../Styled";
import { showSnackbar } from "../../Slice/snackbarSlice";
import { DELIVERY_MEMO_STAGES } from "../../utils/deliveryMemo";
import { useDamage } from "../hooks/useDamage";
import moment from "moment";

const KanchButtonStage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMemoId, setSelectedMemoId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [tailorForm, setTailorForm] = useState({
    name: "",
    phoneNumber: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedMemoForDetails, setSelectedMemoForDetails] = useState(null);

  const fetchAssignTailorMemos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/kanch-button/memos");
      const sorted = (response.data.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setMemos(sorted);
    } catch (err) {
      setError("Failed to load assign Kanch Button memos");
    } finally {
      setLoading(false);
    }
  }, []);

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
  } = useDamage(DELIVERY_MEMO_STAGES.KANCH_BUTTON.key, fetchAssignTailorMemos);

  // Completion modal states
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [selectedMemoForCompletion, setSelectedMemoForCompletion] =
    useState(null);
  const [completionLoading, setCompletionLoading] = useState(false);

  // Progress modal states
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedKanchButtonDetails, setSelectedKanchButtonDetails] =
    useState(null);

  useEffect(() => {
    fetchAssignTailorMemos();
  }, [fetchAssignTailorMemos]);

  const handleOpenDialog = (memoId) => {
    setSelectedMemoId(memoId);
    setDialogOpen(true);
    setTailorForm({ name: "", phoneNumber: "", notes: "" });
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMemoId(null);
    setTailorForm({ name: "", phoneNumber: "", notes: "" });
    setFormErrors({});
  };

  const openDetailDrawer = (memo) => {
    setSelectedMemoForDetails(memo);
    setDetailDrawerOpen(true);
  };

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedMemoForDetails(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!tailorForm.name.trim()) {
      errors.name = "Kanch Button name is required";
    }
    if (!tailorForm.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(tailorForm.phoneNumber.trim())) {
      errors.phoneNumber = "Phone number must be 10 digits";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAssignTailor = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const response = await axiosInstance.post(
        `/kanch-button/${selectedMemoId}/assign`,
        {
          tailorName: tailorForm.name.trim(),
          tailorPhoneNumber: tailorForm.phoneNumber.trim(),
          notes: tailorForm.notes.trim() || undefined,
        },
      );

      const { kanchButton } = response.data.data;

      setMemos((prevMemos) =>
        prevMemos.map((memo) => {
          if (memo._id !== selectedMemoId) return memo;

          return {
            ...memo,
            kanchButtonAssigned: true,
            kanchButtonStatus: "ASSIGNED",
            kanchButtonDetails: {
              ...kanchButton,
              _id: kanchButton._id,
              name: kanchButton.name,
              phoneNumber: kanchButton.phoneNumber,
              totalShirts: kanchButton.totalShirts,
              completedShirts: kanchButton.completedShirts || 0,
              progressEntries: kanchButton.progressEntries || [],
              notes: kanchButton.notes || null,
            },
          };
        }),
      );

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Worker assigned successfully",
        }),
      );

      handleCloseDialog();
    } catch (err) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message:
            err?.response?.data?.message ||
            "Failed to assign worker. Please try again.",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCompletionModal = (memo) => {
    if (
      !memo.kanchButtonDetails?.completedShirts ||
      memo.kanchButtonDetails?.completedShirts <= 0
    ) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Cannot mark complete. No shirts have been completed yet.",
        }),
      );
      return;
    }
    setSelectedMemoForCompletion(memo);
    setCompletionNotes("");
    setCompletionModalOpen(true);
  };

  const handleCloseCompletionModal = () => {
    setCompletionModalOpen(false);
    setSelectedMemoForCompletion(null);
    setCompletionNotes("");
  };

  const handleConfirmCompletion = async () => {
    if (!selectedMemoForCompletion?._id) return;

    try {
      setCompletionLoading(true);

      await axiosInstance.post(
        `/kanch-button/${selectedMemoForCompletion._id}/complete`,
        {
          userId: user?._id || user?.id,
          notes: completionNotes.trim() || undefined,
        },
      );

      setMemos((prevMemos) =>
        prevMemos.map((memo) =>
          memo._id === selectedMemoForCompletion._id
            ? {
                ...memo,
                kanchButtonStatus: "COMPLETED",
                kanchButtonAssigned: false,
              }
            : memo,
        ),
      );

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Memo completed and closed successfully",
        }),
      );

      handleCloseCompletionModal();
    } catch (err) {
      console.error("Error completing memo:", err);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: err?.response?.data?.message || "Failed to complete memo",
        }),
      );
    } finally {
      setCompletionLoading(false);
    }
  };

  const handleOpenProgressModal = (memo) => {
    setSelectedKanchButtonDetails({
      ...memo.kanchButtonDetails,
      memoItems: memo.items,
    });
    setProgressModalOpen(true);
  };

  const handleCloseProgressModal = () => {
    setProgressModalOpen(false);
    setSelectedKanchButtonDetails(null);
  };

  const handleProgressUpdate = () => {
    fetchAssignTailorMemos();
    handleCloseProgressModal();
  };

  const groupedMemos = {
    notAssigned: memos.filter(
      (m) =>
        !m.kanchButtonAssigned &&
        (!m.kanchButtonStatus || m.kanchButtonStatus === "NOT_ASSIGNED"),
    ),
    assigned: memos.filter(
      (m) => m.kanchButtonAssigned && m.kanchButtonStatus === "ASSIGNED",
    ),
    completed: memos.filter((m) => m.kanchButtonStatus === "COMPLETED"),
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
        <Container maxWidth="xl">
          {/* Tabs */}
          <Paper
            elevation={0}
            sx={{ mb: 1, borderBottom: "1px solid #e3e8ee" }}
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
                  "&.Mui-selected": { color: "#1a1f36" },
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

          {/* Content */}
          {getCurrentMemos().length === 0 ? (
            <NoResponsePage />
          ) : (
            <Grid container spacing={2.5} mt={2}>
              {getCurrentMemos().map((memo) => {
                const itemCount = memo.items?.length || 0;
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
                  <Grid item xs={12} sm={6} md={4} lg={3} key={memo._id}>
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
                                  itemCount === 1
                                    ? "1 Item"
                                    : `${itemCount} Items`
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
                            mb: 1,
                            height: "150px",
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Color Chips and SKUs */}
                          <Box sx={{ height: "80px", flexShrink: 0 }}>
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

                          {/* Memo Info Box */}
                          <Box
                            sx={{
                              backgroundColor: "#f9fafb",
                              borderRadius: "8px",
                              p: 1,
                              height: "100px",
                              flexShrink: 0,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            {memo.kanchButtonDetails ? (
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
                                  Assigned Worker
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mb: 0.5,
                                  }}
                                >
                                  <Person
                                    sx={{ fontSize: 14, color: "#64748b" }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#059669",
                                    }}
                                  >
                                    {memo.kanchButtonDetails.name}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <Phone
                                    sx={{ fontSize: 14, color: "#64748b" }}
                                  />
                                  <Typography
                                    sx={{ fontSize: "12px", color: "#374151" }}
                                  >
                                    {memo.kanchButtonDetails.phoneNumber}
                                  </Typography>
                                </Box>
                              </Box>
                            ) : (
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
                                  Total Items
                                </Typography>
                                <Typography
                                  sx={{
                                    mb: 1,
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#059669",
                                  }}
                                >
                                  {itemCount} items
                                </Typography>
                              </Box>
                            )}
                            {/* Progress Display */}
                            {memo.kanchButtonDetails &&
                              memo.kanchButtonDetails.totalShirts > 0 && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "#6b7280",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Progress:
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color:
                                        memo.kanchButtonDetails
                                          .completedShirts ===
                                        memo.kanchButtonDetails.totalShirts
                                          ? "#16a34a"
                                          : "#3b82f6",
                                    }}
                                  >
                                    {memo.kanchButtonDetails.completedShirts} /{" "}
                                    {memo.kanchButtonDetails.totalShirts}
                                  </Typography>
                                </Box>
                              )}
                          </Box>
                        </Box>

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

                          {getCurrentStatus() === "notAssigned" && (
                            <CreateButton
                              variant="contained"
                              fullWidth
                              onClick={() => handleOpenDialog(memo._id)}
                              sx={{ height: "32px", py: 0.5 }}
                            >
                              Assign Worker
                            </CreateButton>
                          )}

                          {getCurrentStatus() === "assigned" && (
                            <>
                              <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => handleOpenProgressModal(memo)}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  height: "32px",
                                  py: 0.5,
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
                                onClick={() => handleOpenCompletionModal(memo)}
                                sx={{ height: "32px", py: 0.5 }}
                              >
                                Mark Complete
                              </CreateButton>
                            </>
                          )}

                          {getCurrentStatus() === "completed" && (
                            <Box
                              sx={{
                                width: "100%",
                                py: 0.5,
                                backgroundColor: "#f0fdf4",
                                border: "1px solid #86efac",
                                borderRadius: "8px",
                                textAlign: "center",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "#166534",
                                  fontWeight: 600,
                                  fontSize: "13px",
                                }}
                              >
                                ✓ Completed
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Container>
      </Box>

      <AssignKanchButtonDialog
        dialogOpen={dialogOpen}
        handleCloseDialog={handleCloseDialog}
        tailorForm={tailorForm}
        setTailorForm={setTailorForm}
        formErrors={formErrors}
        submitting={submitting}
        handleAssignTailor={handleAssignTailor}
      />

      {/* Detail Drawer */}
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
          selectedMemoForDetails?.kanchButtonDetails?.progressEntries || []
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

      {/* Completion Confirmation Modal */}
      <Dialog
        open={completionModalOpen}
        onClose={handleCloseCompletionModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "18px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          Complete Kanch Button Assignment
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "14px",
                color: "#374151",
                mb: 1,
                lineHeight: 1.6,
              }}
            >
              Completing this assignment will{" "}
              <strong>close the memo permanently</strong>. The memo will be
              moved to closed history and removed from active lists.
            </Typography>

            {selectedMemoForCompletion?.kanchButtonDetails && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  ASSIGNED TO
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Person sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                    {selectedMemoForCompletion.kanchButtonDetails.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Phone sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    {selectedMemoForCompletion.kanchButtonDetails.phoneNumber}
                  </Typography>
                </Box>
                {/* ✅ Only show completion status if totalShirts is set */}
                {selectedMemoForCompletion.kanchButtonDetails.totalShirts >
                  0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      COMPLETION STATUS:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color:
                          selectedMemoForCompletion.kanchButtonDetails
                            .completedShirts ===
                          selectedMemoForCompletion.kanchButtonDetails
                            .totalShirts
                            ? "#16a34a"
                            : "#3b82f6",
                      }}
                    >
                      {
                        selectedMemoForCompletion.kanchButtonDetails
                          .completedShirts
                      }{" "}
                      /{" "}
                      {selectedMemoForCompletion.kanchButtonDetails.totalShirts}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e5e7eb", gap: 1 }}>
          <Button
            onClick={handleCloseCompletionModal}
            disabled={completionLoading}
            sx={{
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              color: "#6b7280",
              "&:hover": { backgroundColor: "#f3f4f6" },
            }}
          >
            Cancel
          </Button>
          <CreateButton
            onClick={handleConfirmCompletion}
            disabled={completionLoading}
            sx={{ minWidth: 120 }}
          >
            {completionLoading ? "Completing..." : "Complete & Close"}
          </CreateButton>
        </DialogActions>
      </Dialog>

      {/* Progress Modal */}
      <KanchButtonProgressModal
        open={progressModalOpen}
        onClose={handleCloseProgressModal}
        kanchButtonDetails={selectedKanchButtonDetails}
        onSuccess={handleProgressUpdate}
      />
    </>
  );
};

export default KanchButtonStage;

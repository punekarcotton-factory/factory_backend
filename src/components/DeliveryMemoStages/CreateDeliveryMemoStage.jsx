import { ExpandMore, Palette } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  Skeleton,
  Typography,
  Drawer,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import CreateDeliveryMemoModal from "../../Modals/CreateDeliveryMemoModal";
import axiosInstance from "../../utils/axiosInstance";
import { DELIVERY_MEMO_STAGES, getMemoTitle } from "../../utils/deliveryMemo";
import { CreateButton } from "../Styled";
import NoResponsePage from "../../pages/NoResponsePage";
import MemoDetailDrawer from "../../Modals/MemoDetailDrawer";
import moment from "moment/moment";

const CreateDeliveryMemoStage = () => {
  const { user } = useSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailDrawer, setDetailDrawer] = useState({ open: false, memo: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [editMemo, setEditMemo] = useState(null);

  const handleOpenEditModal = (memo) => {
    setEditMemo(memo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditMemo(null);
    setIsModalOpen(false);
  };

  const fetchDeliveryMemos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/delivery-memos/by-stage", {
        params: { stage: DELIVERY_MEMO_STAGES.CREATE_DELIVERY_MEMO.key },
      });
      const sorted = (response.data.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setMemos(sorted);
    } catch (error) {
      console.error("fetchDeliveryMemos error", error);
      setMemos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeStage = async (memoId) => {
    try {
      await axiosInstance.patch(`/delivery-memos/${memoId}/stage`, {
        stage: DELIVERY_MEMO_STAGES.CUTTING.key,
        performedBy: user?._id,
        metadata: {},
        updateData: {},
      });
      await fetchDeliveryMemos();
      setSnackbar({
        open: true,
        message: "Successfully moved to cutting stage",
      });
    } catch (error) {
      console.error("Failed to update stage", error);
    }
  };



  const openDetailDrawer = useCallback((memo) => {
    setDetailDrawer({ open: true, memo });
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawer({ open: false, memo: null });
  }, []);

  const getUniqueColors = useMemo(
    () => (items) => {
      return [...new Set(items?.map((item) => item.fabricColor) || [])];
    },
    [],
  );

  useEffect(() => {
    if (user) {
      fetchDeliveryMemos();
    }
  }, [user, fetchDeliveryMemos]);

  if (loading) {
    return (
      <Box>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Skeleton
            variant="rectangular"
            width={{ xs: "100%", sm: 150 }}
            height={36}
          />
          <Skeleton
            variant="text"
            width={{ xs: "100%", sm: 200 }}
            height={40}
          />
        </Box>
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={320}
                sx={{ borderRadius: "12px" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <CreateButton variant="contained" onClick={() => setIsModalOpen(true)}>
        Create New Memo
      </CreateButton>

      {memos.length === 0 ? (
        <NoResponsePage />
      ) : (
        <Grid container spacing={2.5} mt={2}>
          {memos.map((memo) => {
            const itemCount = memo.items?.length || 0;
            const uniqueColors = getUniqueColors(memo.items);

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={memo.deliveryMemoId}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    backgroundColor: "#ffffff",
                    height: "360px",
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
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {getMemoTitle(memo)}
                          </Typography>
                        </Tooltip>
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
                        {moment.utc(memo.createdAt).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        mb: 0.5,
                        height: "120px",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ mb: 1.5, height: "52px", flexShrink: 0 }}>
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
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
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
                      </Box>

                      <Box
                        sx={{
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          p: 1.5,
                          height: "90px",
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
                              mb: 1,
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#059669",
                            }}
                          >
                            {memo.totalDhapFold} m
                          </Typography>
                        </Box>
                        {/* {memo.createdAt && (
                          <Box>
                            <Typography sx={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Created On
                            </Typography>
                            <Typography sx={{ fontSize: "11px", fontWeight: 500, color: "#374151" }}>
                              {new Date(memo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                              {new Date(memo.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </Typography>
                          </Box>
                        )} */}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.6,
                        mt: 5,
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1 }}>
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
                          Details
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleOpenEditModal(memo)}
                          sx={{
                            textTransform: "none",
                            fontSize: "12px",
                            fontWeight: 600,
                            height: "38px",
                            borderColor: "#f59e0b",
                            color: "#d97706",
                            "&:hover": {
                              borderColor: "#d97706",
                              backgroundColor: "rgba(217, 119, 6, 0.04)",
                            },
                          }}
                        >
                          Edit
                        </Button>
                      </Box>
                      <CreateButton
                        variant="contained"
                        fullWidth
                        onClick={() => handleChangeStage(memo.deliveryMemoId)}
                      >
                        Move to Cutting
                      </CreateButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CreateDeliveryMemoModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onMemoCreated={fetchDeliveryMemos}
        currentUser={user}
        editMemo={editMemo}
      />

      <MemoDetailDrawer
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, memo: null })}
        memo={detailDrawer.memo}
        title="Delivery Memo Details"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ open: false, message: "" })}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateDeliveryMemoStage;

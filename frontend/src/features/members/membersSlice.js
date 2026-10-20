import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const errorMessage = (err) => err.response?.data?.message || "Something went wrong";

// Public membership form submit (multipart: photo + fields)
export const submitMember = createAsyncThunk("members/submit", async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/members", formData);
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

// params: { page, limit, search, status }
export const fetchMembers = createAsyncThunk("members/fetch", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/members", { params });
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const fetchMemberStats = createAsyncThunk("members/fetchStats", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/members/stats");
    return data.stats;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

// Profile ke "Members Referred" tab ke liye (tab open hone par call hota hai)
export const fetchReferredMembers = createAsyncThunk(
  "members/fetchReferred",
  async ({ id, ...params }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/members/${id}/referred`, { params });
      return data;
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const fetchMember = createAsyncThunk("members/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/members/${id}`);
    return { ...data.member, referredCount: data.referredCount };
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const updateMemberStatus = createAsyncThunk(
  "members/updateStatus",
  async ({ id, memberStatus }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/members/${id}/status`, { memberStatus });
      return data;
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

const initialState = {
  list: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  stats: { total: 0, active: 0, inactive: 0 },
  statsLoaded: false,
  loading: false,
  listRequestId: null, // sirf latest request ka response apply hota hai (search typing me stale response na aaye)
  referred: { list: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 }, loading: false, requestId: null },
  current: null,
  currentLoading: false,
  submitting: false,
  statusUpdating: false,
};

const membersSlice = createSlice({
  name: "members",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(submitMember.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitMember.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(submitMember.rejected, (state) => {
        state.submitting = false;
      })

      .addCase(fetchMembers.pending, (state, { meta }) => {
        state.loading = true;
        state.listRequestId = meta.requestId;
      })
      .addCase(fetchMembers.fulfilled, (state, { payload, meta }) => {
        if (state.listRequestId !== meta.requestId) return;
        state.loading = false;
        state.list = payload.members;
        state.pagination = payload.pagination;
      })
      .addCase(fetchMembers.rejected, (state, { meta }) => {
        if (state.listRequestId !== meta.requestId) return;
        state.loading = false;
      })

      .addCase(fetchMemberStats.fulfilled, (state, { payload }) => {
        state.stats = payload;
        state.statsLoaded = true;
      })

      .addCase(fetchReferredMembers.pending, (state, { meta }) => {
        state.referred.loading = true;
        state.referred.requestId = meta.requestId;
      })
      .addCase(fetchReferredMembers.fulfilled, (state, { payload, meta }) => {
        if (state.referred.requestId !== meta.requestId) return;
        state.referred.loading = false;
        state.referred.list = payload.members;
        state.referred.pagination = payload.pagination;
      })
      .addCase(fetchReferredMembers.rejected, (state, { meta }) => {
        if (state.referred.requestId !== meta.requestId) return;
        state.referred.loading = false;
      })

      .addCase(fetchMember.pending, (state) => {
        state.currentLoading = true;
        state.current = null;
      })
      .addCase(fetchMember.fulfilled, (state, { payload }) => {
        state.currentLoading = false;
        state.current = payload;
      })
      .addCase(fetchMember.rejected, (state) => {
        state.currentLoading = false;
      })

      .addCase(updateMemberStatus.pending, (state) => {
        state.statusUpdating = true;
      })
      .addCase(updateMemberStatus.fulfilled, (state, { payload }) => {
        state.statusUpdating = false;
        const { _id, memberStatus } = payload.member;
        const row = state.list.find((m) => m._id === _id);
        if (row) row.memberStatus = memberStatus;
        if (state.current?._id === _id) state.current.memberStatus = memberStatus;
      })
      .addCase(updateMemberStatus.rejected, (state) => {
        state.statusUpdating = false;
      });
  },
});

export default membersSlice.reducer;

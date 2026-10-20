import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const errorMessage = (err) => err.response?.data?.message || "Something went wrong";

export const fetchAdmins = createAsyncThunk("admins/fetch", async (search = "", { rejectWithValue }) => {
  try {
    const { data } = await api.get("/admins", { params: { search } });
    return data.admins;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const createAdmin = createAsyncThunk("admins/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/admins", payload);
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const updateAdminStatus = createAsyncThunk(
  "admins/updateStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admins/${id}/status`, { isActive });
      return data;
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const resetAdminPassword = createAsyncThunk(
  "admins/resetPassword",
  async ({ id, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admins/${id}/password`, { newPassword, confirmPassword });
      return data;
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

const adminsSlice = createSlice({
  name: "admins",
  initialState: { list: [], loading: false, saving: false },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdmins.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload;
      })
      .addCase(fetchAdmins.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createAdmin.pending, (state) => {
        state.saving = true;
      })
      .addCase(createAdmin.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.list.unshift(payload.admin);
      })
      .addCase(createAdmin.rejected, (state) => {
        state.saving = false;
      })
      .addCase(resetAdminPassword.pending, (state) => {
        state.saving = true;
      })
      .addCase(resetAdminPassword.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(resetAdminPassword.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateAdminStatus.fulfilled, (state, { payload }) => {
        const i = state.list.findIndex((a) => a._id === payload.admin._id);
        if (i !== -1) state.list[i] = payload.admin;
      });
  },
});

export default adminsSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const errorMessage = (err) => err.response?.data?.message || "Something went wrong";

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  });

// params: { status, search, page, limit }
export const fetchEvents = thunk("events/fetch", async (params) => (await api.get("/events", { params })).data);
// create/update me banner file jati hai, isliye body FormData hai (multipart)
export const createEvent = thunk("events/create", async (formData) => (await api.post("/events", formData)).data);
export const updateEvent = thunk("events/update", async ({ id, formData }) => (await api.put(`/events/${id}`, formData)).data);
export const updateEventStatus = thunk("events/updateStatus", async ({ id, status }) => (await api.patch(`/events/${id}/status`, { status })).data);
export const deleteEvent = thunk("events/delete", async (id) => (await api.delete(`/events/${id}`)).data);
export const fetchEvent = thunk("events/fetchOne", async (id) => (await api.get(`/events/${id}`)).data.event);
export const syncParticipants = thunk("events/sync", async (id) => (await api.post(`/events/${id}/sync-participants`)).data);

// { id, status, search, page, limit }
export const fetchParticipants = thunk("events/fetchParticipants", async ({ id, ...params }) => (await api.get(`/events/${id}/participants`, { params })).data);
export const updateParticipantStatus = thunk("events/updateParticipant", async ({ id, participantId, participationStatus }) =>
  (await api.patch(`/events/${id}/participants/${participantId}`, { participationStatus })).data,
);

// { id, participantId, callStatus, callResponse, participationStatus, calledAt }
export const addCall = thunk("events/addCall", async ({ id, participantId, ...body }) => (await api.post(`/events/${id}/participants/${participantId}/calls`, body)).data);
export const fetchCalls = thunk("events/fetchCalls", async ({ id, participantId }) => (await api.get(`/events/${id}/participants/${participantId}/calls`)).data);

// Latest request ka response hi apply hota hai (fast filter/typing me purana response overwrite na kare)
const latestOnly = (builder, thunkFn, onDone) =>
  builder
    .addCase(thunkFn.pending, (state, { meta }) => {
      state.loading[thunkFn.typePrefix] = meta.requestId;
    })
    .addCase(thunkFn.fulfilled, (state, { payload, meta }) => {
      if (state.loading[thunkFn.typePrefix] !== meta.requestId) return;
      state.loading[thunkFn.typePrefix] = null;
      onDone(state, payload);
    })
    .addCase(thunkFn.rejected, (state, { meta }) => {
      if (state.loading[thunkFn.typePrefix] === meta.requestId) state.loading[thunkFn.typePrefix] = null;
    });

const eventsSlice = createSlice({
  name: "events",
  initialState: {
    list: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    current: null,
    participants: [],
    participantsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    loading: {}, // thunk type -> in-flight requestId
  },
  extraReducers: (builder) => {
    latestOnly(builder, fetchEvents, (s, p) => {
      s.list = p.events;
      s.pagination = p.pagination;
    });
    latestOnly(builder, fetchEvent, (s, p) => {
      s.current = p;
    });
    latestOnly(builder, fetchParticipants, (s, p) => {
      s.participants = p.participants;
      s.participantsPagination = p.pagination;
    });
  },
});

export default eventsSlice.reducer;

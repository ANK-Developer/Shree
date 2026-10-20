import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { fetchCalls } from "../../features/events/eventsSlice";
import { fullName } from "../../utils/format";
import Avatar from "./Avatar";
import { Badge, CALL_STATUS, Modal, PARTICIPATION, formatDateTime } from "./eventUi";

// Timeline dot ka colour call status ke hisaab se
const DOT = {
  ANSWERED: "bg-green-500",
  NOT_ANSWERED: "bg-red-500",
  BUSY: "bg-yellow-500",
  FAILED: "bg-gray-400",
  PENDING: "bg-blue-500",
};

const Stat = ({ label, children }) => (
  <div className="rounded-xl bg-gray-50 px-4 py-3">
    <p className="text-xs text-gray-500">{label}</p>
    <div className="mt-1 text-sm font-semibold text-royal-900">{children}</div>
  </div>
);

// Ek participant ki poori call history, timeline ke roop me
const CallLogsModal = ({ eventId, participant, onClose }) => {
  const dispatch = useDispatch();
  const { member } = participant;
  const [calls, setCalls] = useState(null);

  useEffect(() => {
    dispatch(fetchCalls({ id: eventId, participantId: participant._id }))
      .unwrap()
      .then((data) => setCalls(data.calls))
      .catch((message) => {
        toast.error(message);
        setCalls([]);
      });
  }, [dispatch, eventId, participant._id]);

  const answered = calls?.filter((c) => c.callStatus === "ANSWERED").length || 0;

  return (
    <Modal title="Call Logs" onClose={onClose} wide>
      <div className="flex items-center gap-3 mb-5">
        <Avatar member={member} className="h-12 w-12" />
        <div>
          <p className="font-semibold text-royal-900">{fullName(member)}</p>
          <p className="text-sm text-gray-500">{member.mobileNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Total Calls">{participant.callCount}</Stat>
        <Stat label="Answered">{calls ? answered : "–"}</Stat>
        <Stat label="Last Call">{participant.lastCalledAt ? formatDateTime(participant.lastCalledAt) : "—"}</Stat>
        <Stat label="Participant Status">
          <Badge map={PARTICIPATION} value={participant.participationStatus} />
        </Stat>
      </div>

      <div className="max-h-96 overflow-y-auto pr-1">
        {calls === null ? (
          <p className="py-8 text-center text-gray-500">Loading...</p>
        ) : calls.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No calls made yet</p>
        ) : (
          <ol className="relative border-l-2 border-gray-200 ml-2 space-y-4">
            {calls.map((c, i) => (
              <li key={c._id} className="ml-5 relative">
                <span className={`absolute -left-[27px] top-4 h-3 w-3 rounded-full ring-4 ring-white ${DOT[c.callStatus] || "bg-gray-400"}`} />
                <div className="rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">Call #{calls.length - i}</span>
                      <Badge map={CALL_STATUS} value={c.callStatus} />
                    </div>
                    <span className="text-xs text-gray-500">{formatDateTime(c.calledAt)}</span>
                  </div>

                  <p className={`mt-3 text-sm ${c.callResponse ? "text-gray-800" : "italic text-gray-400"}`}>{c.callResponse || "No response noted"}</p>

                  {c.calledBy?.name && <p className="mt-2 text-xs text-gray-400">Called by {c.calledBy.name}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
};

export default CallLogsModal;

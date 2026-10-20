import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ConfirmModal from "../components/admin/ConfirmModal";
import { updateMemberStatus } from "../features/members/membersSlice";
import { fullName } from "../utils/format";

// Active/Inactive confirmation modal + API call + toast (Members list aur Profile dono use karte hain)
const useMemberStatusToggle = (onDone) => {
  const dispatch = useDispatch();
  const saving = useSelector((s) => s.members.statusUpdating);
  const [member, setMember] = useState(null);

  const nextStatus = member?.memberStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const deactivating = nextStatus === "INACTIVE";

  const handleConfirm = async () => {
    try {
      const res = await dispatch(updateMemberStatus({ id: member._id, memberStatus: nextStatus })).unwrap();
      toast.success(res.message);
      onDone?.();
    } catch (message) {
      toast.error(message);
    } finally {
      setMember(null);
    }
  };

  const modal = member && (
    <ConfirmModal
      title={deactivating ? "Deactivate member?" : "Activate member?"}
      message={`Are you sure you want to ${deactivating ? "deactivate" : "activate"} ${fullName(member)}?`}
      confirmText={deactivating ? "Deactivate" : "Activate"}
      danger={deactivating}
      loading={saving}
      onConfirm={handleConfirm}
      onCancel={() => setMember(null)}
    />
  );

  return { requestToggle: setMember, modal };
};

export default useMemberStatusToggle;

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Avatar from "../../components/admin/Avatar";
import ReferredMembersTab from "../../components/admin/ReferredMembersTab";
import StatusBadge from "../../components/admin/StatusBadge";
import { fetchMember } from "../../features/members/membersSlice";
import useMemberStatusToggle from "../../hooks/useMemberStatusToggle";
import { formatDate, fullName } from "../../utils/format";

const Card = ({ title, children }) => (
  <section className="bg-white rounded-2xl shadow p-6">
    <h3 className="text-lg font-bold text-royal-900 mb-4 pb-2 border-b border-royal-100">{title}</h3>
    {children}
  </section>
);

const Item = ({ label, value }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
    <dd className="mt-0.5 text-gray-800 break-words">{value || "—"}</dd>
  </div>
);

// Family / Nominee / Referral ki chhoti tables
const MiniTable = ({ columns, rows, empty }) =>
  rows.length === 0 ? (
    <p className="text-sm text-gray-500">{empty}</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-royal-50 text-royal-900">
          <tr>
            <th className="px-3 py-2">#</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || i} className="border-t border-gray-100">
              <td className="px-3 py-2">{i + 1}</td>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">{(c.format ? c.format(r[c.key]) : r[c.key]) || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const m = useSelector((s) => s.members.current);
  const [tab, setTab] = useState("info");
  const [loaded, setLoaded] = useState(false); // fetch khatam hone se pehle "not found" / purana profile na dikhe
  const { requestToggle, modal } = useMemberStatusToggle();

  useEffect(() => {
    setLoaded(false);
    setTab("info"); // doosre member ke profile par jaane par wapas Personal Info
    dispatch(fetchMember(id))
      .unwrap()
      .catch((message) => toast.error(message))
      .finally(() => setLoaded(true));
  }, [id, dispatch]);

  // Jis page se aaye the (Members / Important Dates / Referred list) wahin wapas; direct link khola ho to Members list
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/admin/members"));

  const back = (
    <button onClick={goBack} className="inline-block text-sm font-medium text-royal-600 hover:text-royal-700 mb-4">
      ← Back
    </button>
  );

  if (!loaded) return <p className="text-gray-500">Loading profile...</p>;
  if (!m) {
    return (
      <div>
        {back}
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">Member not found</div>
      </div>
    );
  }

  const active = m.memberStatus === "ACTIVE";
  const tabs = [
    { key: "info", label: "Personal Info" },
    { key: "referred", label: `Members Referred (${m.referredCount ?? 0})` },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        {back}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row items-center gap-5">
          <Avatar member={m} className="h-28 w-28 text-3xl" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-royal-900">{fullName(m)}</h2>
            <p className="text-gray-500 mt-1">{m.memberType}</p>
            <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
              <StatusBadge active={active} />
              <span className="rounded-full bg-royal-100 px-2.5 py-1 text-xs font-semibold text-royal-700">
                Referred: {m.referredCount ?? 0}
              </span>
              <span className="text-sm text-gray-400">Registered on {formatDate(m.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/admin/members/${m._id}/edit`} className="rounded-lg bg-gold-500 hover:bg-gold-600 px-4 py-2 font-semibold text-royal-900 transition">
              Edit
            </Link>
            <button
              onClick={() => requestToggle(m)}
              className={`rounded-lg px-4 py-2 font-semibold text-white transition ${
                active ? "bg-red-500 hover:bg-red-600" : "bg-leaf hover:opacity-90"
              }`}
            >
              {active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-royal-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t.key ? "border-royal-600 text-royal-700" : "border-transparent text-gray-500 hover:text-royal-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
      <div className="space-y-6">
      <Card title="Personal Information">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Item label="Name" value={m.name} />
          <Item label="Father's / Husband's Name" value={m.fatherHusbandName} />
          <Item label="Surname" value={m.surname} />
          <Item label="Member Type" value={m.memberType} />
          <Item label="Blood Group" value={m.bloodGroup} />
          <Item label="Aadhar Number" value={m.aadharNumber} />
          <Item label="Occupation" value={m.occupation} />
          <Item label="Date of Birth" value={formatDate(m.birthDate)} />
          <Item label="Wedding Anniversary" value={formatDate(m.anniversaryDate)} />
        </dl>
      </Card>

      <Card title="Contact & Address">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Item label="Mobile" value={m.mobileNumber && `+91 ${m.mobileNumber}`} />
          <Item label="Email" value={m.email} />
          <Item label="Pincode" value={m.pincode} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Item label="Address" value={m.address} />
          </div>
        </dl>
      </Card>

      <Card title={`Family Members (${m.familyMembers.length})`}>
        <MiniTable
          empty="No family members added"
          rows={m.familyMembers}
          columns={[
            { key: "name", label: "Name" },
            { key: "relation", label: "Relation" },
            { key: "dob", label: "DOB", format: (v) => (v ? formatDate(v) : "") },
            { key: "mobile", label: "Mobile" },
          ]}
        />
      </Card>

      <Card title={`Nominees (${m.nominees.length})`}>
        <MiniTable
          empty="No nominees added"
          rows={m.nominees}
          columns={[
            { key: "name", label: "Name" },
            { key: "relation", label: "Relation" },
            { key: "mobile", label: "Mobile" },
          ]}
        />
      </Card>

      <Card title="Referred By">
        <MiniTable
          empty="No referral"
          rows={m.referrals}
          columns={[
            { key: "name", label: "Referred By" },
            { key: "mobile", label: "Referrer's Mobile" },
          ]}
        />
      </Card>

      </div>
      )}

      {tab === "referred" && <ReferredMembersTab memberId={m._id} />}

      {modal}
    </div>
  );
};

export default MemberProfile;

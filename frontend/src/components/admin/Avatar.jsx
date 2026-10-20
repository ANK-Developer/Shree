import { initials, photoSrc } from "../../utils/format";

// Photo ho to photo, warna naam ke initials
const Avatar = ({ member, className = "h-10 w-10 text-sm" }) =>
  member?.photoUrl ? (
    <img src={photoSrc(member.photoUrl)} alt={member.name} className={`${className} rounded-full object-cover bg-royal-100 shrink-0`} />
  ) : (
    <span className={`${className} rounded-full bg-royal-100 text-royal-700 font-semibold grid place-items-center shrink-0`}>
      {initials(member) || "?"}
    </span>
  );

export default Avatar;

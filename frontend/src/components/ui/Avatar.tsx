import { useState } from "react";

interface AvatarProps {
  name?: string;
  email?: string;
  picture?: string;
  size?: "sm" | "md" | "lg";
}

function Avatar({
  name,
  email,
  picture,
  size = "md",
}: AvatarProps) {
  const [imageError, setImageError] =
    useState(false);

  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    email
      ?.slice(0, 2)
      .toUpperCase() ||
    "U";

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  if (picture && !imageError) {
    return (
      <img
        src={picture}
        alt={name || "User"}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-[#5b5bf7] font-semibold text-white`}
    >
      {initials}
    </div>
  );
}

export default Avatar;